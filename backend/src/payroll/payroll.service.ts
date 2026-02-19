import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePayrollDto, UpdatePayrollDto, Payroll } from './payroll.entity';
import { Prisma } from '@prisma/client';

type PayrollWithRelations = Prisma.PayrollGetPayload<{
  include: {
    employee: {
      include: { designation: true }
    }
  }
}>;

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) { }

  async createPayroll(createPayrollDto: CreatePayrollDto, agencyId: string): Promise<Payroll> {
    const payroll = await this.prisma.payroll.create({
      data: {
        employeeId: createPayrollDto.employeeId,
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

    return this.formatPayroll(payroll as PayrollWithRelations);
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

    return payrolls.map(payroll => this.formatPayroll(payroll as PayrollWithRelations));
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

    return this.formatPayroll(payroll as PayrollWithRelations);
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

    return this.formatPayroll(updatedPayroll as PayrollWithRelations);
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

  private formatPayroll(payroll: PayrollWithRelations): Payroll {
    return {
      id: payroll.id,
      employeeId: payroll.employeeId || undefined,
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

