"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isBusinessAccount: boolean;
  companyName: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const token = useAdminStore((s) => s.token);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<UserRow[]>("/admin/users", token)
      .then(setUsers)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load users"));
  }, [token]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Users</h1>
        <p className="text-sm text-ink-soft">{users.length} registered users</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-soft">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Company</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-ink">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-2.5 text-ink-soft">{u.email}</td>
                <td className="px-4 py-2.5 text-ink-soft">{u.companyName || "—"}</td>
                <td className="px-4 py-2.5">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{u.role}</span>
                </td>
              </tr>
            ))}
            {users.length === 0 && !error && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-soft">No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
