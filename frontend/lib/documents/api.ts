import { request } from '@/lib/api-client';
import type { AuthTokens } from '@/lib/auth/types';
import {
  Document,
  CreateDocumentPayload,
  AddVersionPayload,
  UpdateAccessPayload,
} from './types';

export const documentsApi = {
  // Create a new document
  createDocument: async (payload: CreateDocumentPayload, tokens: AuthTokens): Promise<Document> => {
    return request<Document>('/documents', {
      method: 'POST',
      body: payload,
      tokens,
    });
  },

  // List all documents
  listDocuments: async (tokens: AuthTokens): Promise<Document[]> => {
    return request<Document[]>('/documents', {
      method: 'GET',
      tokens,
    });
  },

  // Get document details
  getDocument: async (documentId: string, tokens: AuthTokens): Promise<Document> => {
    return request<Document>(`/documents/${documentId}`, {
      method: 'GET',
      tokens,
    });
  },

  // Add a new version to document
  addVersion: async (documentId: string, payload: AddVersionPayload, tokens: AuthTokens): Promise<Document> => {
    return request<Document>(`/documents/${documentId}/versions`, {
      method: 'POST',
      body: payload,
      tokens,
    });
  },

  // Update document access permissions
  updateAccess: async (documentId: string, payload: UpdateAccessPayload, tokens: AuthTokens): Promise<Document> => {
    return request<Document>(`/documents/${documentId}/access`, {
      method: 'PATCH',
      body: payload,
      tokens,
    });
  },

  // Archive a document
  archive: async (documentId: string, tokens: AuthTokens): Promise<Document> => {
    return request<Document>(`/documents/${documentId}/archive`, {
      method: 'PATCH',
      body: {},
      tokens,
    });
  },

  // Unarchive a document
  unarchive: async (documentId: string, tokens: AuthTokens): Promise<Document> => {
    return request<Document>(`/documents/${documentId}/unarchive`, {
      method: 'PATCH',
      body: {},
      tokens,
    });
  },
};
