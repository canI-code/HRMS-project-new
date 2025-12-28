import { UserRole } from '@/lib/auth/types';

export type DocumentStatus = 'active' | 'archived';

export interface DocumentVersion {
  version: number;
  storageKey: string;
  checksum?: string;
  sizeBytes?: number;
  mimeType?: string;
  uploadedBy: string;
  uploadedAt: string;
  notes?: string;
}

export interface AccessPolicy {
  allowedRoles: UserRole[];
  allowedDepartments?: string[];
}

export interface Document {
  _id: string;
  organizationId: string;
  title: string;
  category: string;
  description?: string;
  tags?: string[];
  status: DocumentStatus;
  retentionUntil?: string | null;
  currentVersion: number;
  versions: DocumentVersion[];
  accessPolicy: AccessPolicy;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentPayload {
  title: string;
  category: string;
  description?: string;
  tags?: string[];
  accessPolicy: AccessPolicy;
  storageKey?: string; // for initial upload
  mimeType?: string;
  sizeBytes?: number;
  notes?: string;
}

export interface AddVersionPayload {
  storageKey: string;
  mimeType?: string;
  sizeBytes?: number;
  checksum?: string;
  notes?: string;
}

export interface UpdateAccessPayload {
  allowedRoles: UserRole[];
  allowedDepartments?: string[];
}
