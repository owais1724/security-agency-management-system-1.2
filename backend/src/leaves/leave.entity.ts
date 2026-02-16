export enum LeaveStatus {
  PENDING = 'PENDING',
  SUPERVISOR_APPROVED = 'SUPERVISOR_APPROVED',
  HR_APPROVED = 'HR_APPROVED',
  AGENCY_APPROVED = 'AGENCY_APPROVED',
  REJECTED = 'REJECTED'
}

export enum LeaveType {
  SICK = 'SICK',
  CASUAL = 'CASUAL',
  ANNUAL = 'ANNUAL',
  EMERGENCY = 'EMERGENCY'
}

export interface CreateLeaveRequest {
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveStatus;
  appliedAt: Date;
  supervisorApprovedAt?: Date;
  supervisorApprovedBy?: string;
  hrApprovedAt?: Date;
  hrApprovedBy?: string;
  agencyApprovedAt?: Date;
  agencyApprovedBy?: string;
  rejectionReason?: string;
  pendingWith?: string;
  employee: {
    id: string;
    name: string;
    email: string;
    role: string;
    designation: {
      name: string;
    };
  };
  supervisorApprovals?: {
    id: string;
    name: string;
    email: string;
  };
  hrApprovals?: {
    id: string;
    name: string;
    email: string;
  };
  agencyApprovals?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface LeaveApproval {
  status: LeaveStatus;
  rejectionReason?: string;
}
