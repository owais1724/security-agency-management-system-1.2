export interface CreatePayrollDto {
  employeeId?: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: string;
}

export interface UpdatePayrollDto {
  status?: string;
  basicSalary?: number;
  allowances?: number;
  deductions?: number;
  netPay?: number;
}

export interface Payroll {
  id: string;
  employeeId?: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: string;
  generatedDate: Date;
  updatedAt: Date;
  employee?: {
    id: string;
    fullName: string;
    email: string;
    designation: {
      name: string;
    };
  };
}
