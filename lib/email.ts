import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "re_placeholder");
}

const FROM = process.env.EMAIL_FROM || "hola@jurisai.com.mx";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendWelcomeEmail({
  to,
  name,
  orgName,
}: {
  to: string;
  name: string;
  orgName: string;
}) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Bienvenido a JurisAI, ${name.split(" ")[0]}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Bienvenido a JurisAI</title></head>
<body style="font-family:sans-serif;background:#f4f6f9;margin:0;padding:40px 0;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="background:#0C1B2A;padding:32px 40px;text-align:center;">
      <span style="font-size:28px;font-weight:300;color:#fff;letter-spacing:-0.5px;">Juris<span style="color:#C9A84C;font-weight:700;">AI</span></span>
    </div>
    <div style="padding:40px;">
      <h1 style="color:#0C1B2A;font-size:24px;margin:0 0 16px;">Bienvenido, ${name.split(" ")[0]} 👋</h1>
      <p style="color:#475569;line-height:1.6;margin:0 0 16px;">
        Tu cuenta y organización <strong>${orgName}</strong> han sido creadas con éxito. Tienes 14 días de prueba gratuita para explorar todo lo que JurisAI tiene para ti.
      </p>
      <p style="color:#475569;line-height:1.6;margin:0 0 32px;">
        Con JurisAI puedes investigar derecho mexicano con IA, redactar documentos legales en segundos y monitorear el cumplimiento regulatorio — todo en un solo lugar.
      </p>
      <div style="text-align:center;">
        <a href="${APP_URL}/app" style="display:inline-block;background:#C9A84C;color:#0C1B2A;font-weight:700;font-size:16px;padding:14px 32px;border-radius:8px;text-decoration:none;">Comenzar ahora →</a>
      </div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:40px 0 24px;">
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
        JurisAI · Inteligencia Legal para México<br>
        <a href="${APP_URL}" style="color:#C9A84C;text-decoration:none;">jurisai.com.mx</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}

export async function sendTeamInviteEmail({
  to,
  inviterName,
  orgName,
  role,
  token,
}: {
  to: string;
  inviterName: string;
  orgName: string;
  role: string;
  token: string;
}) {
  const roleLabels: Record<string, string> = {
    ADMIN: "Administrador",
    LAWYER: "Abogado",
    PARALEGAL: "Paralegal",
    VIEWER: "Observador",
  };
  const roleLabel = roleLabels[role] || role;
  const inviteUrl = `${APP_URL}/invitacion/${token}`;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${inviterName} te invita a unirte a ${orgName} en JurisAI`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Invitación a JurisAI</title></head>
<body style="font-family:sans-serif;background:#f4f6f9;margin:0;padding:40px 0;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="background:#0C1B2A;padding:32px 40px;text-align:center;">
      <span style="font-size:28px;font-weight:300;color:#fff;letter-spacing:-0.5px;">Juris<span style="color:#C9A84C;font-weight:700;">AI</span></span>
    </div>
    <div style="padding:40px;">
      <h1 style="color:#0C1B2A;font-size:24px;margin:0 0 16px;">Tienes una invitación</h1>
      <p style="color:#475569;line-height:1.6;margin:0 0 16px;">
        <strong>${inviterName}</strong> te ha invitado a unirte a <strong>${orgName}</strong> en JurisAI como <strong>${roleLabel}</strong>.
      </p>
      <p style="color:#475569;line-height:1.6;margin:0 0 32px;">
        JurisAI es la plataforma de inteligencia legal para el derecho mexicano. Acepta la invitación para comenzar.
      </p>
      <div style="text-align:center;">
        <a href="${inviteUrl}" style="display:inline-block;background:#C9A84C;color:#0C1B2A;font-weight:700;font-size:16px;padding:14px 32px;border-radius:8px;text-decoration:none;">Aceptar invitación →</a>
      </div>
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:32px 0 0;">
        Esta invitación expira en 7 días. Si no solicitaste esto, puedes ignorar este correo.
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}

export async function sendWeeklyDigestEmail({
  to,
  name,
  orgName,
  stats,
}: {
  to: string;
  name: string;
  orgName: string;
  stats: {
    queriesUsed: number;
    queriesLimit: number;
    documentsCreated: number;
    activeMatters: number;
  };
}) {
  const usagePct = Math.round((stats.queriesUsed / stats.queriesLimit) * 100);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Resumen semanal de JurisAI — ${orgName}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Resumen semanal JurisAI</title></head>
<body style="font-family:sans-serif;background:#f4f6f9;margin:0;padding:40px 0;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="background:#0C1B2A;padding:32px 40px;text-align:center;">
      <span style="font-size:28px;font-weight:300;color:#fff;letter-spacing:-0.5px;">Juris<span style="color:#C9A84C;font-weight:700;">AI</span></span>
    </div>
    <div style="padding:40px;">
      <h1 style="color:#0C1B2A;font-size:24px;margin:0 0 8px;">Resumen de la semana</h1>
      <p style="color:#64748b;font-size:14px;margin:0 0 32px;">${orgName}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:32px;">
        <div style="background:#f8fafc;border-radius:8px;padding:20px;text-align:center;">
          <div style="font-size:32px;font-weight:700;color:#0C1B2A;">${stats.queriesUsed}</div>
          <div style="font-size:13px;color:#64748b;margin-top:4px;">Consultas realizadas</div>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:20px;text-align:center;">
          <div style="font-size:32px;font-weight:700;color:#0C1B2A;">${stats.documentsCreated}</div>
          <div style="font-size:13px;color:#64748b;margin-top:4px;">Documentos creados</div>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:20px;text-align:center;">
          <div style="font-size:32px;font-weight:700;color:#0C1B2A;">${stats.activeMatters}</div>
          <div style="font-size:13px;color:#64748b;margin-top:4px;">Asuntos activos</div>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:20px;text-align:center;">
          <div style="font-size:32px;font-weight:700;color:${usagePct > 80 ? "#ef4444" : "#C9A84C"};">${usagePct}%</div>
          <div style="font-size:13px;color:#64748b;margin-top:4px;">Uso del plan</div>
        </div>
      </div>
      <div style="text-align:center;">
        <a href="${APP_URL}/app/analitica" style="display:inline-block;background:#0C1B2A;color:#fff;font-weight:600;font-size:15px;padding:12px 28px;border-radius:8px;text-decoration:none;">Ver analítica completa →</a>
      </div>
    </div>
  </div>
</body>
</html>`,
  });
}
