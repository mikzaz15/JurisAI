import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, FileText, Briefcase, ArrowRight, Sparkles } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const t = await getTranslations("dashboard");

  const userId = session?.user?.id || undefined;
  const orgId = session?.user?.orgId || undefined;

  // Fetch quick stats
  const [queriesCount, documentsCount, mattersCount] = await Promise.all([
    userId ? prisma.researchSession.count({ where: { userId } }) : Promise.resolve(0),
    userId ? prisma.document.count({ where: { userId } }) : Promise.resolve(0),
    orgId ? prisma.matter.count({ where: { orgId, status: "ACTIVE" } }) : Promise.resolve(0),
  ]);

  const subscription = orgId
    ? await prisma.subscription.findUnique({ where: { orgId } })
    : null;

  const isTrialing = subscription?.status === "TRIALING";
  const trialDaysLeft = isTrialing && subscription?.currentPeriodEnd
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const firstName = session?.user?.name?.split(" ")[0] ?? "Usuario";

  return (
    <div className="h-full overflow-y-auto p-6">
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Trial banner */}
      {isTrialing && trialDaysLeft > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-[#C9A84C]" />
            <span className="text-gray-700">
              {t("trialBanner")}{" "}
              <span className="font-semibold text-[#C9A84C]">
                {t("trialDaysLeft", { days: trialDaysLeft })}
              </span>
            </span>
          </div>
          <Button size="sm" asChild>
            <Link href="/app/configuracion/facturacion">{t("upgradeCta")}</Link>
          </Button>
        </div>
      )}

      {/* Welcome header */}
      <div>
        <h1 className="font-serif text-3xl text-gray-900">
          Hola, {firstName}
        </h1>
        <p className="mt-1 text-gray-500">{t("welcomeMessage")}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={t("stats.queries")}
          value={queriesCount}
          icon={<Search className="h-5 w-5 text-[#C9A84C]" />}
        />
        <StatCard
          label={t("stats.documents")}
          value={documentsCount}
          icon={<FileText className="h-5 w-5 text-[#C9A84C]" />}
        />
        <StatCard
          label={t("stats.matters")}
          value={mattersCount}
          icon={<Briefcase className="h-5 w-5 text-[#C9A84C]" />}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickActionCard
          title={t("startResearch")}
          description="Consulta sobre leyes, códigos y jurisprudencia mexicana"
          href="/app/investigador"
          icon={<Search className="h-6 w-6" />}
          primary
        />
        <QuickActionCard
          title={t("createDocument")}
          description="Redacta contratos y escritos legales con IA"
          href="/app/documentos/nuevo"
          icon={<FileText className="h-6 w-6" />}
        />
        <QuickActionCard
          title={t("viewMatters")}
          description="Organiza tu trabajo por cliente y asunto"
          href="/app/asuntos"
          icon={<Briefcase className="h-6 w-6" />}
        />
      </div>

      {/* Empty state if no activity */}
      {queriesCount === 0 && documentsCount === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#C9A84C]/10">
            <Search className="h-8 w-8 text-[#C9A84C]" />
          </div>
          <h2 className="font-serif text-xl text-gray-900">{t("emptyState.title")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            {t("emptyState.description")}
          </p>
          <Button className="mt-6" size="lg" asChild>
            <Link href="/app/investigador">
              {t("emptyState.cta")} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <div className="rounded-lg bg-[#C9A84C]/10 p-2">{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
  primary = false,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-xl border p-5 transition-all hover:shadow-md ${
        primary
          ? "border-[#C9A84C]/30 bg-gradient-to-br from-[#C9A84C]/10 to-[#C9A84C]/5 hover:from-[#C9A84C]/20 hover:to-[#C9A84C]/10"
          : "border-gray-200 bg-white hover:border-[#C9A84C]/30"
      }`}
    >
      <div
        className={`mb-3 inline-flex rounded-lg p-2 ${
          primary ? "bg-[#C9A84C] text-white" : "bg-gray-100 text-gray-600"
        }`}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 group-hover:text-[#0C1B2A]">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </Link>
  );
}
