import { Types } from 'mongoose';
import {
  ALL_CHANNELS,
  INotificationPreference,
  INotificationTemplate,
  NotificationChannel,
  NotificationLogModel,
  NotificationPreferenceModel,
  NotificationTemplateModel,
} from '../models/Notification';
import { AppError } from '@/shared/utils/AppError';
import { AuditAction } from '@/shared/types/common';
import { auditLogStore } from '@/shared/middleware/auditLogger';

export interface NotificationRecipient {
  userId: string;
  channels?: NotificationChannel[];
}

export interface NotificationDispatchPayload {
  templateName: string;
  category: string;
  recipients: NotificationRecipient[];
  payload?: Record<string, unknown>;
}

export interface DeliveryPlanEntry {
  userId: string;
  channel: NotificationChannel;
}

export const getDefaultPreferences = (): Pick<INotificationPreference, 'enabledChannels' | 'mutedCategories' | 'optOutAll'> => ({
  enabledChannels: ALL_CHANNELS,
  mutedCategories: [],
  optOutAll: false,
});

export const isChannelAllowed = (
  pref: Pick<INotificationPreference, 'enabledChannels' | 'mutedCategories' | 'optOutAll'>,
  channel: NotificationChannel,
  category: string
): boolean => {
  if (pref.optOutAll) return false;
  if (pref.mutedCategories.includes(category)) return false;
  return pref.enabledChannels.includes(channel);
};

export const computeDeliveries = (
  recipients: NotificationRecipient[],
  preferences: Map<string, Pick<INotificationPreference, 'enabledChannels' | 'mutedCategories' | 'optOutAll'>>,
  templateChannel: NotificationChannel,
  category: string
): DeliveryPlanEntry[] => {
  const deliveries: DeliveryPlanEntry[] = [];

  recipients.forEach((recipient) => {
    const pref = preferences.get(recipient.userId) ?? getDefaultPreferences();
    const requestedChannels = (recipient.channels && recipient.channels.length > 0)
      ? Array.from(new Set(recipient.channels))
      : [templateChannel];

    requestedChannels.forEach((channel) => {
      if (isChannelAllowed(pref, channel, category)) {
        deliveries.push({ userId: recipient.userId, channel });
      }
    });
  });

  return deliveries;
};

class NotificationService {
  async createTemplate(
    organizationId: string,
    payload: Omit<INotificationTemplate, 'createdAt' | 'updatedAt' | '_id' | 'organizationId'>,
    userId: string,
    requestId: string
  ): Promise<INotificationTemplate> {
    const template = await NotificationTemplateModel.create({
      ...payload,
      organizationId: new Types.ObjectId(organizationId),
      createdBy: new Types.ObjectId(userId),
    });

    await auditLogStore.add({
      organizationId: new Types.ObjectId(organizationId),
      userId: new Types.ObjectId(userId),
      action: AuditAction.CREATE,
      resource: 'notifications',
      resourceId: new Types.ObjectId(template._id.toString()),
      success: true,
      metadata: {
        requestId,
        url: '/api/notifications/templates',
        ipAddress: 'internal',
        userAgent: 'notification-service',
        timestamp: new Date(),
        method: 'POST',
      },
    });

    return template;
  }

  async updatePreferences(
    organizationId: string,
    userId: string,
    updates: Partial<Pick<INotificationPreference, 'enabledChannels' | 'mutedCategories' | 'optOutAll'>>,
    requestId: string
  ): Promise<INotificationPreference> {
    const pref = await NotificationPreferenceModel.findOneAndUpdate(
      { organizationId, userId },
      {
        $set: {
          enabledChannels: updates.enabledChannels ?? ALL_CHANNELS,
          mutedCategories: updates.mutedCategories ?? [],
          optOutAll: updates.optOutAll ?? false,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await auditLogStore.add({
      organizationId: new Types.ObjectId(organizationId),
      userId: new Types.ObjectId(userId),
      action: AuditAction.UPDATE,
      resource: 'notifications-preferences',
      resourceId: new Types.ObjectId(userId),
      success: true,
      metadata: {
        requestId,
        url: '/api/notifications/preferences',
        ipAddress: 'internal',
        userAgent: 'notification-service',
        timestamp: new Date(),
        method: 'PATCH',
      },
    });

    return pref;
  }

  async sendWorkflowNotification(
    organizationId: string,
    dispatch: NotificationDispatchPayload,
    requestorId: string,
    requestId: string
  ) {
    const template = await NotificationTemplateModel.findOne({
      organizationId,
      name: dispatch.templateName,
      active: true,
    });

    if (!template) {
      throw new AppError('Notification template not found', 404, 'NOT_FOUND');
    }

    if (!dispatch.recipients || dispatch.recipients.length === 0) {
      throw new AppError('At least one recipient is required', 400, 'VALIDATION_ERROR');
    }

    const userIds = dispatch.recipients.map((r) => new Types.ObjectId(r.userId));
    const preferences = await NotificationPreferenceModel.find({ organizationId, userId: { $in: userIds } });
    const prefMap = new Map<string, Pick<INotificationPreference, 'enabledChannels' | 'mutedCategories' | 'optOutAll'>>();
    preferences.forEach((pref) => {
      prefMap.set(pref.userId.toString(), {
        enabledChannels: pref.enabledChannels,
        mutedCategories: pref.mutedCategories,
        optOutAll: pref.optOutAll,
      });
    });

    const deliveries = computeDeliveries(dispatch.recipients, prefMap, template.channel, dispatch.category);

    const sentLogs = deliveries.map((delivery) => ({
      organizationId: new Types.ObjectId(organizationId),
      userId: new Types.ObjectId(delivery.userId),
      templateId: template._id,
      channel: delivery.channel,
      category: dispatch.category,
      status: 'sent' as const,
      payloadSnapshot: dispatch.payload,
      requestId,
    }));

    const deliveredUserChannel = new Set(deliveries.map((d) => `${d.userId}:${d.channel}`));
    const skippedLogs = dispatch.recipients.flatMap((recipient) => {
      const pref = prefMap.get(recipient.userId) ?? getDefaultPreferences();
      const requestedChannels = (recipient.channels && recipient.channels.length > 0)
        ? Array.from(new Set(recipient.channels))
        : [template.channel];

      const blocked = requestedChannels.filter((channel) => !deliveredUserChannel.has(`${recipient.userId}:${channel}`));
      return blocked.map((channel) => ({
        organizationId: new Types.ObjectId(organizationId),
        userId: new Types.ObjectId(recipient.userId),
        templateId: template._id,
        channel,
        category: dispatch.category,
        status: 'skipped' as const,
        reason: pref.optOutAll
          ? 'opt_out_all'
          : pref.mutedCategories.includes(dispatch.category)
            ? 'muted_category'
            : 'channel_disabled',
        payloadSnapshot: dispatch.payload,
        requestId,
      }));
    });

    const logs = await NotificationLogModel.insertMany([...sentLogs, ...skippedLogs]);

    await auditLogStore.add({
      organizationId: new Types.ObjectId(organizationId),
      userId: new Types.ObjectId(requestorId),
      action: AuditAction.CREATE,
      resource: 'notifications',
      resourceId: new Types.ObjectId(template._id.toString()),
      success: true,
      metadata: {
        requestId,
        url: '/api/notifications/send',
        ipAddress: 'internal',
        userAgent: 'notification-service',
        timestamp: new Date(),
        method: 'POST',
      },
      changes: { after: { deliveries: deliveries.length } },
    });

    return logs;
  }

  async listLogs(organizationId: string, category?: string) {
    const query: Record<string, unknown> = { organizationId };
    if (category) {
      query['category'] = category;
    }
    return NotificationLogModel.find(query).sort({ createdAt: -1 }).limit(50);
  }
}

export const notificationService = new NotificationService();
