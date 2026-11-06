"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Settings, Gamepad2, Menu, X } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, exact: true },
  { label: "Produk", href: "/products", icon: Package },
  { label: "Pesanan", href: "/orders", icon: ShoppingBag },
  { label: "Pengaturan", href: "/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const navContent = (
    <nav className="p-3 space-y-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-150 ${
              active ? "bg-accent text-base font-600" : "text-muted hover:text-white hover:bg-surface"
            }`}
          >
            <Icon size={16} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col w-56 border-r border-border bg-surface min-h-dvh sticky top-0">
        <div className="flex items-center gap-2 px-4 h-16 border-b border-border">
          <span className="p-1.5 rounded-lg bg-accent text-base">
            <Gamepad2 size={16} strokeWidth={2.5} />
          </span>
          <div>
            <span className="font-display font-700 text-sm block leading-tight">ALIP STORE</span>
            <span className="text-2xs text-muted">Admin Panel</span>
          </div>
        </div>
        {navContent}
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-surface border-b border-border">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-accent text-base">
            <Gamepad2 size={14} strokeWidth={2.5} />
          </span>
          <span className="font-display font-700 text-sm">Admin</span>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="p-2 rounded-lg hover:bg-surface-2" aria-label="Menu">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative w-56 bg-surface border-r border-border pt-14">{navContent}</div>
        </div>
      )}
    </>
  );
}
