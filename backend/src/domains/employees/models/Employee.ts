import { Schema, model, Types } from 'mongoose';
import { BaseDocument } from '@/shared/types/common';

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERN = 'intern',
  TEMPORARY = 'temporary',
}

export enum EmployeeStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
}

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
  documentId: Types.ObjectId;
  type: string; // e.g., 'ID_PROOF', 'OFFER_LETTER'
  uploadedAt: Date;
}

export interface PayrollInfo {
  salaryCurrency?: string;
  baseSalary?: number; // monthly base
  variablePayPercent?: number;
  benefits?: string[];
}

export interface Employee extends BaseDocument {
  organizationId: Types.ObjectId;
  userId?: Types.ObjectId; // link to auth user if exists
  employeeCode: string; // unique per organization

  personal: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
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
    startDate: Date;
    endDate?: Date;
    status: EmployeeStatus;
    managerId?: Types.ObjectId; // reporting manager
  };

  reporting?: {
    directReportIds?: Types.ObjectId[]; // maintained by service
  };

  onboarding?: {
    status: 'not_started' | 'in_progress' | 'completed';
    steps: { name: string; completedAt?: Date }[];
    startedAt?: Date;
    completedAt?: Date;
    otpHash?: string;
    otpExpires?: Date;
  };

  documents?: EmployeeDocumentRef[];
  payroll?: PayrollInfo;
}

const ContactInfoSchema = new Schema<ContactInfo>({
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String },
}, { _id: false });

const AddressSchema = new Schema<Address>({
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String },
  country: { type: String, required: true },
  postalCode: { type: String },
}, { _id: false });

const EmergencyContactSchema = new Schema<EmergencyContact>({
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  phone: { type: String, required: true },
}, { _id: false });

const EmployeeDocumentRefSchema = new Schema<EmployeeDocumentRef>({
  documentId: { type: Schema.Types.ObjectId, required: true, ref: 'Document' },
  type: { type: String, required: true, trim: true },
  uploadedAt: { type: Date, required: true, default: () => new Date() },
}, { _id: false });

const PayrollInfoSchema = new Schema<PayrollInfo>({
  salaryCurrency: { type: String, default: 'USD' },
  baseSalary: { type: Number, min: 0 },
  variablePayPercent: { type: Number, min: 0, max: 100 },
  benefits: { type: [String], default: [] },
}, { _id: false });

const EmployeeSchema = new Schema<Employee>({
  organizationId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Organization' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  employeeCode: { type: String, required: true, trim: true },

  personal: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
    contact: { type: ContactInfoSchema, required: true },
    addresses: {
      current: { type: AddressSchema },
      permanent: { type: AddressSchema },
    },
    emergencyContacts: { type: [EmergencyContactSchema], default: [] },
  },

  professional: {
    department: { type: String, trim: true },
    title: { type: String, trim: true },
    location: { type: String, trim: true },
    employmentType: { type: String, enum: Object.values(EmploymentType), required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: { type: String, enum: Object.values(EmployeeStatus), required: true, default: EmployeeStatus.ACTIVE },
    managerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  },

  reporting: {
    directReportIds: { type: [Schema.Types.ObjectId], ref: 'Employee', default: [] },
  },

  onboarding: {
    status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
    steps: { type: [{ name: { type: String, required: true }, completedAt: { type: Date } }], default: [] },
    startedAt: { type: Date },
    completedAt: { type: Date },
    otpHash: { type: String }, // For OTP-based account activation
    otpExpires: { type: Date },
  },

  documents: { type: [EmployeeDocumentRefSchema], default: [] },
  payroll: { type: PayrollInfoSchema },

  // Soft delete and audit
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: Schema.Types.ObjectId },
  createdBy: { type: Schema.Types.ObjectId },
  updatedBy: { type: Schema.Types.ObjectId },
}, { timestamps: true });

// Unique employeeCode within an organization
EmployeeSchema.index({ organizationId: 1, employeeCode: 1 }, { unique: true });

// Manager-employee lookup index
EmployeeSchema.index({ organizationId: 1, 'professional.managerId': 1 });

// Department/title index for searches
EmployeeSchema.index({ organizationId: 1, 'professional.department': 1, 'professional.title': 1 });

// Data validation hooks
EmployeeSchema.pre('save', function (next) {
  // Ensure endDate is after startDate if provided
  const start = this.professional?.startDate;
  const end = this.professional?.endDate;
  if (start && end && end < start) {
    return next(new Error('End date cannot be before start date'));
  }

  // Terminated must have endDate
  if (this.professional?.status === EmployeeStatus.TERMINATED && !this.professional?.endDate) {
    return next(new Error('Terminated employee must have an end date'));
  }

  next();
});

export const EmployeeModel = model<Employee>('Employee', EmployeeSchema);
