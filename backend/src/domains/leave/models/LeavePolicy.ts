import { Schema, model, Types } from 'mongoose';
import { BaseDocument } from '@/shared/types/common';

export interface PolicyAllocation {
    leaveType: string;
    totalDays: number;
}

export interface LeavePolicy extends BaseDocument {
    organizationId: Types.ObjectId;
    allocations: PolicyAllocation[];
    rules: {
        carryForward: boolean; // Not used yet, but good for future
        encashment: boolean;
    };
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
}

const PolicyAllocationSchema = new Schema<PolicyAllocation>({
    leaveType: { type: String, required: true },
    totalDays: { type: Number, required: true, min: 0 },
}, { _id: false });

const LeavePolicySchema = new Schema<LeavePolicy>({
    organizationId: { type: Schema.Types.ObjectId, required: true, unique: true, index: true, ref: 'Organization' },
    allocations: { type: [PolicyAllocationSchema], default: [] },
    rules: {
        carryForward: { type: Boolean, default: false },
        encashment: { type: Boolean, default: false },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const LeavePolicyModel = model<LeavePolicy>('LeavePolicy', LeavePolicySchema);
