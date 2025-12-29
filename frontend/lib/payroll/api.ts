import { request } from "../api-client";
import type { AuthTokens } from "../auth/types";
import type {
  SalaryStructure,
  CreateStructurePayload,
  PayrollRun,
  StartRunPayload,
  Payslip,
  EmployeeSalary,
  EmployeeWithSalary,
  AssignSalaryPayload,
  PayrollSummary,
  DepartmentReport,
} from "./types";

export const payrollApi = {
  async createStructure(payload: CreateStructurePayload, tokens: AuthTokens): Promise<SalaryStructure> {
    return request<SalaryStructure>("/payroll/structures", {
      method: "POST",
      tokens,
      body: payload,
    });
  },

  async getActiveStructure(tokens: AuthTokens): Promise<SalaryStructure> {
    return request<SalaryStructure>("/payroll/structures/active", {
      method: "GET",
      tokens,
    });
  },

  async startRun(payload: StartRunPayload, tokens: AuthTokens): Promise<PayrollRun> {
    return request<PayrollRun>("/payroll/runs", {
      method: "POST",
      tokens,
      body: payload,
    });
  },

  async getRun(runId: string, tokens: AuthTokens): Promise<PayrollRun> {
    return request<PayrollRun>(`/payroll/runs/${runId}`, {
      method: "GET",
      tokens,
    });
  },

  async listPayslips(runId: string, tokens: AuthTokens): Promise<Payslip[]> {
    return request<Payslip[]>(`/payroll/runs/${runId}/payslips`, {
      method: "GET",
      tokens,
    });
  },

  async listMyPayslips(tokens: AuthTokens): Promise<Payslip[]> {
    return request<Payslip[]>("/payroll/my-payslips", {
      method: "GET",
      tokens,
    });
  },

  async getMyPayslip(payslipId: string, tokens: AuthTokens): Promise<Payslip> {
    return request<Payslip>(`/payroll/my-payslips/${payslipId}`, {
      method: "GET",
      tokens,
    });
  },

  async getPayslip(payslipId: string, tokens: AuthTokens): Promise<Payslip> {
    return request<Payslip>(`/payroll/payslips/${payslipId}`, {
      method: "GET",
      tokens,
    });
  },

  async assignSalary(payload: AssignSalaryPayload, tokens: AuthTokens): Promise<EmployeeSalary> {
    return request<EmployeeSalary>("/payroll/employees/assign-salary", {
      method: "POST",
      tokens,
      body: payload,
    });
  },

  async listEmployeesWithSalary(tokens: AuthTokens): Promise<EmployeeWithSalary[]> {
    return request<EmployeeWithSalary[]>("/payroll/employees/with-salary", {
      method: "GET",
      tokens,
    });
  },

  async getEmployeeSalary(employeeId: string, tokens: AuthTokens): Promise<EmployeeSalary> {
    return request<EmployeeSalary>(`/payroll/employees/${employeeId}/salary`, {
      method: "GET",
      tokens,
    });
  },

  async getPayrollSummary(tokens: AuthTokens, params?: { startDate?: string; endDate?: string }): Promise<PayrollSummary> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    const queryString = query.toString();
    
    return request<PayrollSummary>(`/payroll/reports/summary${queryString ? `?${queryString}` : ""}`, {
      method: "GET",
      tokens,
    });
  },

  async getDepartmentReport(tokens: AuthTokens, params?: { startDate?: string; endDate?: string }): Promise<DepartmentReport[]> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    const queryString = query.toString();
    
    return request<DepartmentReport[]>(`/payroll/reports/department${queryString ? `?${queryString}` : ""}`, {
      method: "GET",
      tokens,
    });
  },
};
