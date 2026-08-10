"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, User } from "lucide-react";
import SearchBar from "./SearchBar";
import MegaMenu from "./MegaMenu";
import MobileNav from "./MobileNav";
import LanguageSwitcher from "./LanguageSwitcher";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function Header() {
  const cartCount = useStore((s) => s.cart.reduce((n, l) => n + l.quantity, 0));
  const wishlistCount = useStore((s) => s.wishlist.length);
  const user = useStore((s) => s.user);
  const { t } = useT();

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-surface">
      {/* Main header */}
      <div className="container-page flex items-center gap-3 py-4 lg:gap-6">
        <MobileNav />
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/logo.jpg"
            alt="Gama Express Auto Pjesë"
            width={1707}
            height={740}
            priority
            className="h-16 w-auto object-contain sm:h-20"
          />
        </Link>

        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <Link href={user ? "/account" : "/login"} className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 hover:bg-surface-muted">
            <User size={20} className={user ? "text-brand-red" : "text-ink"} />
            <span className="hidden text-[11px] text-ink-soft sm:block">{user ? user.name.split(" ")[0] : t.header.signIn}</span>
          </Link>
          <Link href="/account?tab=wishlist" className="relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 hover:bg-surface-muted">
            <Heart size={20} className="text-ink" />
            <span className="hidden text-[11px] text-ink-soft sm:block">{t.header.favorites}</span>
            {wishlistCount > 0 && (
              <span className="absolute right-1 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-red text-[10px] font-semibold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 hover:bg-surface-muted">
            <ShoppingCart size={20} className="text-ink" />
            <span className="hidden text-[11px] text-ink-soft sm:block">{t.header.cart}</span>
            {cartCount > 0 && (
              <span className="absolute right-1 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-red text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <SearchBar />
      </div>

      <MegaMenu />
    </header>
  );
}
