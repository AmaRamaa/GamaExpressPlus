import { SITE_EMAIL, SITE_PHONE_PRIMARY } from "@/lib/constants";

export default function TermsPage() {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-ink">Terms of Service</h1>
        <p className="mt-2 text-sm text-ink-soft">Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long" })}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-soft">
          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">About Gama Express</h2>
            <p>
              This website is operated by Gama Express Sh.p.k. (Business Nr. 810100587), a distributor of genuine
              and aftermarket exterior auto parts based in Kosovo.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Browsing and pricing</h2>
            <p>
              Prices shown for signed-in business accounts reflect that account's agreed pricing. All other pricing
              is confirmed by phone or WhatsApp — call us at {SITE_PHONE_PRIMARY} for a quote on any part.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Ordering and payment</h2>
            <p>
              We don't process payments through this website. Orders are placed and confirmed directly with our
              team by phone or WhatsApp, and payment is arranged in person or by whatever method we agree on the
              call — stock availability, final pricing, and delivery are confirmed at that point.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Fitment</h2>
            <p>
              We do our best to verify part compatibility against the vehicle details you provide, but you should
              confirm fitment (including VIN/chassis-specific variations) with us before installation.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Returns and warranty</h2>
            <p>
              See our <a href="/returns" className="font-medium text-brand-red hover:underline">Returns & Warranty</a> page
              for details on returning or exchanging a part.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Contact</h2>
            <p>
              Questions about these terms? Reach us at{" "}
              <a href={`mailto:${SITE_EMAIL}`} className="font-medium text-brand-red hover:underline">{SITE_EMAIL}</a>{" "}
              or {SITE_PHONE_PRIMARY}.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
