import { Schema, model, Document, Types } from 'mongoose';

/**
 * Organization Configuration Items (Departments, Titles, Locations)
 */
export type ConfigItemType = 'department' | 'title' | 'location';

export interface IConfigItem extends Document {
    organizationId: Types.ObjectId;
    type: ConfigItemType;
    value: string;
    label: string;
    isActive: boolean;
    sortOrder: number;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const configItemSchema = new Schema<IConfigItem>(
    {
        organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
        type: { type: String, enum: ['department', 'title', 'location'], required: true },
        value: { type: String, required: true, trim: true },
        label: { type: String, required: true, trim: true },
        isActive: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

// Unique constraint per organization + type + value
configItemSchema.index({ organizationId: 1, type: 1, value: 1 }, { unique: true });
configItemSchema.index({ organizationId: 1, type: 1, isActive: 1, sortOrder: 1 });

export const ConfigItemModel = model<IConfigItem>('ConfigItem', configItemSchema);
