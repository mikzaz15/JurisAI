import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Key, Copy, AlertCircle } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = { title: "API Keys" };

export default async function ApiKeysPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const apiKeys = await prisma.apiKey.findMany({
    where: { orgId: session.user.orgId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, keyPrefix: true, createdAt: true, lastUsedAt: true, expiresAt: true },
  });

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-serif text-2xl text-gray-900">API Keys</h1>
          <p className="mt-1 text-sm text-gray-500">
            Accede a la API de JurisAI desde tus propias aplicaciones.
          </p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Próximamente</p>
            <p className="mt-0.5 text-amber-700">
              El acceso a la API de JurisAI estará disponible próximamente en los planes Pro y Empresa.
              Contacta a{" "}
              <a href="mailto:hola@jurisai.com.mx" className="underline">
                hola@jurisai.com.mx
              </a>{" "}
              para acceso anticipado.
            </p>
          </div>
        </div>

        {/* Keys list */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-[#C9A84C]" />
              <h2 className="text-sm font-semibold text-gray-900">Claves de API</h2>
            </div>
          </div>

          {apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Key className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-900">Sin claves de API</p>
              <p className="mt-1 text-xs text-gray-500">
                Las claves de API estarán disponibles próximamente.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {apiKeys.map((key) => (
                <li key={key.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{key.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <code className="text-xs text-gray-400 font-mono">
                        {key.keyPrefix}••••••••
                      </code>
                      <button
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copiar prefijo"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">
                      Creada{" "}
                      {new Date(key.createdAt).toLocaleDateString("es-MX", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {key.lastUsedAt && (
                      <p className="text-xs text-gray-400">
                        Último uso{" "}
                        {new Date(key.lastUsedAt).toLocaleDateString("es-MX", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
