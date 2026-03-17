"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, CreditCard, Users, Key } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsNav = [
  { href: "/app/configuracion/perfil", label: "Perfil", icon: User },
  { href: "/app/configuracion/facturacion", label: "Facturación", icon: CreditCard },
  { href: "/app/configuracion/equipo", label: "Equipo", icon: Users },
  { href: "/app/configuracion/api", label: "API Keys", icon: Key },
];

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full overflow-hidden">
      {/* Settings sidebar */}
      <aside className="w-48 shrink-0 border-r border-white/10 bg-[#0C1B2A] overflow-y-auto">
        <div className="p-3 pt-4">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Configuración
          </p>
          <nav className="space-y-0.5">
            {settingsNav.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-[#C9A84C]/15 text-[#C9A84C]"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </div>
    </div>
  );
}
