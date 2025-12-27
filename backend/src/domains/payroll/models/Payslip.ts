import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPayslipComponent {
  name: string;
  code: string;
  amount: number; // minor units (may hold fractional minor units before final net rounding)
  type: 'earning' | 'deduction';
}

export interface IPayslip extends Document {
  organizationId: Types.ObjectId;
  payrollRunId: Types.ObjectId;
  salaryStructureId: Types.ObjectId;
  structureVersion: number;
  employeeId: Types.ObjectId;
  baseSalary: number; // minor units
  gross: number; // minor units
  deductions: number; // minor units
  net: number; // minor units, rounded half-up to 2 decimals of major currency
  netRounded: number; // minor units integer after round-half-up
  components: IPayslipComponent[];
  createdAt: Date;
  updatedAt: Date;
}

const PayslipComponentSchema = new Schema<IPayslipComponent>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['earning', 'deduction'], required: true },
  },
  { _id: false }
);

const PayslipSchema = new Schema<IPayslip>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    payrollRunId: { type: Schema.Types.ObjectId, ref: 'PayrollRun', required: true, index: true },
    salaryStructureId: { type: Schema.Types.ObjectId, ref: 'SalaryStructure', required: true },
    structureVersion: { type: Number, required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    baseSalary: { type: Number, required: true },
    gross: { type: Number, required: true },
    deductions: { type: Number, required: true },
    net: { type: Number, required: true },
    netRounded: { type: Number, required: true },
    components: { type: [PayslipComponentSchema], required: true },
  },
  { timestamps: true }
);

PayslipSchema.index({ payrollRunId: 1, employeeId: 1 }, { unique: true });

// Immutability enforcement
PayslipSchema.pre('findOneAndUpdate', function (next) {
  next(new Error('Payslip is immutable. Create a new run to change pay.'));
});
PayslipSchema.pre('updateOne', function (next) {
  next(new Error('Payslip is immutable. Create a new run to change pay.'));
});
PayslipSchema.pre('updateMany', function (next) {
  next(new Error('Payslip is immutable. Create a new run to change pay.'));
});

export const PayslipModel = mongoose.model<IPayslip>('Payslip', PayslipSchema);
