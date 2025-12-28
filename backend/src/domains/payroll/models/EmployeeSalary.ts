import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * EmployeeSalary tracks the salary structure assigned to each employee
 * with their specific base salary and effective dates
 */
export interface IEmployeeSalary extends Document {
  organizationId: Types.ObjectId;
  employeeId: Types.ObjectId;
  salaryStructureId: Types.ObjectId;
  baseSalary: number; // in minor units (paise/cents)
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  status: 'active' | 'inactive';
  remarks?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSalarySchema = new Schema<IEmployeeSalary>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    salaryStructureId: { type: Schema.Types.ObjectId, ref: 'SalaryStructure', required: true },
    baseSalary: { type: Number, required: true },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date, default: null },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    remarks: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

EmployeeSalarySchema.index({ organizationId: 1, employeeId: 1, status: 1 });
EmployeeSalarySchema.index({ organizationId: 1, status: 1, effectiveFrom: 1 });

export const EmployeeSalaryModel = mongoose.model<IEmployeeSalary>('EmployeeSalary', EmployeeSalarySchema);
