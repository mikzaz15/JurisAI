"use client";

import { useState, createContext, useContext } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";

interface MobileNavCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
}
const MobileNavContext = createContext<MobileNavCtx>({ open: false, setOpen: () => {} });
export const useMobileNav = () => useContext(MobileNavContext);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <MobileNavContext.Provider value={{ open: mobileOpen, setOpen: setMobileOpen }}>
      <div className="flex h-screen overflow-hidden bg-[#0C1B2A]">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar — hidden on mobile unless open */}
        <div
          className={`
            fixed inset-y-0 left-0 z-50 md:relative md:flex md:translate-x-0
            transition-transform duration-300 ease-in-out
            ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <Sidebar onNavClick={() => setMobileOpen(false)} />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <TopBar onMenuClick={() => setMobileOpen(!mobileOpen)} />
          <main className="flex-1 overflow-hidden bg-gray-50">{children}</main>
        </div>
      </div>
    </MobileNavContext.Provider>
  );
}
