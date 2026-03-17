"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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

const registerSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Correo electrónico inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
    orgName: z.string().min(2, "El nombre de la organización es requerido"),
    orgType: z.enum(["LAW_FIRM", "CORPORATE", "NOTARIA", "SME", "INDIVIDUAL"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const ORG_TYPES = ["LAW_FIRM", "CORPORATE", "NOTARIA", "SME", "INDIVIDUAL"] as const;

export function RegisterForm() {
  const t = useTranslations("auth.register");
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { orgType: "LAW_FIRM" },
  });

  async function onSubmit(data: RegisterFormData) {
    const res = await fetch("/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
        orgName: data.orgName,
        orgType: data.orgType,
      }),
    });

    const json = await res.json();

    if (!json.success) {
      if (json.error?.code === "EMAIL_EXISTS") {
        toast({ variant: "destructive", title: t("errors.emailExists") });
      } else {
        toast({ variant: "destructive", title: t("errors.generic") });
      }
      return;
    }

    // Auto sign in after registration
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      router.push("/login");
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-white/80">
          {t("name")}
        </Label>
        <Input
          id="name"
          placeholder={t("namePlaceholder")}
          autoComplete="name"
          className="border-white/20 bg-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#C9A84C]"
          {...register("name")}
        />
        {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-white/80">
          {t("email")}
        </Label>
        <Input
          id="email"
          type="email"
          placeholder={t("emailPlaceholder")}
          autoComplete="email"
          className="border-white/20 bg-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#C9A84C]"
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-white/80">
            {t("password")}
          </Label>
          <Input
            id="password"
            type="password"
            placeholder={t("passwordPlaceholder")}
            autoComplete="new-password"
            className="border-white/20 bg-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#C9A84C]"
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-white/80">
            {t("confirmPassword")}
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            className="border-white/20 bg-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#C9A84C]"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="orgName" className="text-white/80">
          {t("orgName")}
        </Label>
        <Input
          id="orgName"
          placeholder={t("orgNamePlaceholder")}
          className="border-white/20 bg-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#C9A84C]"
          {...register("orgName")}
        />
        {errors.orgName && <p className="text-xs text-red-400">{errors.orgName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-white/80">{t("orgType")}</Label>
        <Select
          defaultValue="LAW_FIRM"
          onValueChange={(val) =>
            setValue("orgType", val as RegisterFormData["orgType"], { shouldValidate: true })
          }
        >
          <SelectTrigger className="border-white/20 bg-white/10 text-white focus:ring-[#C9A84C]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORG_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`orgTypes.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.orgType && <p className="text-xs text-red-400">{errors.orgType.message}</p>}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>

      <p className="text-center text-xs text-white/40">
        {t("terms")}{" "}
        <a href="/terminos" className="text-[#C9A84C] hover:underline">
          {t("termsLink")}
        </a>{" "}
        {t("privacy")}{" "}
        <a href="/privacidad" className="text-[#C9A84C] hover:underline">
          {t("privacyLink")}
        </a>
      </p>
    </form>
  );
}
