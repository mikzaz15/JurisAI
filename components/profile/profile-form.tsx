"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/lib/use-toast";

const profileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  locale: z.enum(["es-MX", "en"]),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Requerido"),
    newPassword: z.string().min(8, "Mínimo 8 caracteres"),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmNewPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface ProfileFormProps {
  user: { id: string; name: string; email: string; locale: string };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const t = useTranslations("profile");
  const { toast } = useToast();
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, locale: user.locale as "es-MX" | "en" },
  });

  const {
    register: registerPwd,
    handleSubmit: handleSubmitPwd,
    reset: resetPwd,
    formState: { errors: errorsPwd, isSubmitting: isSubmittingPwd },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  async function onProfileSubmit(data: ProfileFormData) {
    const res = await fetch("/api/configuracion/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) {
      toast({ variant: "success" as const, title: t("saved") });
    } else {
      toast({ variant: "destructive", title: "Error al guardar los cambios" });
    }
  }

  async function onPasswordSubmit(data: PasswordFormData) {
    const res = await fetch("/api/configuracion/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    });
    const json = await res.json();
    if (json.success) {
      toast({ variant: "success" as const, title: "Contraseña actualizada" });
      resetPwd();
      setShowPasswordSection(false);
    } else {
      toast({
        variant: "destructive",
        title: json.error?.code === "INVALID_PASSWORD"
          ? "Contraseña actual incorrecta"
          : "Error al cambiar la contraseña",
      });
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("name")}</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" value={user.email} disabled className="cursor-not-allowed opacity-60" />
          <p className="text-xs text-gray-400">El correo no puede cambiarse.</p>
        </div>

        <div className="space-y-1.5">
          <Label>{t("locale")}</Label>
          <Select
            defaultValue={user.locale}
            onValueChange={(val) => setValue("locale", val as "es-MX" | "en")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es-MX">{t("localeOptions.es-MX")}</SelectItem>
              <SelectItem value="en">{t("localeOptions.en")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : t("saveChanges")}
        </Button>
      </form>

      {/* Password section */}
      <div className="border-t border-gray-100 pt-6">
        <button
          type="button"
          onClick={() => setShowPasswordSection(!showPasswordSection)}
          className="text-sm font-medium text-[#C9A84C] hover:underline"
        >
          {t("changePassword")}
        </button>

        {showPasswordSection && (
          <form
            onSubmit={handleSubmitPwd(onPasswordSubmit)}
            className="mt-4 space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
              <Input id="currentPassword" type="password" {...registerPwd("currentPassword")} />
              {errorsPwd.currentPassword && (
                <p className="text-xs text-red-500">{errorsPwd.currentPassword.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">{t("newPassword")}</Label>
                <Input id="newPassword" type="password" {...registerPwd("newPassword")} />
                {errorsPwd.newPassword && (
                  <p className="text-xs text-red-500">{errorsPwd.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmNewPassword">{t("confirmNewPassword")}</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  {...registerPwd("confirmNewPassword")}
                />
                {errorsPwd.confirmNewPassword && (
                  <p className="text-xs text-red-500">{errorsPwd.confirmNewPassword.message}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isSubmittingPwd}>
                {isSubmittingPwd ? "Actualizando..." : "Actualizar contraseña"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordSection(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
