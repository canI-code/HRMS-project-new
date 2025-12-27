import { Types } from 'mongoose';
import { DocumentModel, IDocument, IDocumentVersion, IAccessPolicy, DocumentStatus } from '../models/Document';
import { AppError } from '@/shared/utils/AppError';
import { auditLogStore } from '@/shared/middleware/auditLogger';
import { AuditAction, UserRole } from '@/shared/types/common';

export interface DocumentPayload {
  title: string;
  category: string;
  description?: string;
  tags?: string[];
  retentionUntil?: Date | null;
  accessPolicy?: IAccessPolicy;
  storageKey: string;
  checksum?: string;
  sizeBytes?: number;
  mimeType?: string;
  notes?: string;
}

export interface DocumentVersionPayload {
  storageKey: string;
  checksum?: string;
  sizeBytes?: number;
  mimeType?: string;
  notes?: string;
}

export const normalizeCategory = (category: string): string => {
  const normalized = category.trim().toLowerCase();
  return normalized.length > 0 ? normalized : 'uncategorized';
};

export const computeNextVersionNumber = (currentVersion: number): number => currentVersion + 1;

export const isRoleAllowedForDocument = (policy: IAccessPolicy, role: UserRole): boolean => {
  if (role === UserRole.SUPER_ADMIN) return true;
  return policy.allowedRoles.includes(role);
};

export const appendVersionHistory = (
  history: IDocumentVersion[],
  nextVersion: IDocumentVersion
): IDocumentVersion[] => {
  const updated = [...history, nextVersion];
  return updated.sort((a, b) => a.version - b.version);
};

class DocumentService {
  async createDocument(
    organizationId: string,
    payload: DocumentPayload,
    userId: string,
    requestId: string
  ): Promise<IDocument> {
    if (!payload.title || !payload.category || !payload.storageKey) {
      throw new AppError('Title, category, and storageKey are required', 400, 'VALIDATION_ERROR');
    }

    const normalizedCategory = normalizeCategory(payload.category);
    const accessPolicy: IAccessPolicy = payload.accessPolicy || {
      allowedRoles: [UserRole.MANAGER, UserRole.HR_ADMIN],
      allowedDepartments: [],
    };

    const version: IDocumentVersion = {
      version: 1,
      storageKey: payload.storageKey,
      checksum: payload.checksum,
      sizeBytes: payload.sizeBytes,
      mimeType: payload.mimeType,
      uploadedBy: new Types.ObjectId(userId),
      uploadedAt: new Date(),
      notes: payload.notes,
    };

    const document = await DocumentModel.create({
      organizationId: new Types.ObjectId(organizationId),
      title: payload.title,
      category: normalizedCategory,
      description: payload.description,
      tags: payload.tags || [],
      status: 'active' as DocumentStatus,
      retentionUntil: payload.retentionUntil ?? null,
      currentVersion: 1,
      versions: [version],
      accessPolicy,
      createdBy: new Types.ObjectId(userId),
    });

    await auditLogStore.add({
      organizationId: new Types.ObjectId(organizationId),
      userId: new Types.ObjectId(userId),
      action: AuditAction.CREATE,
      resource: 'documents',
      resourceId: new Types.ObjectId(document._id.toString()),
      success: true,
      metadata: {
        ipAddress: 'internal',
        userAgent: 'document-service',
        requestId,
        timestamp: new Date(),
        method: 'POST',
        url: '/api/documents',
      },
    });

    return document;
  }

  async addVersion(
    organizationId: string,
    documentId: string,
    payload: DocumentVersionPayload,
    userId: string,
    requestId: string
  ): Promise<IDocument> {
    const document = await DocumentModel.findOne({ _id: documentId, organizationId });
    if (!document) {
      throw new AppError('Document not found', 404, 'NOT_FOUND');
    }

    const nextVersionNumber = computeNextVersionNumber(document.currentVersion);
    const version: IDocumentVersion = {
      version: nextVersionNumber,
      storageKey: payload.storageKey,
      checksum: payload.checksum,
      sizeBytes: payload.sizeBytes,
      mimeType: payload.mimeType,
      uploadedBy: new Types.ObjectId(userId),
      uploadedAt: new Date(),
      notes: payload.notes,
    };

    document.versions = appendVersionHistory(document.versions, version);
    document.currentVersion = nextVersionNumber;
    document.updatedBy = new Types.ObjectId(userId);
    await document.save();

    await auditLogStore.add({
      organizationId: new Types.ObjectId(organizationId),
      userId: new Types.ObjectId(userId),
      action: AuditAction.UPDATE,
      resource: 'documents',
      resourceId: new Types.ObjectId(document._id.toString()),
      success: true,
      changes: { after: { currentVersion: document.currentVersion } },
      metadata: {
        ipAddress: 'internal',
        userAgent: 'document-service',
        requestId,
        timestamp: new Date(),
        method: 'POST',
        url: '/api/documents/:documentId/versions',
      },
    });

    return document;
  }

  async updateAccessPolicy(
    organizationId: string,
    documentId: string,
    accessPolicy: IAccessPolicy,
    userId: string,
    requestId: string
  ): Promise<IDocument> {
    const document = await DocumentModel.findOne({ _id: documentId, organizationId });
    if (!document) {
      throw new AppError('Document not found', 404, 'NOT_FOUND');
    }

    document.accessPolicy = accessPolicy;
    document.updatedBy = new Types.ObjectId(userId);
    await document.save();

    await auditLogStore.add({
      organizationId: new Types.ObjectId(organizationId),
      userId: new Types.ObjectId(userId),
      action: AuditAction.UPDATE,
      resource: 'documents',
      resourceId: new Types.ObjectId(document._id.toString()),
      success: true,
      changes: { after: { accessPolicy: accessPolicy.allowedRoles } },
      metadata: {
        ipAddress: 'internal',
        userAgent: 'document-service',
        requestId,
        timestamp: new Date(),
        method: 'PATCH',
        url: '/api/documents/:documentId/access',
      },
    });

    return document;
  }

  async archiveDocument(
    organizationId: string,
    documentId: string,
    retentionUntil: Date | null,
    userId: string,
    requestId: string
  ): Promise<IDocument> {
    const document = await DocumentModel.findOne({ _id: documentId, organizationId });
    if (!document) {
      throw new AppError('Document not found', 404, 'NOT_FOUND');
    }

    document.status = 'archived';
    document.retentionUntil = retentionUntil;
    document.updatedBy = new Types.ObjectId(userId);
    await document.save();

    await auditLogStore.add({
      organizationId: new Types.ObjectId(organizationId),
      userId: new Types.ObjectId(userId),
      action: AuditAction.DELETE,
      resource: 'documents',
      resourceId: new Types.ObjectId(document._id.toString()),
      success: true,
      changes: { after: { status: 'archived', retentionUntil } },
      metadata: {
        ipAddress: 'internal',
        userAgent: 'document-service',
        requestId,
        timestamp: new Date(),
        method: 'PATCH',
        url: '/api/documents/:documentId/archive',
      },
    });

    return document;
  }

  async getDocument(documentId: string, organizationId: string): Promise<IDocument | null> {
    return DocumentModel.findOne({ _id: documentId, organizationId });
  }

  async listDocuments(organizationId: string, category?: string): Promise<IDocument[]> {
    const query: Record<string, unknown> = { organizationId };
    if (category) {
      query['category'] = normalizeCategory(category);
    }
    return DocumentModel.find(query).sort({ updatedAt: -1 });
  }
}

export const documentService = new DocumentService();
