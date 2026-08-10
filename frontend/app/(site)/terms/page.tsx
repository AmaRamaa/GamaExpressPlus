"use client";

import { SITE_EMAIL, SITE_PHONE_PRIMARY } from "@/lib/constants";
import { useT } from "@/lib/i18n";

export default function TermsPage() {
  const { t } = useT();

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-ink">{t.terms.title}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {t.terms.lastUpdated} {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long" })}
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-soft">
          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">{t.terms.aboutHeading}</h2>
            <p>{t.terms.aboutBody}</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">{t.terms.pricingHeading}</h2>
            <p>
              {t.terms.pricingBodyPrefix} {SITE_PHONE_PRIMARY} {t.terms.pricingBodySuffix}
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">{t.terms.orderingHeading}</h2>
            <p>{t.terms.orderingBody}</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">{t.terms.fitmentHeading}</h2>
            <p>{t.terms.fitmentBody}</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">{t.terms.returnsHeading}</h2>
            <p>
              {t.terms.returnsBodyPrefix}{" "}
              <a href="/returns" className="font-medium text-brand-red hover:underline">{t.terms.returnsLinkText}</a>{" "}
              {t.terms.returnsBodySuffix}
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">{t.terms.contactHeading}</h2>
            <p>
              {t.terms.contactBodyPrefix}{" "}
              <a href={`mailto:${SITE_EMAIL}`} className="font-medium text-brand-red hover:underline">{SITE_EMAIL}</a>{" "}
              {t.terms.contactBodyMiddle} {SITE_PHONE_PRIMARY}.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
