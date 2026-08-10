"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { useT } from "@/lib/i18n";

const STORAGE_KEY = "gama-express-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { t } = useT();

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-surface-border bg-surface p-4 shadow-lifted">
      <div className="container-page flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="flex items-start gap-2 text-xs text-ink-soft sm:items-center">
          <Cookie size={16} className="mt-0.5 shrink-0 text-brand-red sm:mt-0" />
          {t.cookies.message}{" "}
          <Link href="/privacy" className="font-medium text-brand-red hover:underline">
            {t.cookies.learnMore}
          </Link>
        </p>
        <button
          onClick={accept}
          className="shrink-0 rounded-lg bg-brand-red px-5 py-2 text-xs font-semibold text-white hover:bg-brand-red-dark"
        >
          {t.cookies.accept}
        </button>
      </div>
    </div>
  );
}
