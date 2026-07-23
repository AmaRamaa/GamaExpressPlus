"use client";

import { LOCALES, useT } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useT();

  return (
    <div className="flex items-center gap-0.5 rounded-md bg-white/10 p-0.5">
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`rounded px-1.5 py-0.5 text-xs font-semibold transition-colors ${
            locale === code ? "bg-white text-ink" : "text-white/70 hover:text-white"
          }`}
          aria-pressed={locale === code}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
