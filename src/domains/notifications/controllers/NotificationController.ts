import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/NotificationService';
import { AppError } from '@/shared/utils/AppError';
import { NotificationChannel } from '../models/Notification';

export class NotificationController {
  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');

      const { name, channel, category, subject, body, placeholders, active } = req.body;
      if (!name || !channel || !category || !body) {
        throw new AppError('name, channel, category, and body are required', 400, 'VALIDATION_ERROR');
      }

      const template = await notificationService.createTemplate(
        context.organizationId.toString(),
        {
          name,
          channel: channel as NotificationChannel,
          category,
          subject,
          body,
          placeholders: placeholders || [],
          active: active !== undefined ? Boolean(active) : true,
        } as any,
        context.userId.toString(),
        context.requestId
      );

      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  }

  async sendNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');

      const { templateName, category, recipients, payload } = req.body;
      if (!templateName || !category || !Array.isArray(recipients) || recipients.length === 0) {
        throw new AppError('templateName, category, and recipients are required', 400, 'VALIDATION_ERROR');
      }

      const logs = await notificationService.sendWorkflowNotification(
        context.organizationId.toString(),
        { templateName, category, recipients, payload },
        context.userId.toString(),
        context.requestId
      );

      res.status(201).json({ deliveries: logs.length });
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');

      const { enabledChannels, mutedCategories, optOutAll } = req.body;
      const pref = await notificationService.updatePreferences(
        context.organizationId.toString(),
        context.userId.toString(),
        { enabledChannels, mutedCategories, optOutAll },
        context.requestId
      );

      res.json(pref);
    } catch (error) {
      next(error);
    }
  }

  async listLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');

      const { category } = req.query;
      const logs = await notificationService.listLogs(
        context.organizationId.toString(),
        category ? String(category) : undefined
      );

      res.json(logs);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
