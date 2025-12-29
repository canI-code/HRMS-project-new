'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Document, DocumentVersion } from '@/lib/documents/types';

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

interface VersionHistoryDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VersionHistoryDialog({
  document,
  open,
  onOpenChange,
}: VersionHistoryDialogProps) {
  if (!document) return null;

  const getFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History - {document.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {document.versions && document.versions.length > 0 ? (
            document.versions
              .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
              .map((version, index) => (
                <div
                  key={version.version}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold px-2 py-1 rounded bg-blue-100 text-blue-800">
                          v{version.version}
                        </span>
                        {index === 0 && (
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-800">
                            Current
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        Uploaded {formatDistanceToNow(new Date(version.uploadedAt))}
                      </p>

                      {version.notes && (
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Notes:</strong> {version.notes}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">File Type:</span> {version.mimeType || 'Unknown'}
                        </div>
                        <div>
                          <span className="font-medium">Size:</span> {getFileSize(version.sizeBytes)}
                        </div>
                        {version.checksum && (
                          <div className="col-span-2">
                            <span className="font-medium">Checksum:</span>
                            <code className="ml-2 text-gray-500 font-mono text-xs break-all">
                              {version.checksum}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="ml-4" disabled title="Download not implemented yet">
                      Download
                    </Button>
                  </div>
                </div>
              ))
          ) : (
            <p className="text-center text-gray-500 py-8">No versions available</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
