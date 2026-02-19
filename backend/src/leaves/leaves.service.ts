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

    if (userRole === 'GUARD') {
      whereClause = { ...whereClause, employeeId: userId };
    } else if (userRole === 'SUPERVISOR') {
      whereClause = { ...whereClause, status: LeaveStatus.PENDING };
    } else if (userRole === 'HR') {
      whereClause = { ...whereClause, status: LeaveStatus.SUPERVISOR_APPROVED };
    }

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

    if (userRole === 'SUPERVISOR' && leaveRequest.status === LeaveStatus.PENDING) {
      if (approvalDto.status === LeaveStatus.REJECTED) {
        updateData.status = LeaveStatus.REJECTED;
        updateData.rejectionReason = approvalDto.rejectionReason;
      } else if (approvalDto.status === LeaveStatus.SUPERVISOR_APPROVED) {
        updateData.status = LeaveStatus.SUPERVISOR_APPROVED;
        updateData.supervisorApprovedAt = new Date();
        updateData.supervisorApprovedBy = userId;
      } else {
        throw new ForbiddenException('Invalid status transition');
      }
    } else if (userRole === 'HR' && leaveRequest.status === LeaveStatus.SUPERVISOR_APPROVED) {
      if (approvalDto.status === LeaveStatus.REJECTED) {
        updateData.status = LeaveStatus.REJECTED;
        updateData.rejectionReason = approvalDto.rejectionReason;
      } else if (approvalDto.status === LeaveStatus.HR_APPROVED) {
        updateData.status = LeaveStatus.HR_APPROVED;
        updateData.hrApprovedAt = new Date();
        updateData.hrApprovedBy = userId;
      } else {
        throw new ForbiddenException('Invalid status transition');
      }
    } else if (userRole === 'AGENCY_ADMIN' && leaveRequest.status === LeaveStatus.HR_APPROVED) {
      if (approvalDto.status === LeaveStatus.REJECTED) {
        updateData.status = LeaveStatus.REJECTED;
        updateData.rejectionReason = approvalDto.rejectionReason;
      } else if (approvalDto.status === LeaveStatus.AGENCY_APPROVED) {
        updateData.status = LeaveStatus.AGENCY_APPROVED;
        updateData.agencyApprovedAt = new Date();
        updateData.agencyApprovedBy = userId;
      } else {
        throw new ForbiddenException('Invalid status transition');
      }
    } else {
      throw new ForbiddenException('You are not authorized to perform this action');
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

