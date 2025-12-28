export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationStatus = 'sent' | 'skipped';

export interface NotificationTemplate {
  _id: string;
  organizationId: string;
  name: string;
  channel: NotificationChannel;
  category: string;
  subject?: string;
  body: string;
  placeholders: string[];
  active: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreference {
  _id?: string;
  organizationId?: string;
  userId?: string;
  enabledChannels: NotificationChannel[];
  mutedCategories: string[];
  optOutAll: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationLog {
  _id: string;
  organizationId: string;
  userId: string;
  templateId?: string;
  channel: NotificationChannel;
  category: string;
  status: NotificationStatus;
  reason?: string;
  payloadSnapshot?: Record<string, unknown>;
  requestId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecipient {
  userId: string;
  channels?: NotificationChannel[];
}

export interface NotificationSendPayload {
  templateName: string;
  category: string;
  recipients: NotificationRecipient[];
  payload?: Record<string, unknown>;
}

export interface CreateTemplatePayload {
  name: string;
  channel: NotificationChannel;
  category: string;
  subject?: string;
  body: string;
  placeholders?: string[];
  active?: boolean;
}

export interface UpdatePreferencesPayload {
  enabledChannels?: NotificationChannel[];
  mutedCategories?: string[];
  optOutAll?: boolean;
}
