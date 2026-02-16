import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaveStatus, LeaveType, LeaveRequest } from './leave.entity';
import { CreateLeaveRequestDto } from './dto/create-leave.dto';
import { LeaveApprovalDto } from './dto/approve-leave.dto';

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) { }

  async createLeaveRequest(createLeaveDto: CreateLeaveRequestDto, agencyId: string): Promise<LeaveRequest> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: createLeaveDto.employeeId },
      include: { designation: true }
    });

    if (!employee || employee.agencyId !== agencyId) {
      throw new NotFoundException('Employee not found in your agency context');
    }

    const isEmergency = createLeaveDto.leaveType?.toString().toUpperCase() === 'EMERGENCY';

    const leaveRequest = await this.prisma.leave.create({
      data: {
        employeeId: createLeaveDto.employeeId,
        leaveType: createLeaveDto.leaveType,
        startDate: new Date(createLeaveDto.startDate),
        endDate: new Date(createLeaveDto.endDate),
        reason: createLeaveDto.reason,
        status: isEmergency ? LeaveStatus.AGENCY_APPROVED : LeaveStatus.PENDING,
        agencyId: employee.agencyId,
        ...(isEmergency && {
          agencyApprovedAt: new Date(),
          agencyApprovedBy: 'SYSTEM_AUTO_EMERGENCY',
          // We leave supervisor and HR approvals null for emergency leaves 
          // so they can be "accepted" later as per business logic
        })
      },
      include: {
        employee: {
          include: { designation: true }
        }
      }
    });

    return this.formatLeaveRequest(leaveRequest);
  }

  async getLeaveRequests(agencyId: string, userRole: string, userId: string): Promise<LeaveRequest[]> {
    if (!agencyId) return [];
    let whereClause: any = { agencyId };

    if (!userRole) return [];

    // Normalize role for comparison
    const role = userRole.toLowerCase();
    const isHR = role.includes('hr');
    const isSupervisor = role.includes('supervisor');
    const isAdmin = role.includes('admin');

    if (isAdmin) {
      whereClause = { agencyId };
    } else {
      const ownLeaves = { employee: { user: { id: userId } } };
      const conditions: any[] = [ownLeaves];

      // skipping logic checks
      const isSupervisorAvailable = await this.isRoleAvailable(agencyId, 'supervisor');
      const isHRAvailable = await this.isRoleAvailable(agencyId, 'hr');

      if (isHR) {
        // HR sees Supervisor-Approved leaves
        conditions.push({
          status: LeaveStatus.SUPERVISOR_APPROVED
        });

        // HR sees Pending leaves if they are next in line (Supervisor absent/missing)
        if (!isSupervisorAvailable) {
          conditions.push({
            status: LeaveStatus.PENDING,
            employee: {
              user: {
                role: {
                  NOT: [
                    { name: { contains: 'admin', mode: 'insensitive' } },
                    { name: { contains: 'hr', mode: 'insensitive' } }
                  ]
                }
              }
            }
          });
        }

        // HR sees pending Supervisor leaves
        conditions.push({
          status: LeaveStatus.PENDING,
          employee: {
            user: {
              role: { name: { contains: 'supervisor', mode: 'insensitive' } }
            }
          }
        });

        // HR sees emergency leaves that need their acceptance (auto-approved but HR not yet signed)
        conditions.push({
          status: LeaveStatus.AGENCY_APPROVED,
          leaveType: LeaveType.EMERGENCY,
          hrApprovedAt: null,
          employee: {
            user: {
              role: {
                NOT: [
                  { name: { contains: 'admin', mode: 'insensitive' } },
                  { name: { contains: 'hr', mode: 'insensitive' } }
                ]
              }
            }
          }
        });

        // HR history
        conditions.push({ hrApprovedBy: userId });
      }

      if (isSupervisor) {
        // Supervisor sees Pending leaves from staff
        conditions.push({
          status: LeaveStatus.PENDING,
          employee: {
            NOT: { user: { id: userId } },
            user: {
              role: {
                NOT: [
                  { name: { contains: 'admin', mode: 'insensitive' } },
                  { name: { contains: 'hr', mode: 'insensitive' } },
                  { name: { contains: 'supervisor', mode: 'insensitive' } }
                ]
              }
            }
          }
        });

        // Supervisor sees emergency leaves for staff that need their acceptance
        conditions.push({
          status: LeaveStatus.AGENCY_APPROVED,
          leaveType: LeaveType.EMERGENCY,
          supervisorApprovedAt: null,
          employee: {
            user: {
              role: {
                NOT: [
                  { name: { contains: 'admin', mode: 'insensitive' } },
                  { name: { contains: 'hr', mode: 'insensitive' } },
                  { name: { contains: 'supervisor', mode: 'insensitive' } }
                ]
              }
            }
          }
        });

        // Supervisor history
        conditions.push({ supervisorApprovedBy: userId });
      }

      whereClause = {
        agencyId,
        OR: conditions
      };
    }

    const leaveRequests = await this.prisma.leave.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            designation: true,
            user: { include: { role: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return leaveRequests.map(lr => this.formatLeaveRequest(lr));
  }

  async approveLeave(leaveId: string, approvalDto: LeaveApprovalDto, userRole: string, userId: string): Promise<LeaveRequest> {
    const leaveRequest = await this.prisma.leave.findUnique({
      where: { id: leaveId },
      include: {
        employee: {
          include: {
            user: {
              include: { role: true }
            }
          }
        }
      }
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    const agencyId = leaveRequest.agencyId;
    const applicantRole = (leaveRequest.employee.user?.role?.name || 'Staff').toLowerCase();
    const updateData: any = {};

    // Rejection is similar for everyone
    if (approvalDto.status === LeaveStatus.REJECTED) {
      updateData.status = LeaveStatus.REJECTED;
      updateData.rejectionReason = approvalDto.rejectionReason;
    } else {
      const role = userRole.toLowerCase();
      const isHR = role.includes('hr');
      const isSupervisor = role.includes('supervisor');
      const isAdmin = role.includes('admin');

      const applicantRole = (leaveRequest.employee.user?.role?.name || 'Staff').toLowerCase();
      const isApplicantAdmin = applicantRole.includes('admin');
      const isApplicantHR = applicantRole.includes('hr');
      const isApplicantSupervisor = applicantRole.includes('supervisor');

      const isEmergency = leaveRequest.leaveType === LeaveType.EMERGENCY;

      // skipping logic checks
      const isSupervisorAvailable = await this.isRoleAvailable(agencyId, 'supervisor');
      const isHRAvailable = await this.isRoleAvailable(agencyId, 'hr');

      if (isAdmin) {
        // Admin approval is always final
        updateData.status = LeaveStatus.AGENCY_APPROVED;
        updateData.agencyApprovedAt = new Date();
        updateData.agencyApprovedBy = userId;

        if (!leaveRequest.supervisorApprovedBy) {
          updateData.supervisorApprovedAt = new Date();
          updateData.supervisorApprovedBy = userId;
        }
        if (!leaveRequest.hrApprovedBy) {
          updateData.hrApprovedAt = new Date();
          updateData.hrApprovedBy = userId;
        }
      } else if (isHR) {
        if (isApplicantAdmin || isApplicantHR) {
          throw new ForbiddenException('HR leaves can only be approved by an Agency Admin');
        }

        updateData.hrApprovedAt = new Date();
        updateData.hrApprovedBy = userId;

        // If it was already approved (Emergency), we just add HR's signature
        if (isEmergency) {
          // Status stays AGENCY_APPROVED
        } else {
          // For normal leaves, HR approval is final (Agency Admin is the fallback)
          updateData.status = LeaveStatus.AGENCY_APPROVED;
          updateData.agencyApprovedAt = new Date();
          updateData.agencyApprovedBy = userId;

          if (!leaveRequest.supervisorApprovedBy) {
            updateData.supervisorApprovedAt = new Date();
            updateData.supervisorApprovedBy = userId;
          }
        }
      } else if (isSupervisor) {
        if (isApplicantAdmin || isApplicantHR || isApplicantSupervisor) {
          throw new ForbiddenException('Supervisors can only approve leaves for frontline staff');
        }

        updateData.supervisorApprovedAt = new Date();
        updateData.supervisorApprovedBy = userId;

        if (isEmergency) {
          // Just adding signature
        } else {
          // If HR is absent/missing, skip to final
          if (!isHRAvailable) {
            updateData.status = LeaveStatus.AGENCY_APPROVED;
            updateData.agencyApprovedAt = new Date();
            updateData.agencyApprovedBy = userId;
            updateData.hrApprovedAt = new Date();
            updateData.hrApprovedBy = userId;
          } else {
            updateData.status = LeaveStatus.SUPERVISOR_APPROVED;
          }
        }
      } else {
        throw new ForbiddenException('You are not authorized to perform this action');
      }
    }

    const updatedLeave = await this.prisma.leave.update({
      where: { id: leaveId },
      data: updateData,
      include: {
        employee: {
          include: { designation: true }
        }
      }
    });

    // Fetch the updated leave with user and role for formatting
    const finalLeave = await this.prisma.leave.findUnique({
      where: { id: leaveId },
      include: {
        employee: {
          include: {
            designation: true,
            user: { include: { role: true } }
          }
        }
      }
    });

    return this.formatLeaveRequest(finalLeave);
  }

  private async isRoleAvailable(agencyId: string, roleNamePart: string): Promise<boolean> {
    const users = await this.prisma.user.findMany({
      where: {
        agencyId,
        role: { name: { contains: roleNamePart, mode: 'insensitive' } },
        isActive: true
      },
      include: { employee: true }
    });

    if (users.length === 0) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const user of users) {
      if (!user.employeeId) return true; // High-level users without employee records are available

      const activeLeave = await this.prisma.leave.findFirst({
        where: {
          employeeId: user.employeeId,
          status: LeaveStatus.AGENCY_APPROVED,
          startDate: { lte: today },
          endDate: { gte: today }
        }
      });
      if (!activeLeave) return true;
    }

    return false;
  }

  private formatLeaveRequest(leaveRequest: any): LeaveRequest {
    let pendingWith = '';
    const status = leaveRequest.status as LeaveStatus;
    const applicantRole = (leaveRequest.employee.user?.role?.name || 'Staff').toLowerCase();
    const isEmergency = leaveRequest.leaveType === LeaveType.EMERGENCY;

    if (status === LeaveStatus.PENDING) {
      if (applicantRole.includes('hr')) {
        pendingWith = 'Agency Admin';
      } else if (applicantRole.includes('supervisor')) {
        pendingWith = 'HR';
      } else {
        pendingWith = 'Supervisor';
      }
    } else if (status === LeaveStatus.SUPERVISOR_APPROVED) {
      pendingWith = 'HR';
    } else if (status === LeaveStatus.HR_APPROVED) {
      pendingWith = 'Agency Admin';
    } else if (status === LeaveStatus.AGENCY_APPROVED && isEmergency) {
      // For emergency leaves, track who still needs to "accept" it
      if (!leaveRequest.supervisorApprovedBy && !applicantRole.includes('supervisor') && !applicantRole.includes('hr') && !applicantRole.includes('admin')) {
        pendingWith = 'Supervisor (Post-Acceptance)';
      } else if (!leaveRequest.hrApprovedBy && !applicantRole.includes('hr') && !applicantRole.includes('admin')) {
        pendingWith = 'HR (Post-Acceptance)';
      } else if (leaveRequest.agencyApprovedBy === 'SYSTEM_AUTO_EMERGENCY') {
        pendingWith = 'Agency Admin (Post-Acceptance)';
      }
    }

    return {
      id: leaveRequest.id,
      employeeId: leaveRequest.employeeId,
      leaveType: leaveRequest.leaveType as LeaveType,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      reason: leaveRequest.reason,
      status: leaveRequest.status as LeaveStatus,
      appliedAt: leaveRequest.appliedAt,
      supervisorApprovedAt: leaveRequest.supervisorApprovedAt,
      supervisorApprovedBy: leaveRequest.supervisorApprovedBy,
      hrApprovedAt: leaveRequest.hrApprovedAt,
      hrApprovedBy: leaveRequest.hrApprovedBy,
      agencyApprovedAt: leaveRequest.agencyApprovedAt,
      agencyApprovedBy: leaveRequest.agencyApprovedBy,
      rejectionReason: leaveRequest.rejectionReason,
      pendingWith: pendingWith,
      employee: {
        id: leaveRequest.employee.id,
        name: leaveRequest.employee.fullName,
        email: leaveRequest.employee.email || '',
        role: leaveRequest.employee.user?.role?.name || 'Staff',
        designation: {
          name: leaveRequest.employee.designation?.name || ''
        }
      }
    };
  }
}
