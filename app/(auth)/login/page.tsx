import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");
  return { title: t("title") };
}

export default async function LoginPage() {
  const t = await getTranslations("auth.login");

  return (
    <div className="min-h-screen bg-[#0C1B2A] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="font-serif text-2xl text-white">Juris</span>
        <span className="mx-1 h-6 w-px bg-[#C9A84C]" />
        <span className="text-2xl font-light tracking-tight text-[#C9A84C]">AI</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h1 className="font-serif text-2xl text-white">{t("title")}</h1>
            <p className="mt-1 text-sm text-white/60">{t("subtitle")}</p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-sm text-white/60">
            {t("noAccount")}{" "}
            <Link href="/register" className="text-[#C9A84C] hover:underline">
              {t("register")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
