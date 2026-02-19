import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaveStatus, LeaveType, CreateLeaveRequest, LeaveRequest, LeaveApproval } from './leave.entity';
import { Prisma } from '@prisma/client';

// Define the type for Leave with its relations included
type LeaveWithRelations = Prisma.LeaveGetPayload<{
  include: {
    employee: {
      include: {
        designation: true;
        user: {
          include: { role: true };
        };
      };
    };
  };
}>;

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) { }

  async createLeaveRequest(createLeaveDto: CreateLeaveRequest, agencyId: string): Promise<LeaveRequest> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: createLeaveDto.employeeId },
      include: {
        designation: true,
        user: {
          include: { role: true }
        }
      }
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const leaveRequest = await this.prisma.leave.create({
      data: {
        employeeId: createLeaveDto.employeeId,
        leaveType: createLeaveDto.leaveType,
        startDate: createLeaveDto.startDate,
        endDate: createLeaveDto.endDate,
        reason: createLeaveDto.reason,
        status: LeaveStatus.PENDING,
        agencyId: employee.agencyId,
      },
      include: {
        employee: {
          include: {
            designation: true,
            user: {
              include: { role: true }
            }
          }
        }
      }
    });

    return this.formatLeaveRequest(leaveRequest as LeaveWithRelations);
  }

  async getLeaveRequests(agencyId: string, userRole: string, userId: string): Promise<LeaveRequest[]> {
    let whereClause: Prisma.LeaveWhereInput = { employee: { agencyId } };

    const normalizedRole = userRole?.toUpperCase().replace(/\s+/g, '_');

    if (normalizedRole === 'GUARD') {
      whereClause = { ...whereClause, employeeId: userId };
    } else if (normalizedRole === 'SUPERVISOR') {
      whereClause = { ...whereClause, status: LeaveStatus.PENDING };
    } else if (normalizedRole === 'HR') {
      whereClause = { ...whereClause, status: LeaveStatus.SUPERVISOR_APPROVED };
    }
    // Admin sees all leaves for the agency (no additional filter)

    const leaveRequests = await this.prisma.leave.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            designation: true,
            user: {
              include: { role: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return leaveRequests.map(lr => this.formatLeaveRequest(lr as LeaveWithRelations));
  }

  async approveLeave(leaveId: string, approvalDto: LeaveApproval, userRole: string, userId: string): Promise<LeaveRequest> {
    const leaveRequest = await this.prisma.leave.findUnique({
      where: { id: leaveId },
      include: { employee: true }
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    const updateData: Prisma.LeaveUpdateInput = {};

    // Normalize role: 'Agency Admin' → 'AGENCY_ADMIN', 'Supervisor' → 'SUPERVISOR'. Remove spaces and uppercase.
    const rawRole = (userRole || '').toUpperCase();
    const role = rawRole.replace(/\s+/g, '_');

    console.log(`[ApproveLeave] User: ${userId}, Raw Role: "${userRole}", Normalized: "${role}", Target Status: ${approvalDto.status}, Current Status: ${leaveRequest.status}`);

    // Handle REJECTION - any authorized role (Supervisor, HR, Admin) can reject
    if (approvalDto.status === 'REJECTED') {
      // Basic check: only superiors should be able to reject
      if (role.includes('SUPERVISOR') || role.includes('HR') || role.includes('ADMIN')) {
        updateData.status = 'REJECTED';
        updateData.rejectionReason = approvalDto.rejectionReason || '';
      } else {
        throw new ForbiddenException(`Your role "${userRole}" is not authorized to reject leaves.`);
      }
    }
    // Supervisor approves PENDING leaves contextually
    // We check for 'SUPERVISOR' in the role name to cover 'Site Supervisor', 'Shift Supervisor', etc.
    else if (role.includes('SUPERVISOR') && leaveRequest.status === 'PENDING') {
      updateData.status = 'SUPERVISOR_APPROVED';
      updateData.supervisorApprovedAt = new Date();
      updateData.supervisorApprovedBy = userId;
    }
    // HR approves SUPERVISOR_APPROVED leaves
    else if (role.includes('HR') && leaveRequest.status === 'SUPERVISOR_APPROVED') {
      updateData.status = 'HR_APPROVED';
      updateData.hrApprovedAt = new Date();
      updateData.hrApprovedBy = userId;
    }
    // Admin can approve at ANY stage - force approves to final state
    else if (role.includes('ADMIN')) {
      updateData.status = 'AGENCY_APPROVED';
      updateData.agencyApprovedAt = new Date();
      updateData.agencyApprovedBy = userId;
    }
    else {
      console.error(`[ApproveLeave] Failed Authorization. Role: ${role}, Status: ${leaveRequest.status}`);
      throw new ForbiddenException(
        `Authorization Failed. Your Role: "${userRole}" (Normalized: ${role}). ` +
        `Required Recommendation: Supervisor for PENDING, HR for SUPERVISOR_APPROVED, or Admin.`
      );
    }

    const updatedLeave = await this.prisma.leave.update({
      where: { id: leaveId },
      data: updateData,
      include: {
        employee: {
          include: {
            designation: true,
            user: {
              include: { role: true }
            }
          }
        }
      }
    });

    return this.formatLeaveRequest(updatedLeave as LeaveWithRelations);
  }

  private formatLeaveRequest(leaveRequest: LeaveWithRelations): LeaveRequest {
    return {
      id: leaveRequest.id,
      employeeId: leaveRequest.employeeId,
      leaveType: leaveRequest.leaveType as LeaveType,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      reason: leaveRequest.reason,
      status: leaveRequest.status as LeaveStatus,
      appliedAt: leaveRequest.appliedAt,
      supervisorApprovedAt: leaveRequest.supervisorApprovedAt || undefined,
      supervisorApprovedBy: leaveRequest.supervisorApprovedBy || undefined,
      hrApprovedAt: leaveRequest.hrApprovedAt || undefined,
      hrApprovedBy: leaveRequest.hrApprovedBy || undefined,
      agencyApprovedAt: leaveRequest.agencyApprovedAt || undefined,
      agencyApprovedBy: leaveRequest.agencyApprovedBy || undefined,
      rejectionReason: leaveRequest.rejectionReason || undefined,
      employee: {
        id: leaveRequest.employee.id,
        name: leaveRequest.employee.fullName,
        email: leaveRequest.employee.email || '',
        role: leaveRequest.employee.user?.role?.name || 'GUEST',
        designation: {
          name: leaveRequest.employee.designation?.name || 'N/A'
        }
      }
    };
  }
}

