export type ComponentType = 'earning' | 'deduction';
export type CalculationType = 'fixed' | 'percentage';

export interface StructureComponent {
  name: string;
  code: string;
  type: ComponentType;
  calculationType: CalculationType;
  value: number;
  applyOnBaseOnly?: boolean;
  capAmount?: number;
}

export interface SalaryStructure {
  _id: string;
  organizationId: string;
  name: string;
  version: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  components: StructureComponent[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStructurePayload {
  name: string;
  effectiveFrom: string;
  components: StructureComponent[];
}

export interface PayrollRun {
  _id: string;
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalEmployees: number;
  processedEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StartRunPayload {
  periodStart: string;
  periodEnd: string;
  employees?: Array<{
    employeeId: string;
    baseSalary: number;
  }>;
}

export interface Payslip {
  _id: string;
  organizationId: string;
  payrollRunId: {
    _id: string;
    periodStart: string;
    periodEnd: string;
    status: string;
  };
  employeeId: {
    _id: string;
    personal: {
      firstName: string;
      lastName: string;
    };
    professional: {
      department?: string;
      title?: string;
    };
    employeeCode: string;
  };
  baseSalary: number;
  gross: number;
  deductions: number;
  net: number;
  netRounded: number;
  components: Array<{
    name: string;
    code: string;
    amount: number;
    type: 'earning' | 'deduction';
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSalary {
  _id: string;
  organizationId: string;
  employeeId: string;
  salaryStructureId: SalaryStructure;
  baseSalary: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: "active" | "inactive";
  remarks?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeWithSalary {
  employeeId: {
    _id: string;
    personal: {
      firstName: string;
      lastName: string;
    };
    professional: {
      department?: string;
      title?: string;
    };
    employeeCode: string;
  };
  salary: EmployeeSalary | null;
}

export interface AssignSalaryPayload {
  employeeId: string;
  salaryStructureId: string;
  baseSalary: number;
  effectiveFrom?: string;
  remarks?: string;
}
