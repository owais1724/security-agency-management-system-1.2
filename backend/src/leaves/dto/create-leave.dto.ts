
import { IsEnum, IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';
import { LeaveType } from '../leave.entity';

export class CreateLeaveRequestDto {
    @IsNotEmpty()
    @IsString()
    employeeId: string;

    @IsNotEmpty()
    @IsEnum(LeaveType)
    leaveType: LeaveType;

    @IsNotEmpty()
    @IsDateString()
    startDate: string;

    @IsNotEmpty()
    @IsDateString()
    endDate: string;

    @IsNotEmpty()
    @IsString()
    reason: string;
}
