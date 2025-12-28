'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Document } from '@/lib/documents/types';
import { UserRole } from '@/lib/auth/types';

interface AccessControlDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateAccess: (roles: UserRole[], departments?: string[]) => Promise<void>;
}

const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: 'Employee', value: 'employee' },
  { label: 'Manager', value: 'manager' },
  { label: 'HR Admin', value: 'hr_admin' },
  { label: 'Super Admin', value: 'super_admin' },
];

export function AccessControlDialog({
  document,
  open,
  onOpenChange,
  onUpdateAccess,
}: AccessControlDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(
    document?.accessPolicy.allowedRoles || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onUpdateAccess(selectedRoles, document?.accessPolicy.allowedDepartments);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Access Control</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Who can access this document?</h3>
            <div className="space-y-2">
              {ROLE_OPTIONS.map(({ label, value }) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(value)}
                    onChange={() => handleRoleChange(value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {document.accessPolicy.allowedDepartments &&
            document.accessPolicy.allowedDepartments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Allowed Departments</h4>
                <div className="flex flex-wrap gap-2">
                  {document.accessPolicy.allowedDepartments.map(dept => (
                    <span
                      key={dept}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Access'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
