import { Request, Response, NextFunction } from 'express';
import { LeavePolicyService } from '../services/LeavePolicyService';
import { AppError } from '@/shared/utils/AppError';

export class LeavePolicyController {
    static async get(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = req.user!;
            const policy = await LeavePolicyService.getPolicy(ctx);
            // Return empty default structure if not found so frontend doesn't break
            const data = policy ? policy.toObject() : { allocations: [] };
            res.json({ success: true, data });
        } catch (error) { next(error); }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const ctx = req.user!;
            if (ctx.userRole !== 'hr_admin' && ctx.userRole !== 'super_admin') {
                throw new AppError('Only HR Admins can configure leave policy', 403, 'INSUFFICIENT_PERMISSIONS');
            }

            const policy = await LeavePolicyService.updatePolicy(ctx, req.body);
            res.json({ success: true, data: policy });
        } catch (error) { next(error); }
    }
}
