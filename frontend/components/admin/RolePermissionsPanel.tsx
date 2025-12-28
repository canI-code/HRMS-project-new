"use client";

import type { RolePermissions } from "@/lib/admin/types";
import type { UserRole } from "@/lib/auth/types";

const roleLabel = (role: UserRole) => {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "hr_admin":
      return "HR Admin";
    case "manager":
      return "Manager";
    case "employee":
      return "Employee";
    default:
      return role;
  }
};

export function RolePermissionsPanel({ roles }: { roles: RolePermissions[] }) {
  return (
    <div className="space-y-4">
      {roles.map((role) => (
        <div key={role.role} className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">{roleLabel(role.role)}</p>
              <p className="text-xs text-zinc-600">{role.permissions.length} permissions</p>
            </div>
          </div>
          <div className="divide-y divide-zinc-200">
            {role.permissions.map((perm) => (
              <div key={`${perm.resource}:${perm.action}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{perm.resource}</p>
                  <p className="text-xs text-zinc-600">Action: {perm.action}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <span className="rounded-full bg-zinc-100 px-2 py-1 font-semibold text-zinc-800">Min role: {roleLabel(perm.minRole)}</span>
                  {perm.allowSelfAccess && (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">Self access</span>
                  )}
                  {perm.organizationBoundary && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-700">Org-scoped</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
