import { Schema, model, Document, Types } from 'mongoose';
import { BaseEntity } from '@/shared/types/common';

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export interface INotificationTemplate extends BaseEntity, Document {
  name: string;
  channel: NotificationChannel;
  category: string;
  subject?: string;
  body: string;
  placeholders: string[];
  active: boolean;
  createdBy?: Types.ObjectId;
}

export interface INotificationPreference extends BaseEntity, Document {
  userId: Types.ObjectId;
  enabledChannels: NotificationChannel[];
  mutedCategories: string[];
  optOutAll: boolean;
}

export type NotificationStatus = 'sent' | 'skipped';

export interface INotificationLog extends BaseEntity, Document {
  userId: Types.ObjectId;
  templateId?: Types.ObjectId;
  channel: NotificationChannel;
  category: string;
  status: NotificationStatus;
  reason?: string;
  payloadSnapshot?: Record<string, unknown>;
  requestId?: string;
}

const templateSchema = new Schema<INotificationTemplate>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true },
    channel: { type: String, enum: Object.values(NotificationChannel), required: true },
    category: { type: String, required: true, trim: true },
    subject: { type: String },
    body: { type: String, required: true },
    placeholders: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

templateSchema.index({ organizationId: 1, name: 1 }, { unique: true });

const preferenceSchema = new Schema<INotificationPreference>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    enabledChannels: {
      type: [String],
      enum: Object.values(NotificationChannel),
      default: Object.values(NotificationChannel),
    },
    mutedCategories: { type: [String], default: [] },
    optOutAll: { type: Boolean, default: false },
  },
  { timestamps: true }
);

preferenceSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

const logSchema = new Schema<INotificationLog>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, index: true },
    channel: { type: String, enum: Object.values(NotificationChannel), required: true },
    category: { type: String, required: true },
    status: { type: String, enum: ['sent', 'skipped'], required: true },
    reason: { type: String },
    payloadSnapshot: { type: Schema.Types.Mixed },
    requestId: { type: String },
  },
  { timestamps: true }
);

logSchema.index({ organizationId: 1, createdAt: -1 });

export const NotificationTemplateModel = model<INotificationTemplate>('NotificationTemplate', templateSchema);
export const NotificationPreferenceModel = model<INotificationPreference>('NotificationPreference', preferenceSchema);
export const NotificationLogModel = model<INotificationLog>('NotificationLog', logSchema);

export const ALL_CHANNELS: NotificationChannel[] = [
  NotificationChannel.EMAIL,
  NotificationChannel.SMS,
  NotificationChannel.PUSH,
  NotificationChannel.IN_APP,
];
