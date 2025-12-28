"use client";

import { useMemo, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import type { AdminUser } from "@/lib/admin/types";
import type { AuthTokens } from "@/lib/auth/types";
import type { UserRole } from "@/lib/auth/types";

interface UsersTableProps {
  users: AdminUser[];
  tokens: AuthTokens;
  loading: boolean;
  isSuperAdmin: boolean;
  onRefresh: () => void;
}

export function UsersTable({ users, tokens, loading, isSuperAdmin, onRefresh }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [users, searchTerm]
  );

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isSuperAdmin) {
      setError("Only super admin can change roles");
      return;
    }

    try {
      setUpdating(userId);
      setError(null);
      setSuccess(null);

      await adminApi.updateUser(tokens, userId, { role: newRole });
      setSuccess(`User role updated`);
      setTimeout(() => setSuccess(null), 3000);
      onRefresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update role";
      setError(message);
    } finally {
      setUpdating(null);
    }
  };

  const handleActiveToggle = async (userId: string, currentActive: boolean) => {
    if (!isSuperAdmin) {
      setError("Only super admin can change status");
      return;
    }

    try {
      setUpdating(userId);
      setError(null);
      setSuccess(null);

      await adminApi.updateUser(tokens, userId, { isActive: !currentActive });
      setSuccess(`User ${!currentActive ? "activated" : "deactivated"}`);
      setTimeout(() => setSuccess(null), 3000);
      onRefresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      setError(message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      {error && (
        <div className="border-b border-zinc-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="border-b border-zinc-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="border-b border-zinc-200 p-4">
        <input
          type="text"
          placeholder="Search users by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-sm text-zinc-500">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-zinc-500">
          {users.length === 0 ? "No users found" : "No results match your search"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-semibold text-zinc-900">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900">Created</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600">{user.email}</td>
                  <td className="px-4 py-3 text-zinc-900">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-4 py-3">
                    {isSuperAdmin ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        disabled={updating === user._id}
                        className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-900 disabled:opacity-50"
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="hr_admin">HR Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    ) : (
                      <span className="inline-block rounded-full bg-zinc-100 px-2 py-1 font-semibold text-zinc-800">
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isSuperAdmin ? (
                      <button
                        onClick={() => handleActiveToggle(user._id, user.isActive)}
                        disabled={updating === user._id}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                          user.isActive
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </button>
                    ) : (
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
