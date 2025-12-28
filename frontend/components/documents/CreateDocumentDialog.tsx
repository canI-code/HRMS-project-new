'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateDocumentPayload } from '@/lib/documents/types';
import { UserRole } from '@/lib/auth/types';

interface CreateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateDocumentPayload) => Promise<void>;
}

const DOCUMENT_CATEGORIES = [
  'Employment Contract',
  'Offer Letter',
  'ID Proof',
  'Bank Details',
  'Tax Documents',
  'Medical Records',
  'Certifications',
  'Training Materials',
  'Policy Documents',
  'Other',
];

const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: 'Employee', value: 'employee' },
  { label: 'Manager', value: 'manager' },
  { label: 'HR Admin', value: 'hr_admin' },
];

export function CreateDocumentDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateDocumentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateDocumentPayload>({
    title: '',
    category: '',
    description: '',
    tags: [],
    accessPolicy: {
      allowedRoles: ['hr_admin'],
      allowedDepartments: [],
    },
    storageKey: '',
    mimeType: '',
    sizeBytes: undefined,
  });
  const [newTag, setNewTag] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleAddTag = () => {
    if (newTag && !formData.tags?.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || [],
    }));
  };

  const handleRoleChange = (role: string) => {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked && !formData.accessPolicy.allowedRoles.includes(role as UserRole)) {
      setFormData(prev => ({
        ...prev,
        accessPolicy: {
          ...prev.accessPolicy,
          allowedRoles: [...prev.accessPolicy.allowedRoles, role as UserRole],
        },
      }));
    } else if (!checked) {
      setFormData(prev => ({
        ...prev,
        accessPolicy: {
          ...prev.accessPolicy,
          allowedRoles: prev.accessPolicy.allowedRoles.filter(r => r !== role),
        },
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category) {
      alert('Title and Category are required');
      return;
    }
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    const nextStorageKey = `upload/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    const payload: CreateDocumentPayload = {
      ...formData,
      storageKey: nextStorageKey,
      mimeType: file.type,
      sizeBytes: file.size,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      setFormData({
        title: '',
        category: '',
        description: '',
        tags: [],
        accessPolicy: {
          allowedRoles: ['hr_admin'],
          allowedDepartments: [],
        },
        storageKey: '',
        mimeType: '',
        sizeBytes: undefined,
      });
      setFile(null);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Title *
            </label>
            <Input
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Annual Salary Revision Policy"
              required
            />
          </div>

            {/* File */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File *
              </label>
              <Input
                type="file"
                accept="*/*"
                onChange={e => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                }}
                required
              />
              {file && (
                <p className="mt-1 text-xs text-gray-600">
                  {file.name} • {(file.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <Select value={formData.category} onValueChange={value =>
              setFormData(prev => ({ ...prev, category: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              value={formData.description || ''}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter document description"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Enter tag and press Add"
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add Tag
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-600"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Access Policy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who can access this document?
            </label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map(({ label, value }) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.accessPolicy.allowedRoles.includes(value)}
                    onChange={() => handleRoleChange(value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Uploading...' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
