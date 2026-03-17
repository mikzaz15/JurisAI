"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Globe, LogOut, User, Settings, CreditCard, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: session } = useSession();
  const t = useTranslations("nav");
  const router = useRouter();
  const locale = useLocale();

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "U";

  function toggleLocale() {
    const newLocale = locale === "es" ? "en" : "es";
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0C1B2A] px-4 md:px-6">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/5 hover:text-white"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Spacer on desktop */}
      <div className="hidden md:block text-sm text-white/60" />

      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        {/* Locale toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLocale}
          className="gap-1.5 text-white/60 hover:text-white"
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs uppercase">{locale === "es" ? "EN" : "ES"}</span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-white/5">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image ?? undefined} />
                <AvatarFallback className="bg-[#C9A84C]/20 text-[#C9A84C] text-xs font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-white">{session?.user?.name}</p>
                <p className="text-xs text-white/40">{session?.user?.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border-white/10 bg-[#1a2e42] text-white"
          >
            <DropdownMenuLabel className="text-white/60">Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => router.push("/app/configuracion/perfil")}
              className="cursor-pointer hover:bg-white/10"
            >
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/app/configuracion")}
              className="cursor-pointer hover:bg-white/10"
            >
              <Settings className="mr-2 h-4 w-4" />
              {t("configuracion")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/app/configuracion/facturacion")}
              className="cursor-pointer hover:bg-white/10"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Facturación
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
