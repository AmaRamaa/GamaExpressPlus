"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function LoginPage() {
  const { t } = useT();
  const router = useRouter();
  const login = useStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      router.push("/account");
    } else {
      setError(result.error || t.login.genericError);
    }
  }

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-sm">
        <div className="mb-6 text-center">
          <LogIn size={28} className="mx-auto mb-3 text-brand-red" />
          <h1 className="font-display text-2xl font-bold text-ink">{t.login.title}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {t.login.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-surface-border bg-surface p-6 shadow-soft">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">{t.login.emailLabel}</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">{t.login.passwordLabel}</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm"
            />
          </div>
          {error && <p className="text-xs text-brand-red">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white hover:bg-brand-red-dark disabled:opacity-60">
            {loading ? t.login.signingIn : t.login.signInButton}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-soft">
          {t.login.noSignupText}{" "}
          <Link href="/business" className="font-medium text-brand-red hover:underline">{t.login.setupBusinessLink}</Link>
          {" "}{t.login.orText}{" "}
          <Link href="/contact" className="font-medium text-brand-red hover:underline">{t.login.contactUsLink}</Link>.
        </p>
      </div>
    </div>
  );
}
