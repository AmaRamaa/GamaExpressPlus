import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import CookieConsent from "@/components/CookieConsent";
import LocalBusinessJsonLd from "@/components/seo/LocalBusinessJsonLd";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <LocalBusinessJsonLd />
      <Header />
      <main>{children}</main>
      <Footer />
      <WhatsAppButton />
      <CookieConsent />
    </div>
  );
}
