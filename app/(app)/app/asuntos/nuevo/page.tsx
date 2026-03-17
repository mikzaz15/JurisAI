import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NuevoAsuntoForm } from "@/components/asuntos/nuevo-asunto-form";

export default async function NuevoAsuntoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="h-full overflow-y-auto p-6">
      <NuevoAsuntoForm />
    </div>
  );
}
