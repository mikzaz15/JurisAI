import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Static Mexican regulatory calendar deadlines
// In production this would be dynamic, fetched from a service

interface Deadline {
  id: string;
  title: string;
  date: string;
  authority: string;
  areaOfLaw: string;
  description: string;
  recurrence: "monthly" | "annual" | "quarterly" | "one-time";
  dofReference?: string;
}

function getUpcomingDeadlines(): Deadline[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const deadlines: Deadline[] = [
    // SAT monthly declarations
    {
      id: `sat-iva-${year}-${month}`,
      title: "Declaración mensual IVA",
      date: new Date(year, month, 17).toISOString(),
      authority: "SAT",
      areaOfLaw: "FISCAL",
      description: "Presentación de declaración mensual del Impuesto al Valor Agregado (IVA)",
      recurrence: "monthly",
      dofReference: "CFF Art. 6",
    },
    {
      id: `sat-isr-${year}-${month}`,
      title: "Pago provisional ISR",
      date: new Date(year, month, 17).toISOString(),
      authority: "SAT",
      areaOfLaw: "FISCAL",
      description: "Presentación de pago provisional del Impuesto Sobre la Renta (ISR)",
      recurrence: "monthly",
      dofReference: "LISR Art. 14",
    },
    // IMSS
    {
      id: `imss-${year}-${month}`,
      title: "Pago de cuotas IMSS",
      date: new Date(year, month - 1, 17).toISOString(),
      authority: "IMSS",
      areaOfLaw: "LABORAL",
      description: "Pago bimestral de cuotas obrero-patronales al IMSS",
      recurrence: "monthly",
    },
    // INFONAVIT
    {
      id: `infonavit-${year}-${month}`,
      title: "Aportaciones INFONAVIT",
      date: new Date(year, month - 1, 17).toISOString(),
      authority: "INFONAVIT",
      areaOfLaw: "LABORAL",
      description: "Pago bimestral de aportaciones al INFONAVIT",
      recurrence: "monthly",
    },
    // Annual declarations
    {
      id: `sat-anual-${year}`,
      title: "Declaración anual personas morales",
      date: new Date(year, 2, 31).toISOString(), // March 31
      authority: "SAT",
      areaOfLaw: "FISCAL",
      description: "Presentación de declaración anual para personas morales (ejercicio fiscal anterior)",
      recurrence: "annual",
      dofReference: "CFF Art. 76",
    },
    {
      id: `sat-anual-pf-${year}`,
      title: "Declaración anual personas físicas",
      date: new Date(year, 3, 30).toISOString(), // April 30
      authority: "SAT",
      areaOfLaw: "FISCAL",
      description: "Presentación de declaración anual para personas físicas con actividad empresarial",
      recurrence: "annual",
    },
    {
      id: `stps-${year}`,
      title: "Reporte STPS Capacitación y Adiestramiento",
      date: new Date(year, 3, 30).toISOString(), // April 30
      authority: "STPS",
      areaOfLaw: "LABORAL",
      description: "Presentación del informe anual de actividades de capacitación y adiestramiento",
      recurrence: "annual",
      dofReference: "LFT Art. 153-A",
    },
    {
      id: `cnbv-${year}`,
      title: "Reporte CNBV entidades financieras",
      date: new Date(year, 0, 31).toISOString(), // January 31
      authority: "CNBV",
      areaOfLaw: "MERCANTIL",
      description: "Presentación de información financiera regulatoria a la CNBV",
      recurrence: "annual",
    },
    {
      id: `cofepris-${year}`,
      title: "Renovación de licencias sanitarias",
      date: new Date(year, 5, 30).toISOString(), // June 30
      authority: "COFEPRIS",
      areaOfLaw: "ADMINISTRATIVO",
      description: "Trámite de renovación de licencias y permisos sanitarios",
      recurrence: "annual",
    },
  ];

  // Filter to only future deadlines (next 90 days)
  const future = new Date();
  future.setDate(future.getDate() + 90);

  return deadlines
    .filter((d) => {
      const dt = new Date(d.date);
      return dt >= now && dt <= future;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const deadlines = getUpcomingDeadlines();

  return NextResponse.json({
    success: true,
    data: { deadlines },
  });
}
