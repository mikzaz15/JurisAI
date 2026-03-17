"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Search,
  FileText,
  Briefcase,
  ShieldCheck,
  BarChart3,
  Settings,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { key: "dashboard", href: "/app", icon: LayoutDashboard, exact: true },
  { key: "investigador", href: "/app/investigador", icon: Search },
  { key: "documentos", href: "/app/documentos", icon: FileText },
  { key: "asuntos", href: "/app/asuntos", icon: Briefcase },
  { key: "cumplimiento", href: "/app/cumplimiento", icon: ShieldCheck },
  { key: "analitica", href: "/app/analitica", icon: BarChart3 },
];

export function Sidebar({ onNavClick }: { onNavClick?: () => void }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-white/10 bg-[#0C1B2A] transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-white/10 px-4">
        {!collapsed && (
          <Link href="/app" className="flex items-center gap-1.5">
            <span className="font-serif text-xl text-white">Juris</span>
            <span className="h-5 w-px bg-[#C9A84C]" />
            <span className="text-xl font-light tracking-tight text-[#C9A84C]">AI</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/app" className="mx-auto">
            <span className="font-serif text-xl text-[#C9A84C]">J</span>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-[#C9A84C]/15 text-[#C9A84C]"
                  : "text-white/60 hover:bg-white/5 hover:text-white",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? t(item.key as Parameters<typeof t>[0]) : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-[#C9A84C]" : "text-current"
                )}
              />
              {!collapsed && (
                <span className="truncate">{t(item.key as Parameters<typeof t>[0])}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="border-t border-white/10 p-3">
        <Link
          href="/app/configuracion"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
            pathname.startsWith("/app/configuracion")
              ? "bg-[#C9A84C]/15 text-[#C9A84C]"
              : "text-white/60 hover:bg-white/5 hover:text-white",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? t("configuracion") : undefined}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t("configuracion")}</span>}
        </Link>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-[#0C1B2A] text-white/60 hover:text-white"
        aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
  );
}
