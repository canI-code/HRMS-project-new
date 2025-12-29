'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Document } from '@/lib/documents/types';
import { documentsApi } from '@/lib/documents/api';
import { CreateDocumentDialog } from './CreateDocumentDialog';
import { VersionHistoryDialog } from './VersionHistoryDialog';
import { AccessControlDialog } from './AccessControlDialog';
import { useAuth } from '@/lib/auth/context';
import { CreateDocumentPayload } from '@/lib/documents/types';

// Simple date formatting utility
function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
}

export function DocumentsBrowser() {
  const { state, hasRole } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);

  // Fetch documents
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      if (!state.tokens) throw new Error('Not authenticated');
      const data = await documentsApi.listDocuments(state.tokens);
      setDocuments(data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter documents
  useEffect(() => {
    let filtered = documents.filter(doc =>
      activeTab === 'archived' ? doc.status === 'archived' : doc.status !== 'archived'
    );

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, selectedCategory, activeTab]);

  const handleCreateDocument = async (payload: CreateDocumentPayload) => {
    try {
      if (!state.tokens) throw new Error('Not authenticated');
      const newDoc = await documentsApi.createDocument(payload, state.tokens);
      setDocuments([newDoc, ...documents]);
      // Refresh to ensure consistency
      await fetchDocuments();
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  const handleUpdateAccess = async (roles: string[], departments?: string[]) => {
    if (!selectedDocument) return;
    try {
      if (!state.tokens) throw new Error('Not authenticated');
      const updated = await documentsApi.updateAccess(selectedDocument._id, {
        allowedRoles: roles as any,
        allowedDepartments: departments,
      }, state.tokens);
      setSelectedDocument(updated);
      setDocuments(documents.map(d => (d._id === updated._id ? updated : d)));
    } catch (error) {
      console.error('Failed to update access:', error);
    }
  };

  const handleArchive = async (documentId: string) => {
    try {
      if (!state.tokens) throw new Error('Not authenticated');
      const updated = await documentsApi.archive(documentId, state.tokens);
      setDocuments(documents.map(d => (d._id === updated._id ? updated : d)));
      if (selectedDocument?._id === documentId) {
        setSelectedDocument(updated);
      }
    } catch (error) {
      console.error('Failed to archive document:', error);
    }
  };

  const categories = Array.from(new Set(documents.map(doc => doc.category)));

  const canManage = hasRole(['manager', 'hr_admin']);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">Manage and organize your documents</p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            + Upload Document
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <Input
          placeholder="Search documents..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'active' ? 'default' : 'outline'}
          onClick={() => setActiveTab('active')}
        >
          Active
        </Button>
        <Button
          variant={activeTab === 'archived' ? 'default' : 'outline'}
          onClick={() => setActiveTab('archived')}
        >
          Archived
        </Button>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading documents...</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {documents.length === 0 ? 'No documents uploaded yet' : 'No documents match your search'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map(doc => (
            <Card
              key={doc._id}
              className={`cursor-pointer hover:shadow-lg transition-shadow ${doc.status === 'archived' ? 'opacity-60' : ''
                }`}
              onClick={() => setSelectedDocument(doc)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{doc.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {doc.category}
                      {doc.status === 'archived' && ' • Archived'}
                    </CardDescription>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    v{doc.currentVersion}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {doc.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{doc.description}</p>
                )}

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {doc.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{doc.tags.length - 2} more</span>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Updated {formatDistanceToNow(new Date(doc.updatedAt))}
                </div>

                {selectedDocument?._id === doc._id && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={e => {
                        e.stopPropagation();
                        setVersionDialogOpen(true);
                      }}
                    >
                      Versions
                    </Button>
                    {canManage && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={e => {
                            e.stopPropagation();
                            setAccessDialogOpen(true);
                          }}
                        >
                          Access
                        </Button>
                        {doc.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={e => {
                              e.stopPropagation();
                              handleArchive(doc._id);
                            }}
                          >
                            Archive
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={async e => {
                              e.stopPropagation();
                              if (!state.tokens) return;
                              try {
                                const updated = await documentsApi.unarchive(doc._id, state.tokens);
                                setDocuments(documents.map(d => (d._id === updated._id ? updated : d)));
                                if (selectedDocument?._id === doc._id) setSelectedDocument(updated);
                              } catch (err) {
                                console.error('Failed to unarchive document:', err);
                              }
                            }}
                          >
                            Unarchive
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateDocumentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateDocument}
      />

      {selectedDocument && (
        <>
          <VersionHistoryDialog
            document={selectedDocument}
            open={versionDialogOpen}
            onOpenChange={setVersionDialogOpen}
          />
          <AccessControlDialog
            document={selectedDocument}
            open={accessDialogOpen}
            onOpenChange={setAccessDialogOpen}
            onUpdateAccess={handleUpdateAccess}
          />
        </>
      )}
    </div>
  );
}
