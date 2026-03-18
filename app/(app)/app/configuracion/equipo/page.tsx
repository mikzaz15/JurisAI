"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, Users, Crown, Shield, Scale, BookOpen, Eye, MoreVertical, Trash2, Edit3, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InviteModal } from "@/components/equipo/invite-modal";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  role: string;
  createdAt: string;
  user: { id: string; name: string; email: string; image: string | null; createdAt: string };
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

interface TeamData {
  members: TeamMember[];
  pendingInvites: PendingInvite[];
  seats: { used: number; limit: number };
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  OWNER: { label: "Propietario", icon: Crown, color: "text-[#C9A84C]" },
  ADMIN: { label: "Administrador", icon: Shield, color: "text-blue-400" },
  LAWYER: { label: "Abogado", icon: Scale, color: "text-emerald-400" },
  PARALEGAL: { label: "Paralegal", icon: BookOpen, color: "text-purple-400" },
  VIEWER: { label: "Observador", icon: Eye, color: "text-slate-400" },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.VIEWER;
  const Icon = cfg.icon;
  return (
    <span className={cn("flex items-center gap-1 text-xs font-medium", cfg.color)}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return (
      <img src={image} alt={name} className="h-9 w-9 rounded-full object-cover" />
    );
  }
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="h-9 w-9 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] text-sm font-semibold">
      {initials}
    </div>
  );
}

export default function EquipoPage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    const res = await fetch("/api/configuracion/equipo");
    const d = await res.json();
    if (d.success) setData(d.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  async function handleRoleChange(memberId: string, newRole: string) {
    setUpdatingRole(memberId);
    try {
      const res = await fetch(`/api/configuracion/equipo/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const d = await res.json();
      if (d.success) {
        await fetchTeam();
        setToast("Rol actualizado");
      } else {
        setToast(d.error?.message || "Error al actualizar");
      }
    } catch {
      setToast("Error de conexión");
    } finally {
      setUpdatingRole(null);
      setTimeout(() => setToast(null), 3000);
    }
  }

  async function handleRemove(member: TeamMember) {
    setRemoving(member.id);
    try {
      const res = await fetch(`/api/configuracion/equipo/${member.id}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        await fetchTeam();
        setToast(`${member.user.name} fue eliminado del equipo`);
      } else {
        setToast(d.error?.message || "Error al eliminar");
      }
    } catch {
      setToast("Error de conexión");
    } finally {
      setRemoving(null);
      setConfirmRemove(null);
      setTimeout(() => setToast(null), 3000);
    }
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.16),transparent_24%),linear-gradient(180deg,#102032_0%,#0B1520_55%,#09131D_100%)]">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
        </div>
      </div>
    );
  }

  const seatsAtLimit = data && data.seats.used >= data.seats.limit;

  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.16),transparent_24%),linear-gradient(180deg,#102032_0%,#0B1520_55%,#09131D_100%)]">
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8 md:px-8 md:py-10">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-[#0C1B2A] border border-white/10 px-4 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}

      {/* Confirm remove modal */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#0C1B2A] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">¿Eliminar miembro?</h3>
            <p className="text-sm text-slate-400">
              <strong className="text-white">{confirmRemove.user.name}</strong> perderá acceso a la organización.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmRemove(null)}
                className="flex-1 border-white/10 text-white hover:bg-white/5"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleRemove(confirmRemove)}
                disabled={removing === confirmRemove.id}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
              >
                {removing === confirmRemove.id ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvited={(email) => {
            setToast(`Invitación enviada a ${email}`);
            setTimeout(() => setToast(null), 3000);
            fetchTeam();
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipo</h1>
          {data && (
            <p className="text-slate-400 mt-1 text-sm">
              {data.seats.used} de {data.seats.limit} asientos utilizados
            </p>
          )}
        </div>
        <Button
          onClick={() => setShowInvite(true)}
          disabled={seatsAtLimit || false}
          className="bg-[#C9A84C] hover:bg-[#b8943c] text-[#0C1B2A] font-semibold gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Invitar miembro
        </Button>
      </div>

      {seatsAtLimit && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
          Has alcanzado el límite de asientos de tu plan.{" "}
          <a href="/app/configuracion/facturacion" className="underline font-medium">
            Actualiza tu plan
          </a>{" "}
          para agregar más miembros.
        </div>
      )}

      {/* Seat usage bar */}
      {data && (
        <div className="rounded-xl border border-white/10 bg-white/3 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Asientos utilizados
            </span>
            <span className="text-sm font-medium text-white">
              {data.seats.used}/{data.seats.limit}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                (data.seats.used / data.seats.limit) >= 0.9 ? "bg-red-500" : "bg-[#C9A84C]"
              )}
              style={{ width: `${Math.min((data.seats.used / data.seats.limit) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">Miembros activos</h2>
        <div className="rounded-xl border border-white/10 overflow-hidden">
          {data?.members.map((member, idx) => (
            <div
              key={member.id}
              className={cn(
                "flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors",
                idx > 0 && "border-t border-white/5"
              )}
            >
              <Avatar name={member.user.name} image={member.user.image} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm truncate">{member.user.name}</div>
                <div className="text-xs text-slate-500 truncate">{member.user.email}</div>
              </div>
              <div className="flex items-center gap-3">
                {member.role === "OWNER" ? (
                  <RoleBadge role="OWNER" />
                ) : (
                  <Select
                    value={member.role}
                    onValueChange={(v) => handleRoleChange(member.id, v)}
                    disabled={updatingRole === member.id}
                  >
                    <SelectTrigger className="h-7 w-36 bg-transparent border-white/10 text-white text-xs focus:border-[#C9A84C]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0C1B2A] border-white/10">
                      {["ADMIN", "LAWYER", "PARALEGAL", "VIEWER"].map((r) => (
                        <SelectItem key={r} value={r} className="text-white focus:bg-white/10 text-xs">
                          {ROLE_CONFIG[r]?.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {member.role !== "OWNER" && (
                  <button
                    onClick={() => setConfirmRemove(member)}
                    className="text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending invites */}
      {data && data.pendingInvites.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-white">Invitaciones pendientes</h2>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            {data.pendingInvites.map((inv, idx) => (
              <div
                key={inv.id}
                className={cn(
                  "flex items-center gap-4 px-5 py-4",
                  idx > 0 && "border-t border-white/5"
                )}
              >
                <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm truncate">{inv.email}</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <Clock className="h-3 w-3" />
                    Expira {new Date(inv.expiresAt).toLocaleDateString("es-MX")}
                  </div>
                </div>
                <Badge className="border border-white/10 bg-white/5 text-slate-400 text-xs">
                  {ROLE_CONFIG[inv.role]?.label || inv.role}
                </Badge>
                <Badge className="border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs">
                  Pendiente
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
