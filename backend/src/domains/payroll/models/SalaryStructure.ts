import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * SalaryStructure is immutable and versioned. Monetary values are stored as numbers representing minor units
 * (e.g., cents/paise). Percentage components apply to base salary by default unless applyOnBaseOnly is false.
 */
export interface IStructureComponent {
  name: string;
  code: string;
  type: 'earning' | 'deduction';
  calculationType: 'fixed' | 'percentage';
  value: number; // fixed minor units or percentage points
  applyOnBaseOnly?: boolean; // default true; when false percentage may target gross (not implemented yet)
  capAmount?: number; // minor units
}

export interface ISalaryStructure extends Document {
  organizationId: Types.ObjectId;
  name: string;
  version: number;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  components: IStructureComponent[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ComponentSchema = new Schema<IStructureComponent>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    type: { type: String, enum: ['earning', 'deduction'], required: true },
    calculationType: { type: String, enum: ['fixed', 'percentage'], required: true },
    value: { type: Number, required: true },
    applyOnBaseOnly: { type: Boolean, default: true },
    capAmount: { type: Number },
  },
  { _id: false }
);

const SalaryStructureSchema = new Schema<ISalaryStructure>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    version: { type: Number, required: true },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date, default: null },
    components: { type: [ComponentSchema], required: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

SalaryStructureSchema.index({ organizationId: 1, version: 1 }, { unique: true });
SalaryStructureSchema.index({ organizationId: 1, isActive: 1 });

// Prevent updates to immutable structures
SalaryStructureSchema.pre('findOneAndUpdate', function (next) {
  next(new Error('SalaryStructure is immutable and versioned. Create a new version instead.'));
});
SalaryStructureSchema.pre('updateOne', function (next) {
  next(new Error('SalaryStructure is immutable and versioned. Create a new version instead.'));
});
SalaryStructureSchema.pre('updateMany', function (next) {
  next(new Error('SalaryStructure is immutable and versioned. Create a new version instead.'));
});

export const SalaryStructureModel = mongoose.model<ISalaryStructure>('SalaryStructure', SalaryStructureSchema);
