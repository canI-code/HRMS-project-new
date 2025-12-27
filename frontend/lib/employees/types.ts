export type EmploymentType = "full_time" | "part_time" | "contract" | "intern" | "temporary";

export type EmployeeStatus = "active" | "on_leave" | "terminated";

export type Gender = "male" | "female" | "other";

export type MaritalStatus = "single" | "married" | "divorced" | "widowed";

export type OnboardingStatus = "not_started" | "in_progress" | "completed";

export interface ContactInfo {
  email: string;
  phone?: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface EmployeeDocumentRef {
  documentId: string;
  type: string;
  uploadedAt: string;
}

export interface PayrollInfo {
  salaryCurrency?: string;
  baseSalary?: number;
  variablePayPercent?: number;
  benefits?: string[];
}

export interface OnboardingStep {
  name: string;
  completedAt?: string;
}

export interface Onboarding {
  status: OnboardingStatus;
  steps: OnboardingStep[];
  startedAt?: string;
  completedAt?: string;
}

export interface Employee {
  _id: string;
  organizationId: string;
  userId?: string;
  employeeCode: string;

  personal: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth?: string;
    gender?: Gender;
    maritalStatus?: MaritalStatus;
    contact: ContactInfo;
    addresses?: {
      current?: Address;
      permanent?: Address;
    };
    emergencyContacts?: EmergencyContact[];
  };

  professional: {
    department?: string;
    title?: string;
    location?: string;
    employmentType: EmploymentType;
    startDate: string;
    endDate?: string;
    status: EmployeeStatus;
    managerId?: string;
  };

  reporting?: {
    directReportIds?: string[];
  };

  onboarding?: Onboarding;
  documents?: EmployeeDocumentRef[];
  payroll?: PayrollInfo;

  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface CreateEmployeePayload {
  organizationId?: string; // Optional since AuthUser doesn't have it, but backend requires it
  employeeCode: string;
  personal: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth?: string;
    gender?: Gender;
    maritalStatus?: MaritalStatus;
    contact: ContactInfo;
    addresses?: {
      current?: Address;
      permanent?: Address;
    };
    emergencyContacts?: EmergencyContact[];
  };
  professional: {
    department?: string;
    title?: string;
    location?: string;
    employmentType: EmploymentType;
    startDate: string;
    status?: EmployeeStatus;
    managerId?: string;
  };
  payroll?: PayrollInfo;
}

export interface UpdateEmployeePayload extends Partial<CreateEmployeePayload> {}

export interface EmployeeListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  department?: string;
  status?: EmployeeStatus;
  employmentType?: EmploymentType;
  search?: string;
}

export interface EmployeeListResponse {
  employees: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
