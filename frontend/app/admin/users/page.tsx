"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
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

const STAFF_ROLES = ["WAREHOUSE_STAFF", "SUPPORT", "ADMIN", "SUPER_ADMIN"] as const;
const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: "Customer",
  BUSINESS: "Business",
  WAREHOUSE_STAFF: "Warehouse Staff",
  SUPPORT: "Support",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

const EMPTY_FORM = { email: "", password: "", firstName: "", lastName: "", role: "WAREHOUSE_STAFF" as string };

export default function AdminUsersPage() {
  const token = useAdminStore((s) => s.token);
  const currentUser = useAdminStore((s) => s.user);
  const canManage = currentUser?.role === "SUPER_ADMIN";

  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  function load() {
    api
      .get<UserRow[]>("/admin/users", token)
      .then(setUsers)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load users"));
  }

  useEffect(load, [token]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.email.trim() || !form.password.trim() || !form.firstName.trim() || !form.lastName.trim()) {
      setFormError("All fields are required.");
      return;
    }
    if (form.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    try {
      await api.post(
        "/admin/users",
        { email: form.email.trim(), password: form.password, firstName: form.firstName.trim(), lastName: form.lastName.trim(), role: form.role },
        token
      );
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(id: string, role: string) {
    setRowBusy(id);
    setError("");
    try {
      await api.patch(`/admin/users/${id}`, { role }, token);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update role");
    } finally {
      setRowBusy(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    setRowBusy(id);
    setError("");
    try {
      await api.delete(`/admin/users/${id}`, token);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete user");
    } finally {
      setRowBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Users</h1>
        <p className="text-sm text-ink-soft">{users.length} registered users</p>
      </div>

      {canManage && (
        <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="mb-3 text-sm font-semibold text-ink">Add staff / admin account</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-red"
              placeholder="First name"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            />
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-red"
              placeholder="Last name"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            />
            <input
              type="email"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-red"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <input
              type="password"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-red"
              placeholder="Password (min 8 chars)"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-red"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="mt-3 flex items-center gap-1.5 rounded-lg bg-brand-red px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark disabled:opacity-60"
          >
            <Plus size={16} /> {saving ? "Adding…" : "Add user"}
          </button>
        </form>
      )}

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-soft">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Company</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              {canManage && <th className="px-4 py-2.5 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-ink">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-2.5 text-ink-soft">{u.email}</td>
                <td className="px-4 py-2.5 text-ink-soft">{u.companyName || "—"}</td>
                <td className="px-4 py-2.5">
                  {canManage && STAFF_ROLES.includes(u.role as any) ? (
                    <select
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-brand-red"
                      value={u.role}
                      disabled={rowBusy === u.id || u.id === currentUser?.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      {STAFF_ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{ROLE_LABELS[u.role] || u.role}</span>
                  )}
                </td>
                {canManage && (
                  <td className="px-4 py-2.5 text-right">
                    {STAFF_ROLES.includes(u.role as any) && u.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDelete(u.id, `${u.firstName} ${u.lastName}`)}
                        disabled={rowBusy === u.id}
                        aria-label="Delete user"
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {users.length === 0 && !error && (
              <tr><td colSpan={canManage ? 5 : 4} className="px-4 py-8 text-center text-ink-soft">No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
