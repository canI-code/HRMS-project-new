import { Metadata } from 'next';
import { DocumentsBrowser } from '@/components/documents/DocumentsBrowser';
import { ProtectedPage } from '@/components/auth/ProtectedPage';
import { Protected } from '@/components/auth/Protected';

export const metadata: Metadata = {
  title: 'Documents | HRMS',
  description: 'Manage and organize documents',
};

export default function DocumentsPage() {
  return (
    <ProtectedPage>
      <Protected roles={["manager", "hr_admin", "super_admin"]} fallback={
        <div className="container mx-auto px-4 py-16">
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
            <p className="text-sm text-yellow-800">You don’t have access to view the Documents module.</p>
          </div>
        </div>
      }>
        <div className="container mx-auto px-4 py-8">
          <DocumentsBrowser />
        </div>
      </Protected>
    </ProtectedPage>
  );
}
