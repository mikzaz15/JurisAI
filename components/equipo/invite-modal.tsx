"use client";

import { useState } from "react";
import { X, Mail, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InviteModalProps {
  onClose: () => void;
  onInvited: (email: string) => void;
}

const ROLES = [
  { value: "ADMIN", label: "Administrador", desc: "Acceso total excepto eliminar org" },
  { value: "LAWYER", label: "Abogado", desc: "Investigar, redactar, gestionar asuntos" },
  { value: "PARALEGAL", label: "Paralegal", desc: "Investigar, redactar, ver asuntos" },
  { value: "VIEWER", label: "Observador", desc: "Solo lectura" },
];

export function InviteModal({ onClose, onInvited }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("LAWYER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/configuracion/equipo/invitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();

      if (data.success) {
        onInvited(email);
        onClose();
      } else {
        setError(data.error?.message || "Error al enviar la invitación");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0C1B2A] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Invitar miembro</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300">Correo electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                type="email"
                placeholder="abogado@despacho.com.mx"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-[#C9A84C]"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300">Rol</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-[#C9A84C]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0C1B2A] border-white/10">
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-white focus:bg-white/10">
                    <div>
                      <div className="font-medium">{r.label}</div>
                      <div className="text-xs text-slate-400">{r.desc}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/10 text-white hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !email}
              className="flex-1 bg-[#C9A84C] hover:bg-[#b8943c] text-[#0C1B2A] font-semibold"
            >
              {loading ? "Enviando..." : "Enviar invitación"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
