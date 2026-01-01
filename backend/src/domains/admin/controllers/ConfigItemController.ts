import { Request, Response, NextFunction } from 'express';
import { ConfigItemService, CreateConfigItemInput, UpdateConfigItemInput } from '../services/ConfigItemService';
import { ConfigItemType } from '../models/ConfigItem';
import { AppError } from '@/shared/utils/AppError';

export class ConfigItemController {
    /**
     * List config items by type
     * GET /admin/config/:type
     */
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = req.user!;
            const type = req.params['type'] as ConfigItemType;
            const includeInactive = req.query['includeInactive'] === 'true';

            if (!['department', 'title', 'location'].includes(type)) {
                throw new AppError('Invalid config type', 400, 'INVALID_TYPE');
            }

            const items = await ConfigItemService.list(ctx, type, includeInactive);
            res.json({ success: true, data: items });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create a new config item
     * POST /admin/config/:type
     */
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = req.user!;
            const type = req.params['type'] as ConfigItemType;

            if (!['department', 'title', 'location'].includes(type)) {
                throw new AppError('Invalid config type', 400, 'INVALID_TYPE');
            }

            const input: CreateConfigItemInput = {
                type,
                value: req.body.value || req.body.label?.toLowerCase().replace(/\s+/g, '_'),
                label: req.body.label,
                sortOrder: req.body.sortOrder,
            };

            if (!input.label) {
                throw new AppError('Label is required', 400, 'VALIDATION_ERROR');
            }

            const item = await ConfigItemService.create(ctx, input);
            res.status(201).json({ success: true, data: item });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a config item
     * PATCH /admin/config/:type/:id
     */
    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = req.user!;
            const itemId = req.params['id'] as string;

            const input: UpdateConfigItemInput = {};
            if (req.body.label !== undefined) input.label = req.body.label;
            if (req.body.isActive !== undefined) input.isActive = req.body.isActive;
            if (req.body.sortOrder !== undefined) input.sortOrder = req.body.sortOrder;

            const item = await ConfigItemService.update(ctx, itemId, input);
            res.json({ success: true, data: item });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a config item
     * DELETE /admin/config/:type/:id
     */
    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = req.user!;
            const itemId = req.params['id'] as string;
            const hard = req.query['hard'] === 'true';

            if (hard) {
                await ConfigItemService.hardDelete(ctx, itemId);
            } else {
                await ConfigItemService.delete(ctx, itemId);
            }

            res.json({ success: true, message: 'Item deleted successfully' });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Seed default items for organization
     * POST /admin/config/seed
     */
    static async seed(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = req.user!;
            await ConfigItemService.seedDefaults(ctx.organizationId.toString(), ctx.userId.toString());
            res.json({ success: true, message: 'Default config items seeded successfully' });
        } catch (error) {
            next(error);
        }
    }
}
