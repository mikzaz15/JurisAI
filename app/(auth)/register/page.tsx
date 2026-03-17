import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { JurisAILogo } from "@/components/ui/jurisai-logo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.register");
  return { title: t("title") };
}

export default async function RegisterPage() {
  const t = await getTranslations("auth.register");

  return (
    <div className="min-h-screen bg-[#0C1B2A] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center">
        <JurisAILogo size="md" />
      </Link>

      <div className="w-full max-w-lg">
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h1 className="font-serif text-2xl text-white">{t("title")}</h1>
            <p className="mt-1 text-sm text-white/60">{t("subtitle")}</p>
          </div>

          <RegisterForm />

          <p className="mt-6 text-center text-sm text-white/60">
            {t("haveAccount")}{" "}
            <Link href="/login" className="text-[#C9A84C] hover:underline">
              {t("login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
