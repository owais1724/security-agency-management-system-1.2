import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PayrollService } from './payroll.service';
import { type CreatePayrollDto, type UpdatePayrollDto } from './payroll.entity';

@Controller('payrolls')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) { }

  @Post()
  async createPayroll(@Body() createPayrollDto: CreatePayrollDto, @Request() req) {
    const agencyId = req.user.agencyId;
    return this.payrollService.createPayroll(createPayrollDto, agencyId);
  }

  @Get()
  async getPayrolls(@Request() req) {
    const agencyId = req.user.agencyId;
    return this.payrollService.getPayrolls(agencyId);
  }

  @Get(':id')
  async getPayrollById(@Param('id') id: string, @Request() req) {
    const agencyId = req.user.agencyId;
    return this.payrollService.getPayrollById(id, agencyId);
  }

  @Put(':id')
  async updatePayroll(
    @Param('id') id: string,
    @Body() updatePayrollDto: UpdatePayrollDto,
    @Request() req
  ) {
    const agencyId = req.user.agencyId;
    return this.payrollService.updatePayroll(id, updatePayrollDto, agencyId);
  }

  @Delete(':id')
  async deletePayroll(@Param('id') id: string, @Request() req) {
    const agencyId = req.user.agencyId;
    return this.payrollService.deletePayroll(id, agencyId);
  }

  @Post('generate-bulk')
  async generateBulkPayroll(
    @Body('month') month: string,
    @Body('designationId') designationId: string,
    @Request() req
  ) {
    const agencyId = req.user.agencyId;
    return this.payrollService.generateBulkPayroll(month, agencyId, designationId);
  }

  @Post(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Request() req
  ) {
    const agencyId = req.user.agencyId;
    return this.payrollService.updateStatus(id, status, agencyId);
  }

  @Post('generate-individual')
  async generateIndividual(
    @Body() data: { employeeId: string, month: string, amount: number },
    @Request() req
  ) {
    const agencyId = req.user.agencyId;
    return this.payrollService.generateIndividual(data, agencyId);
  }
}
