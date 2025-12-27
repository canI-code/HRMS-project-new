import mongoose, { Schema, Document, Types } from 'mongoose';
import { UserRole } from '@/shared/types/common';

export type DocumentStatus = 'active' | 'archived';

export interface IAccessPolicy {
  allowedRoles: UserRole[];
  allowedDepartments?: string[];
}

export interface IDocumentVersion {
  version: number;
  storageKey: string;
  checksum?: string | undefined;
  sizeBytes?: number | undefined;
  mimeType?: string | undefined;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
  notes?: string | undefined;
}

export interface IDocument extends Document {
  organizationId: Types.ObjectId;
  title: string;
  category: string;
  description?: string;
  tags?: string[];
  status: DocumentStatus;
  retentionUntil?: Date | null;
  currentVersion: number;
  versions: IDocumentVersion[];
  accessPolicy: IAccessPolicy;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AccessPolicySchema = new Schema<IAccessPolicy>(
  {
    allowedRoles: [{ type: String, enum: Object.values(UserRole), required: true }],
    allowedDepartments: [{ type: String }],
  },
  { _id: false }
);

const VersionSchema = new Schema<IDocumentVersion>(
  {
    version: { type: Number, required: true },
    storageKey: { type: String, required: true },
    checksum: { type: String },
    sizeBytes: { type: Number },
    mimeType: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, required: true },
    notes: { type: String },
  },
  { _id: false }
);

const DocumentSchema = new Schema<IDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true },
    category: { type: String, required: true, index: true },
    description: { type: String },
    tags: [{ type: String, index: true }],
    status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
    retentionUntil: { type: Date, default: null },
    currentVersion: { type: Number, required: true },
    versions: { type: [VersionSchema], default: [] },
    accessPolicy: { type: AccessPolicySchema, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

DocumentSchema.index({ organizationId: 1, category: 1 });
DocumentSchema.index({ organizationId: 1, 'accessPolicy.allowedRoles': 1 });

export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);
