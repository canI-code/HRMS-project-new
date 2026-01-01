import { Types } from 'mongoose';
import { ConfigItemModel, ConfigItemType, IConfigItem } from '../models/ConfigItem';
import { AppError } from '@/shared/utils/AppError';
import { RequestContext } from '@/shared/types/common';

export interface CreateConfigItemInput {
    type: ConfigItemType;
    value: string;
    label: string;
    sortOrder?: number;
}

export interface UpdateConfigItemInput {
    label?: string;
    isActive?: boolean;
    sortOrder?: number;
}

export class ConfigItemService {
    /**
     * List all config items of a specific type for an organization
     */
    static async list(ctx: RequestContext, type: ConfigItemType, includeInactive = false): Promise<IConfigItem[]> {
        const query: any = { organizationId: ctx.organizationId, type };
        if (!includeInactive) {
            query.isActive = true;
        }
        return ConfigItemModel.find(query).sort({ sortOrder: 1, label: 1 });
    }

    /**
     * Create a new config item
     */
    static async create(ctx: RequestContext, input: CreateConfigItemInput): Promise<IConfigItem> {
        // Check for duplicates
        const existing = await ConfigItemModel.findOne({
            organizationId: ctx.organizationId,
            type: input.type,
            value: input.value.toLowerCase().replace(/\s+/g, '_'),
        });

        if (existing) {
            throw new AppError(`${input.type} "${input.label}" already exists`, 400, 'DUPLICATE_CONFIG_ITEM');
        }

        const item = await ConfigItemModel.create({
            organizationId: ctx.organizationId,
            type: input.type,
            value: input.value.toLowerCase().replace(/\s+/g, '_'),
            label: input.label,
            sortOrder: input.sortOrder ?? 0,
            isActive: true,
            createdBy: ctx.userId,
        });

        return item;
    }

    /**
     * Update a config item
     */
    static async update(ctx: RequestContext, itemId: string, input: UpdateConfigItemInput): Promise<IConfigItem> {
        const item = await ConfigItemModel.findOneAndUpdate(
            { _id: new Types.ObjectId(itemId), organizationId: ctx.organizationId },
            { $set: { ...input, updatedBy: ctx.userId } },
            { new: true }
        );

        if (!item) {
            throw new AppError('Config item not found', 404, 'NOT_FOUND');
        }

        return item;
    }

    /**
     * Delete (soft-delete by deactivating) a config item
     */
    static async delete(ctx: RequestContext, itemId: string): Promise<void> {
        const result = await ConfigItemModel.findOneAndUpdate(
            { _id: new Types.ObjectId(itemId), organizationId: ctx.organizationId },
            { $set: { isActive: false, updatedBy: ctx.userId } }
        );

        if (!result) {
            throw new AppError('Config item not found', 404, 'NOT_FOUND');
        }
    }

    /**
     * Hard delete a config item (permanent)
     */
    static async hardDelete(ctx: RequestContext, itemId: string): Promise<void> {
        const result = await ConfigItemModel.deleteOne({
            _id: new Types.ObjectId(itemId),
            organizationId: ctx.organizationId,
        });

        if (result.deletedCount === 0) {
            throw new AppError('Config item not found', 404, 'NOT_FOUND');
        }
    }

    /**
     * Seed default items for a new organization
     */
    static async seedDefaults(organizationId: string, userId: string): Promise<void> {
        const defaults = {
            department: [
                { value: 'engineering', label: 'Engineering' },
                { value: 'hr', label: 'Human Resources' },
                { value: 'finance', label: 'Finance' },
                { value: 'marketing', label: 'Marketing' },
                { value: 'sales', label: 'Sales' },
                { value: 'operations', label: 'Operations' },
            ],
            title: [
                { value: 'software_engineer', label: 'Software Engineer' },
                { value: 'senior_software_engineer', label: 'Senior Software Engineer' },
                { value: 'tech_lead', label: 'Tech Lead' },
                { value: 'engineering_manager', label: 'Engineering Manager' },
                { value: 'hr_manager', label: 'HR Manager' },
                { value: 'accountant', label: 'Accountant' },
            ],
            location: [
                { value: 'headquarters', label: 'Headquarters' },
                { value: 'remote', label: 'Remote' },
                { value: 'branch_office', label: 'Branch Office' },
            ],
        };

        for (const [type, items] of Object.entries(defaults)) {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                try {
                    await ConfigItemModel.findOneAndUpdate(
                        { organizationId: new Types.ObjectId(organizationId), type, value: item.value },
                        {
                            $setOnInsert: {
                                organizationId: new Types.ObjectId(organizationId),
                                type,
                                value: item.value,
                                label: item.label,
                                sortOrder: i,
                                isActive: true,
                                createdBy: new Types.ObjectId(userId),
                            },
                        },
                        { upsert: true }
                    );
                } catch (e) {
                    // Ignore duplicate key errors
                }
            }
        }
    }
}
