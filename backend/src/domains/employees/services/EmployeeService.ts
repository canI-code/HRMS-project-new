import { Types } from 'mongoose';
import { EmployeeModel, EmployeeStatus } from '@/domains/employees/models/Employee';
import { auditLogStore } from '@/shared/middleware/auditLogger';
import { AuditAction, RequestContext } from '@/shared/types/common';
import { AppError } from '@/shared/utils/AppError';

export interface CreateEmployeeInput {
  organizationId: Types.ObjectId;
  employeeCode: string;
  personal: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
    contact: { email: string; phone?: string };
    addresses?: {
      current?: {
        line1: string; line2?: string; city: string; state?: string; country: string; postalCode?: string;
      };
      permanent?: {
        line1: string; line2?: string; city: string; state?: string; country: string; postalCode?: string;
      };
    };
    emergencyContacts?: { name: string; relationship: string; phone: string }[];
  };
  professional: {
    department?: string;
    title?: string;
    location?: string;
    employmentType: 'full_time' | 'part_time' | 'contract' | 'intern' | 'temporary';
    startDate: Date;
    endDate?: Date;
    status?: 'active' | 'on_leave' | 'terminated';
    managerId?: Types.ObjectId;
  };
  documents?: { documentId: Types.ObjectId; type: string; uploadedAt?: Date }[];
  payroll?: { salaryCurrency?: string; baseSalary?: number; variablePayPercent?: number; benefits?: string[] };
}

export interface UpdateEmployeeInput {
  personal?: Partial<CreateEmployeeInput['personal']>;
  professional?: Partial<CreateEmployeeInput['professional']>;
  documents?: CreateEmployeeInput['documents'];
  payroll?: CreateEmployeeInput['payroll'];
}

export class EmployeeService {
  static async createEmployee(ctx: RequestContext, input: CreateEmployeeInput) {
    const exists = await EmployeeModel.findOne({ organizationId: input.organizationId, employeeCode: input.employeeCode });
    if (exists) {
      throw new AppError('Employee code must be unique within organization', 400, 'EMPLOYEE_CODE_EXISTS');
    }

    const employee = await EmployeeModel.create({
      organizationId: input.organizationId,
      employeeCode: input.employeeCode,
      personal: input.personal,
      professional: {
        ...input.professional,
        status: input.professional.status ?? EmployeeStatus.ACTIVE,
      },
      documents: input.documents ?? [],
      payroll: input.payroll ?? {},
    });

    EmployeeService.log(ctx, AuditAction.CREATE, 'employees', employee._id, undefined, employee);
    return employee;
  }

  static async getEmployeeById(ctx: RequestContext, employeeId: Types.ObjectId) {
    const employee = await EmployeeModel.findOne({ _id: employeeId, organizationId: ctx.organizationId, isDeleted: { $ne: true } });
    if (!employee) {
      throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    }
    return employee;
  }

  static async listEmployees(ctx: RequestContext, { department }: { department?: string } = {}) {
    const q: any = { organizationId: ctx.organizationId, isDeleted: { $ne: true } };
    if (department) q['professional.department'] = department;
    const employees = await EmployeeModel.find(q).limit(100);
    return employees;
  }

  static async updateEmployee(ctx: RequestContext, employeeId: Types.ObjectId, updates: UpdateEmployeeInput) {
    const before = await EmployeeService.getEmployeeById(ctx, employeeId);
    const employee = await EmployeeModel.findOneAndUpdate(
      { _id: employeeId, organizationId: ctx.organizationId, isDeleted: { $ne: true } },
      { $set: updates },
      { new: true }
    );
    if (!employee) throw new AppError('Employee update failed', 400, 'EMPLOYEE_UPDATE_FAILED');

    EmployeeService.log(ctx, AuditAction.UPDATE, 'employees', employee._id, before, employee);
    return employee;
  }

  static async deleteEmployee(ctx: RequestContext, employeeId: Types.ObjectId) {
    const before = await EmployeeService.getEmployeeById(ctx, employeeId);
    const employee = await EmployeeModel.findOneAndUpdate(
      { _id: employeeId, organizationId: ctx.organizationId },
      { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: ctx.userId } },
      { new: true }
    );
    if (!employee) throw new AppError('Employee delete failed', 400, 'EMPLOYEE_DELETE_FAILED');
    EmployeeService.log(ctx, AuditAction.DELETE, 'employees', employee._id, before, employee);
    return employee;
  }

  static async setManager(ctx: RequestContext, employeeId: Types.ObjectId, managerId: Types.ObjectId) {
    if (employeeId.equals(managerId)) {
      throw new AppError('Employee cannot be their own manager', 400, 'INVALID_MANAGER');
    }

    const employee = await EmployeeService.getEmployeeById(ctx, employeeId);
    const manager = await EmployeeService.getEmployeeById(ctx, managerId);

    // Prevent circular reporting: basic check (manager cannot report to employee)
    if (manager.reporting?.directReportIds?.some(r => r.equals(employeeId))) {
      throw new AppError('Circular reporting not allowed', 400, 'CIRCULAR_REPORTING');
    }

    const before = { employee, manager };

    await EmployeeModel.updateOne({ _id: employeeId }, { $set: { 'professional.managerId': managerId } });
    await EmployeeModel.updateOne({ _id: managerId }, { $addToSet: { 'reporting.directReportIds': employeeId } });

    const updatedEmployee = await EmployeeService.getEmployeeById(ctx, employeeId);
    const updatedManager = await EmployeeService.getEmployeeById(ctx, managerId);

    EmployeeService.log(ctx, AuditAction.UPDATE, 'employees', employeeId, before, { employee: updatedEmployee, manager: updatedManager });
    return { employee: updatedEmployee, manager: updatedManager };
  }

  static async terminateEmployee(ctx: RequestContext, employeeId: Types.ObjectId, endDate: Date, reason?: string) {
    const employee = await EmployeeService.getEmployeeById(ctx, employeeId);
    const before = employee;
    const updated = await EmployeeModel.findOneAndUpdate(
      { _id: employeeId, organizationId: ctx.organizationId },
      { $set: { 'professional.status': EmployeeStatus.TERMINATED, 'professional.endDate': endDate } },
      { new: true }
    );
    if (!updated) throw new AppError('Employee termination failed', 400, 'EMPLOYEE_TERMINATION_FAILED');

    EmployeeService.log(ctx, AuditAction.DELETE, 'employees', employeeId, before, { terminated: true, reason });
    return updated;
  }

  static async startOnboarding(ctx: RequestContext, employeeId: Types.ObjectId, steps: string[]) {
    const employee = await EmployeeService.getEmployeeById(ctx, employeeId);
    const before = employee;
    const updated = await EmployeeModel.findOneAndUpdate(
      { _id: employeeId, organizationId: ctx.organizationId },
      { $set: { onboarding: { status: 'in_progress', steps: steps.map(s => ({ name: s })), startedAt: new Date() } } },
      { new: true }
    );
    if (!updated) throw new AppError('Onboarding start failed', 400, 'ONBOARDING_START_FAILED');
    EmployeeService.log(ctx, AuditAction.UPDATE, 'employees', employeeId, before, updated);
    return updated;
  }

  static async completeOnboarding(ctx: RequestContext, employeeId: Types.ObjectId) {
    const employee = await EmployeeService.getEmployeeById(ctx, employeeId);
    const before = employee;
    const updated = await EmployeeModel.findOneAndUpdate(
      { _id: employeeId, organizationId: ctx.organizationId },
      { $set: { 'onboarding.status': 'completed', 'onboarding.completedAt': new Date() } },
      { new: true }
    );
    if (!updated) throw new AppError('Onboarding completion failed', 400, 'ONBOARDING_COMPLETE_FAILED');
    EmployeeService.log(ctx, AuditAction.UPDATE, 'employees', employeeId, before, updated);
    return updated;
  }

  private static log(
    ctx: RequestContext,
    action: AuditAction,
    resource: string,
    resourceId: Types.ObjectId,
    before?: unknown,
    after?: unknown
  ) {
    const entry: any = {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action,
      resource,
      resourceId,
      metadata: {
        ipAddress: ctx.ipAddress || '127.0.0.1',
        userAgent: ctx.userAgent || 'tests',
        requestId: ctx.requestId || 'service-call',
        timestamp: new Date(),
        method: 'SERVICE',
        url: `/service/${resource}`,
        statusCode: 200,
        duration: 0,
      },
      success: true,
    };
    if (before !== undefined || after !== undefined) {
      entry.changes = { before, after };
    }
    auditLogStore.add(entry);
  }
}
