import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePayrollDto, UpdatePayrollDto, Payroll } from './payroll.entity';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) { }

  async createPayroll(createPayrollDto: CreatePayrollDto, agencyId: string): Promise<Payroll> {
    const payroll = await this.prisma.payroll.create({
      data: {
        ...(createPayrollDto.employeeId && { employeeId: createPayrollDto.employeeId }),
        month: createPayrollDto.month,
        basicSalary: createPayrollDto.basicSalary,
        allowances: createPayrollDto.allowances,
        deductions: createPayrollDto.deductions,
        netPay: createPayrollDto.netPay,
        status: createPayrollDto.status,
        agencyId,
      },
      include: {
        employee: {
          include: { designation: true }
        }
      }
    });

    return this.formatPayroll(payroll);
  }

  async getPayrolls(agencyId: string): Promise<Payroll[]> {
    const payrolls = await this.prisma.payroll.findMany({
      where: { agencyId },
      include: {
        employee: {
          include: { designation: true }
        }
      },
      orderBy: { generatedDate: 'desc' }
    });

    return payrolls.map(payroll => this.formatPayroll(payroll));
  }

  async getPayrollById(id: string, agencyId: string): Promise<Payroll> {
    const payroll = await this.prisma.payroll.findFirst({
      where: { id, agencyId },
      include: {
        employee: {
          include: { designation: true }
        }
      }
    });

    if (!payroll) {
      throw new NotFoundException('Payroll not found');
    }

    return this.formatPayroll(payroll);
  }

  async updatePayroll(id: string, updatePayrollDto: UpdatePayrollDto, agencyId: string): Promise<Payroll> {
    const payroll = await this.prisma.payroll.findFirst({
      where: { id, agencyId }
    });

    if (!payroll) {
      throw new NotFoundException('Payroll not found');
    }

    const updatedPayroll = await this.prisma.payroll.update({
      where: { id },
      data: updatePayrollDto,
      include: {
        employee: {
          include: { designation: true }
        }
      }
    });

    return this.formatPayroll(updatedPayroll);
  }

  async deletePayroll(id: string, agencyId: string): Promise<void> {
    const payroll = await this.prisma.payroll.findFirst({
      where: { id, agencyId }
    });

    if (!payroll) {
      throw new NotFoundException('Payroll not found');
    }

    await this.prisma.payroll.delete({
      where: { id }
    });
  }

  async generateBulkPayroll(month: string, agencyId: string, designationId?: string): Promise<number> {
    // Get active employees, optionally filtered by designation
    const where: any = { agencyId, status: 'ACTIVE' };
    if (designationId) {
      where.designationId = designationId;
    }

    const employees = await this.prisma.employee.findMany({
      where
    });

    let count = 0;
    for (const emp of employees) {
      // Check if payroll already exists for this month and employee
      const existing = await this.prisma.payroll.findFirst({
        where: { employeeId: emp.id, month, agencyId }
      });

      if (!existing) {
        const basicSalary = (emp as any).basicSalary || 0;
        await this.prisma.payroll.create({
          data: {
            employeeId: emp.id,
            month,
            basicSalary: basicSalary,
            allowances: 0,
            deductions: 0,
            netPay: basicSalary,
            status: 'DRAFT',
            agencyId
          }
        });
        count++;
      }
    }
    return count;
  }

  async generateIndividual(data: { employeeId: string, month: string, amount: number }, agencyId: string): Promise<Payroll> {
    // 1. Validate employee exists within this agency
    const employee = await this.prisma.employee.findFirst({
      where: { id: data.employeeId, agencyId }
    });

    if (!employee) {
      throw new Error('Employee not found in this agency context');
    }

    // 2. Check if payroll already exists for this month and employee
    const existing = await this.prisma.payroll.findFirst({
      where: { employeeId: data.employeeId, month: data.month, agencyId }
    });

    if (existing) {
      throw new Error('Payroll record already exists for this employee for the selected month');
    }

    const payroll = await this.prisma.payroll.create({
      data: {
        employeeId: data.employeeId,
        month: data.month,
        basicSalary: data.amount,
        allowances: 0,
        deductions: 0,
        netPay: data.amount,
        status: 'DRAFT',
        agencyId
      },
      include: {
        employee: {
          include: { designation: true }
        }
      }
    });

    return this.formatPayroll(payroll);
  }

  async updateStatus(id: string, status: string, agencyId: string): Promise<Payroll> {
    const payroll = await this.prisma.payroll.findFirst({
      where: { id, agencyId }
    });

    if (!payroll) {
      throw new NotFoundException('Payroll not found');
    }

    const updated = await this.prisma.payroll.update({
      where: { id },
      data: { status },
      include: {
        employee: {
          include: { designation: true }
        }
      }
    });

    return this.formatPayroll(updated);
  }

  private formatPayroll(payroll: any): Payroll {
    return {
      id: payroll.id,
      employeeId: payroll.employeeId,
      month: payroll.month,
      basicSalary: payroll.basicSalary,
      allowances: payroll.allowances,
      deductions: payroll.deductions,
      netPay: payroll.netPay,
      status: payroll.status,
      generatedDate: payroll.generatedDate,
      updatedAt: payroll.updatedAt,
      employee: payroll.employee ? {
        id: payroll.employee.id,
        fullName: payroll.employee.fullName,
        email: payroll.employee.email || '',
        designation: {
          name: payroll.employee.designation?.name || ''
        }
      } : undefined
    };
  }
}
