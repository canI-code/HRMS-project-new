"use client";

import { useAuth } from "@/lib/auth/context";
import { DocumentsBrowser } from "@/components/documents/DocumentsBrowser";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">Manage your organization's documents.</p>
      </div>
      <DocumentsBrowser />
    </div>
  );
}
