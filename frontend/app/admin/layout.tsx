"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  FolderTree,
  Upload,
  ShoppingBag,
  Users,
  LogOut,
} from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/brands", label: "Brands", icon: Tags },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/import", label: "Import", icon: Upload },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, logout } = useAdminStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return;
    if (pathname === "/admin/login") return;
    if (!token || !user) router.replace("/admin/login");
  }, [hydrated, token, user, pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;

  if (!hydrated || !token || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white/60">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-56 shrink-0 bg-slate-900 lg:flex lg:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
          <div className="flex size-8 items-center justify-center rounded bg-brand-red text-xs font-bold text-white">GE</div>
          <span className="font-display text-sm font-bold text-white">Admin Panel</span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {LINKS.map(({ href, label, icon: Icon, exact }) => {
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

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <span className="font-display text-sm font-bold text-ink">Gama Express Admin</span>
        </header>
        <main className="flex-1 overflow-x-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
