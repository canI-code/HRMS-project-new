import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { permissionRegistry } from '@/shared/middleware/rbac';
import { UserRole } from '@/shared/types/common';
import { auditLogStore } from '@/shared/middleware/auditLogger';
import { AppError } from '@/shared/utils/AppError';
import { User } from '@/domains/auth/models/User';

export class AdminController {
  listRoles(_req: Request, res: Response, next: NextFunction) {
    try {
      const roles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE];
      const permissions = roles.map((role) => ({
        role,
        permissions: permissionRegistry.getPermissionsForRole(role),
      }));
      res.json({ roles: permissions });
    } catch (error) {
      next(error);
    }
  }

  listAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');

      const limit = Math.max(1, Math.min(500, parseInt(String(req.query['limit'] || '100'), 10) || 100));
        const scope = String(req.query['scope'] as string || 'org');

      let logs;
      if (context.userRole === UserRole.SUPER_ADMIN && scope === 'all') {
        logs = auditLogStore.getAll(limit);
      } else {
        logs = auditLogStore.getByOrganization(new Types.ObjectId(context.organizationId), limit);
      }

      res.json({ logs: logs.map((log) => ({
        ...log,
        _id: log._id?.toString(),
        organizationId: log.organizationId.toString(),
        userId: log.userId.toString(),
        resourceId: log.resourceId?.toString(),
        metadata: {
          ...log.metadata,
          timestamp: log.metadata.timestamp.toISOString(),
        },
      })) });
    } catch (error) {
      next(error);
    }
  }

  auditStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = auditLogStore.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async listUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const context = _req.user;
      if (!context) throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');

      const users = await User.find({
        organizationId: new Types.ObjectId(context.organizationId),
        isDeleted: false,
      }).select(['_id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'lastLogin']);

      res.json({
        users: users.map((u) => ({
          _id: u._id?.toString(),
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt,
          lastLogin: u.lastLogin || null,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      if (context.userRole !== UserRole.SUPER_ADMIN) {
        throw new AppError('Only super admin can update users', 403, 'FORBIDDEN');
      }

      const { id } = req.params;
        const role = (req.body as Record<string, unknown>)['role'] as string | undefined;
        const isActive = (req.body as Record<string, unknown>)['isActive'] as boolean | undefined;

      if (!id || !Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid user ID', 400, 'INVALID_ID');
      }

      const updates: Record<string, unknown> = {};
      if (role !== undefined) {
          if (!Object.values(UserRole).includes(role as UserRole)) {
          throw new AppError('Invalid role', 400, 'INVALID_ROLE');
        }
          updates['role'] = role;
      }
      if (isActive !== undefined) {
          updates['isActive'] = Boolean(isActive);
      }

      if (Object.keys(updates).length === 0) {
        throw new AppError('No valid fields to update', 400, 'NO_UPDATES');
      }

      const user = await User.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: false }
      ).select(['_id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'lastLogin'] as string[]);

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      res.json({
        user: {
          _id: user._id?.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin || null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
