
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LeaveStatus } from '../leave.entity';

export class LeaveApprovalDto {
    @IsEnum(LeaveStatus)
    status: LeaveStatus;

    @IsOptional()
    @IsString()
    rejectionReason?: string;
}
