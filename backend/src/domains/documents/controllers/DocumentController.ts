import { Request, Response, NextFunction } from 'express';
import { documentService } from '../services/DocumentService';
import { AppError } from '@/shared/utils/AppError';
import { UserRole } from '@/shared/types/common';
import { canUserAccessDocument } from '../services/DocumentService';

export class DocumentController {
  async createDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const {
        title,
        category,
        description,
        tags,
        retentionUntil,
        accessPolicy,
        storageKey,
        checksum,
        sizeBytes,
        mimeType,
        notes,
      } = req.body;

      if (!title || !category) {
        throw new AppError('Title and category are required', 400, 'VALIDATION_ERROR');
      }

      // Generate a placeholder storageKey if not provided (for now, until file upload is implemented)
      const finalStorageKey = storageKey || `placeholder/${Date.now()}-${title.replace(/[^a-zA-Z0-9]/g, '_')}`;

      const document = await documentService.createDocument(
        context.organizationId.toString(),
        {
          title,
          category,
          description,
          tags,
          retentionUntil: retentionUntil ? new Date(retentionUntil) : null,
          accessPolicy,
          storageKey: finalStorageKey,
          checksum,
          sizeBytes,
          mimeType,
          notes,
        },
        context.userId.toString(),
        context.requestId
      );

      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  }

  async addVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const { documentId } = req.params;
      const { storageKey, checksum, sizeBytes, mimeType, notes } = req.body;
      if (!documentId) {
        throw new AppError('Document ID is required', 400, 'VALIDATION_ERROR');
      }
      if (!storageKey) {
        throw new AppError('storageKey is required for new version', 400, 'VALIDATION_ERROR');
      }

      const document = await documentService.addVersion(
        context.organizationId.toString(),
        documentId,
        { storageKey, checksum, sizeBytes, mimeType, notes },
        context.userId.toString(),
        context.requestId
      );

      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  }

  async updateAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const { documentId } = req.params;
      const { allowedRoles, allowedDepartments } = req.body;
      if (!documentId) {
        throw new AppError('Document ID is required', 400, 'VALIDATION_ERROR');
      }
      if (!allowedRoles || !Array.isArray(allowedRoles) || allowedRoles.length === 0) {
        throw new AppError('allowedRoles must be provided', 400, 'VALIDATION_ERROR');
      }

      const document = await documentService.updateAccessPolicy(
        context.organizationId.toString(),
        documentId,
        { allowedRoles: allowedRoles as UserRole[], allowedDepartments },
        context.userId.toString(),
        context.requestId
      );

      res.json(document);
    } catch (error) {
      next(error);
    }
  }

  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const { documentId } = req.params;
      const { retentionUntil } = req.body;
      if (!documentId) {
        throw new AppError('Document ID is required', 400, 'VALIDATION_ERROR');
      }

      const document = await documentService.archiveDocument(
        context.organizationId.toString(),
        documentId,
        retentionUntil ? new Date(retentionUntil) : null,
        context.userId.toString(),
        context.requestId
      );

      res.json(document);
    } catch (error) {
      next(error);
    }
  }

  async unarchive(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const { documentId } = req.params;
      if (!documentId) {
        throw new AppError('Document ID is required', 400, 'VALIDATION_ERROR');
      }

      const document = await documentService.unarchiveDocument(
        context.organizationId.toString(),
        documentId,
        context.userId.toString(),
        context.requestId
      );

      res.json(document);
    } catch (error) {
      next(error);
    }
  }

  async getDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }
      const { documentId } = req.params;
      if (!documentId) {
        throw new AppError('Document ID is required', 400, 'VALIDATION_ERROR');
      }
      const document = await documentService.getDocument(documentId, context.organizationId.toString());
      if (!document) {
        throw new AppError('Document not found', 404, 'NOT_FOUND');
      }

      const allowed = canUserAccessDocument(document, context.userRole, context.userId.toString());
      if (!allowed) {
        throw new AppError('Insufficient permissions for this document', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      res.json(document);
    } catch (error) {
      next(error);
    }
  }

  async listDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.user;
      if (!context) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const { category } = req.query;
      const documents = await documentService.listDocuments(
        context.organizationId.toString(),
        category ? String(category) : undefined
      );

      const filtered = documents.filter(doc =>
        canUserAccessDocument(doc, context.userRole, context.userId.toString())
      );

      res.json(filtered);
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
