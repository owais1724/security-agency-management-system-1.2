import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { LeavesService } from './leaves.service';
import { LeaveStatus, LeaveType } from './leave.entity';
import { CreateLeaveRequestDto } from './dto/create-leave.dto';
import { LeaveApprovalDto } from './dto/approve-leave.dto';

@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createLeaveRequest(@Body() createLeaveDto: CreateLeaveRequestDto, @Request() req) {
    return this.leavesService.createLeaveRequest(createLeaveDto, req.user.agencyId);
  }


  @Get()
  @UseGuards(JwtAuthGuard)
  async getLeaveRequests(@Request() req) {
    const agencyId = req.user.agencyId;
    const userRole = req.user.role;
    const userId = req.user.userId;

    return this.leavesService.getLeaveRequests(agencyId, userRole, userId);
  }

  @Put(':id/approve')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('approve_leave')
  async approveLeave(
    @Param('id') leaveId: string,
    @Body() approvalDto: LeaveApprovalDto,
    @Request() req
  ) {
    const userRole = req.user.role;
    const userId = req.user.userId;

    return this.leavesService.approveLeave(leaveId, approvalDto, userRole, userId);
  }

  @Get('types')
  async getLeaveTypes() {
    return Object.values(LeaveType);
  }

  @Get('statuses')
  async getLeaveStatuses() {
    return Object.values(LeaveStatus);
  }
}
