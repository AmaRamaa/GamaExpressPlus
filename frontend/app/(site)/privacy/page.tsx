"use client";

import { useT } from "@/lib/i18n";
import { SITE_EMAIL, SITE_PHONE_PRIMARY } from "@/lib/constants";

export default function PrivacyPage() {
  const { t } = useT();
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-ink">{t.privacy.title}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t.privacy.lastUpdated} {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long" })}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-soft">
          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">{t.privacy.storeTitle}</h2>
            <p>
              {t.privacy.storeBody}
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">{t.privacy.accountTitle}</h2>
            <p>
              {t.privacy.accountBody}
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">{t.privacy.formsTitle}</h2>
            <p>
              {t.privacy.formsBody}
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">{t.privacy.rightsTitle}</h2>
            <p>
              {t.privacy.rightsBody}
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">{t.privacy.contactTitle}</h2>
            <p>
              {t.privacy.contactIntro}{" "}
              <a href={`mailto:${SITE_EMAIL}`} className="font-medium text-brand-red hover:underline">{SITE_EMAIL}</a>{" "}
              {t.privacy.contactOr} {SITE_PHONE_PRIMARY}.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
