"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  FolderTree,
  Factory,
  Upload,
  ShoppingBag,
  Users,
  Car,
  Inbox,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";

// Each link's `roles` list mirrors the backend's requireRole gate on the API
// it depends on -- keep them in sync so the panel never shows a link that
// just 403s. Omit `roles` for links every admin-capable role can see.
const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package, roles: ["ADMIN", "SUPER_ADMIN", "WAREHOUSE_STAFF"] },
  { href: "/admin/submissions", label: "Submissions", icon: Inbox, roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/brands", label: "Brands", icon: Tags, roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/manufacturers", label: "Manufacturers", icon: Factory, roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/vehicles", label: "Vehicles", icon: Car, roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/import", label: "Import", icon: Upload, roles: ["ADMIN", "SUPER_ADMIN", "WAREHOUSE_STAFF"] },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, roles: ["ADMIN", "SUPER_ADMIN", "SUPPORT"] },
  { href: "/admin/users", label: "Users", icon: Users, roles: ["ADMIN", "SUPER_ADMIN"] },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, logout } = useAdminStore();
  const [hydrated, setHydrated] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return;
    if (pathname === "/admin/login") return;
    if (!token || !user) router.replace("/admin/login");
  }, [hydrated, token, user, pathname, router]);

  useEffect(() => setMobileNavOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  if (pathname === "/admin/login") return <>{children}</>;

  if (!hydrated || !token || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white/60">Loading…</div>;
  }

  const visibleLinks =
    user.role === "STAFF_PIN"
      ? LINKS.filter((l) => l.href === "/admin/products")
      : LINKS.filter((l) => !l.roles || l.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-56 shrink-0 bg-slate-900 lg:flex lg:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
          <div className="flex size-8 items-center justify-center rounded bg-brand-red text-xs font-bold text-white">GE</div>
          <span className="font-display text-sm font-bold text-white">Admin Panel</span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {visibleLinks.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-brand-red text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="mb-2 truncate text-xs text-slate-400">{user.email}</div>
          <button
            onClick={() => {
              logout();
              router.push("/admin/login");
            }}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-64 max-w-[85%] flex-col bg-slate-900">
            <div className="flex h-14 items-center justify-between gap-2 border-b border-white/10 px-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded bg-brand-red text-xs font-bold text-white">GE</div>
                <span className="font-display text-sm font-bold text-white">Admin Panel</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
                className="rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
              {visibleLinks.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 rounded px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? "bg-brand-red text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-white/10 p-3">
              <div className="mb-2 truncate text-xs text-slate-400">{user.email}</div>
              <button
                onClick={() => {
                  logout();
                  router.push("/admin/login");
                }}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="rounded p-1.5 text-ink hover:bg-slate-100"
          >
            <Menu size={22} />
          </button>
          <span className="font-display text-sm font-bold text-ink">Gama Express Admin</span>
        </header>
        <main className="flex-1 overflow-x-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
