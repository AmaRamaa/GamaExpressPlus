"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";

const STAFF_NAME_KEY = "gama-express-staff-name";

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAdminStore((s) => s.login);
  const loginWithPin = useAdminStore((s) => s.loginWithPin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [pinCode, setPinCode] = useState("");
  const [staffName, setStaffName] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem(STAFF_NAME_KEY);
    if (savedName) setStaffName(savedName);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      router.push("/admin");
    } else {
      setError(result.error || "Login failed");
    }
  }

  async function handlePinSubmit(e: FormEvent) {
    e.preventDefault();
    setPinError("");
    setPinLoading(true);
    if (staffName.trim()) {
      localStorage.setItem(STAFF_NAME_KEY, staffName.trim());
    }
    const result = await loginWithPin(pinCode.trim(), staffName.trim() || undefined);
    setPinLoading(false);
    if (result.ok) {
      router.push("/admin/products");
    } else {
      setPinError(result.error || "Login failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-lg bg-brand-red">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <h1 className="font-display text-xl font-bold text-white">Gama Express Admin</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in with your admin account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-red"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-red"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-red py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-red-dark disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-wide text-slate-500">or enter staff code</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handlePinSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Staff PIN</label>
            <input
              type="text"
              inputMode="numeric"
              required
              minLength={4}
              maxLength={8}
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder="e.g. 4821"
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-red"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Your name (optional)</label>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="e.g. Blerim"
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-red"
            />
          </div>
          {pinError && <p className="text-sm text-red-400">{pinError}</p>}
          <button
            type="submit"
            disabled={pinLoading}
            className="w-full rounded-lg border border-white/10 bg-slate-800 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
          >
            {pinLoading ? "Signing in…" : "Sign in with code"}
          </button>
        </form>
      </div>
    </div>
  );
}
