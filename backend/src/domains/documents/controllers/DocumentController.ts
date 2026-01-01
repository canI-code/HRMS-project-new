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
        notes,
      } = req.body;

      // Debugging
      console.log('--- CREATE DOCUMENT DEBUG ---');
      console.log('Headers Content-Type:', req.headers['content-type']);
      console.log('Has File:', !!req.file);
      if (req.file) console.log('File details:', { name: req.file.originalname, size: req.file.size });
      console.log('Body Keys:', Object.keys(req.body));
      console.log('-----------------------------');

      if (!title || !category) {
        throw new AppError('Title and category are required', 400, 'VALIDATION_ERROR');
      }

      if (!req.file) {
        throw new AppError('File is required', 400, 'FILE_REQUIRED');
      }

      const file = req.file as any;

      // Parse tags if they are a string (sent via FormData)
      let parsedTags: string[] = [];
      if (Array.isArray(tags)) {
        parsedTags = tags;
      } else if (typeof tags === 'string' && tags.trim().startsWith('[')) {
        try {
          parsedTags = JSON.parse(tags);
        } catch (e) {
          parsedTags = [tags];
        }
      } else if (tags) {
        parsedTags = [tags];
      }

      let finalAccessPolicy: any;
      try {
        finalAccessPolicy = typeof accessPolicy === 'string' ? JSON.parse(accessPolicy) : accessPolicy;
      } catch (e) {
        console.warn('Failed to parse accessPolicy:', accessPolicy);
        finalAccessPolicy = {
          allowedRoles: [UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN],
          allowedDepartments: [],
        };
      }

      // If user is an employee, override access policy to ensure they can't restrict admins/managers
      if (context.userRole === UserRole.EMPLOYEE) {
        finalAccessPolicy = {
          allowedRoles: [UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN, UserRole.EMPLOYEE],
          allowedDepartments: [],
        };
      } else if (!finalAccessPolicy) {
        // Default policy for others if not provided
        finalAccessPolicy = {
          allowedRoles: [UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN],
          allowedDepartments: [],
        };
      }

      const document = await documentService.createDocument(
        context.organizationId.toString(),
        {
          title,
          category,
          description,
          tags: parsedTags,
          retentionUntil: retentionUntil ? new Date(retentionUntil) : null,
          accessPolicy: finalAccessPolicy,
          storageKey: file.path, // Cloudinary URL
          sizeBytes: file.size,
          mimeType: file.mimetype,
          notes,
        },
        context.userId.toString(),
        context.requestId
      );

      res.status(201).json(document);
    } catch (error: any) {
      console.error('--- CREATE DOCUMENT ERROR ---');
      console.error('Message:', error.message);
      if (error.stack) console.error('Stack trace:', error.stack);
      console.error('-----------------------------');
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
      const { notes } = req.body;

      if (!documentId) {
        throw new AppError('Document ID is required', 400, 'VALIDATION_ERROR');
      }

      if (!req.file) {
        throw new AppError('File is required for new version', 400, 'FILE_REQUIRED');
      }

      const file = req.file as any;

      // Check if user has access to the document
      const existingDoc = await documentService.getDocument(documentId, context.organizationId.toString());
      if (!existingDoc) {
        throw new AppError('Document not found', 404, 'NOT_FOUND');
      }

      if (!canUserAccessDocument(existingDoc, context.userRole, context.userId.toString())) {
        throw new AppError('Insufficient permissions for this document', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      const document = await documentService.addVersion(
        context.organizationId.toString(),
        documentId,
        {
          storageKey: file.path,
          sizeBytes: file.size,
          mimeType: file.mimetype,
          notes
        },
        context.userId.toString(),
        context.requestId
      );

      res.status(201).json(document);
    } catch (error: any) {
      console.error('--- ADD VERSION ERROR ---');
      console.error('Message:', error.message);
      if (error.stack) console.error('Stack trace:', error.stack);
      console.error('--------------------------');
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

      if (context.userRole === UserRole.EMPLOYEE) {
        throw new AppError('Employees cannot update access policies', 403, 'INSUFFICIENT_PERMISSIONS');
      }

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

      if (context.userRole === UserRole.EMPLOYEE) {
        throw new AppError('Employees cannot archive documents', 403, 'INSUFFICIENT_PERMISSIONS');
      }

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

      if (context.userRole === UserRole.EMPLOYEE) {
        throw new AppError('Employees cannot unarchive documents', 403, 'INSUFFICIENT_PERMISSIONS');
      }

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
