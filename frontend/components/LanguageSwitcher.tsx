"use client";

import { LOCALES, useT } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useT();

  return (
    <div className="flex items-center gap-0.5 rounded-md bg-surface-muted p-0.5">
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`rounded px-1.5 py-0.5 text-xs font-semibold transition-colors ${
            locale === code ? "bg-brand-red text-white" : "text-ink-soft hover:text-ink"
          }`}
          aria-pressed={locale === code}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
