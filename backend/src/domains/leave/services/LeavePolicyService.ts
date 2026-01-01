import { LeavePolicyModel, LeavePolicy } from '../models/LeavePolicy';
import { RequestContext } from '@/shared/types/common';
import { Types } from 'mongoose';


export class LeavePolicyService {
    static async getPolicy(ctx: RequestContext): Promise<LeavePolicy | null> {
        return LeavePolicyModel.findOne({ organizationId: new Types.ObjectId(ctx.organizationId) });
    }

    static async updatePolicy(
        ctx: RequestContext,
        payload: {
            allocations: { leaveType: string; totalDays: number }[];
        }
    ): Promise<LeavePolicy> {
        const orgId = new Types.ObjectId(ctx.organizationId);

        // Ensure user has permission (handled by route, but checking org match is good)

        const policy = await LeavePolicyModel.findOneAndUpdate(
            { organizationId: orgId },
            {
                $set: {
                    allocations: payload.allocations,
                    updatedBy: new Types.ObjectId(ctx.userId),
                },
                $setOnInsert: {
                    organizationId: orgId,
                    rules: {},
                    createdBy: new Types.ObjectId(ctx.userId),
                }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return policy;
    }
}
