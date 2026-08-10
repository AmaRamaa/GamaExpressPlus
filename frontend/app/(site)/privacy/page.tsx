import { SITE_EMAIL, SITE_PHONE_PRIMARY } from "@/lib/constants";

export default function PrivacyPage() {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-ink">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-soft">Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long" })}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-soft">
          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">What we store</h2>
            <p>
              Gama Express Sh.p.k. ("we", "us") runs this website. We store a small amount of data directly in your
              browser (via local storage, not tracking cookies) to make the site work: your shopping cart contents,
              your language preference, and — if you sign in — your session. We don't use this to track you across
              other websites, and we don't sell or share it with advertisers.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Account information</h2>
            <p>
              If you have a business/wholesale account, we store your name, email, phone number, and company details
              to process orders and provide account-specific pricing. Orders themselves are confirmed by phone or
              WhatsApp — we don't process payments online, so we never see or store your card details.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Contact forms</h2>
            <p>
              Information you submit through our contact or part-request forms (name, email, phone, message) is used
              only to respond to your enquiry.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Your rights</h2>
            <p>
              You can ask us what information we hold about you, ask us to correct it, or ask us to delete it, at
              any time — just contact us using the details below.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Contact</h2>
            <p>
              Questions about this policy? Reach us at{" "}
              <a href={`mailto:${SITE_EMAIL}`} className="font-medium text-brand-red hover:underline">{SITE_EMAIL}</a>{" "}
              or {SITE_PHONE_PRIMARY}.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
