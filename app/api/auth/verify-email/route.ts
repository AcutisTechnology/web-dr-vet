import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory code store — persists across requests in the same Node.js process.
// In production with múltiplas instâncias, substituir por Redis ou banco de dados.
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, code } = body as {
      action: "send" | "verify";
      email?: string;
      code?: string;
    };

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // ── SEND ──────────────────────────────────────────────────────────────────
    if (action === "send") {
      const verificationCode = generateCode();
      verificationCodes.set(normalizedEmail, {
        code: verificationCode,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutos
      });

      // "onboarding@resend.dev" funciona sem verificar domínio próprio.
      // Troque pelo seu domínio verificado quando estiver em produção.
      const fromAddress = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
      const fromName = process.env.RESEND_FROM_NAME ?? "DrVet";

      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromAddress}>`,
        to: email,
        subject: "Confirme seu e-mail – DrVet",
        html: buildEmailHtml(verificationCode),
      });

      if (error) {
        console.error("[verify-email] Resend error:", error);

        // Resend em conta free só envia para o e-mail do dono da conta.
        // Em desenvolvimento, imprime o código no terminal para facilitar testes.
        const isDev = process.env.NODE_ENV === "development";
        if (isDev) {
          console.log("─────────────────────────────────────────");
          console.log(`[verify-email] DEV MODE — código para ${email}: ${verificationCode}`);
          console.log("─────────────────────────────────────────");
          // Retorna sucesso mesmo assim — o código está no terminal do servidor
          return NextResponse.json({
            success: true,
            message: "Código gerado (dev: verifique o terminal do servidor Next.js).",
            // Em dev, expõe o código na resposta para facilitar testes locais
            devCode: verificationCode,
          });
        }

        return NextResponse.json(
          { error: "Erro ao enviar e-mail. Verifique o endereço e tente novamente." },
          { status: 500 }
        );
      }

      console.log("[verify-email] Sent to:", email, "| Resend id:", data?.id);
      return NextResponse.json({ success: true, message: "Código enviado com sucesso." });
    }

    // ── VERIFY ────────────────────────────────────────────────────────────────
    if (action === "verify") {
      if (!code || code.trim().length !== 6) {
        return NextResponse.json({ error: "Código deve ter 6 dígitos." }, { status: 400 });
      }

      const stored = verificationCodes.get(normalizedEmail);

      if (!stored) {
        return NextResponse.json(
          { error: "Nenhum código encontrado para este e-mail. Solicite um novo." },
          { status: 400 }
        );
      }

      if (Date.now() > stored.expiresAt) {
        verificationCodes.delete(normalizedEmail);
        return NextResponse.json({ error: "Código expirado. Solicite um novo." }, { status: 400 });
      }

      if (stored.code !== code.trim()) {
        return NextResponse.json(
          { error: "Código incorreto. Verifique e tente novamente." },
          { status: 400 }
        );
      }

      verificationCodes.delete(normalizedEmail);
      return NextResponse.json({ success: true, message: "E-mail verificado com sucesso." });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    console.error("[verify-email] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor. Tente novamente." },
      { status: 500 }
    );
  }
}

function buildEmailHtml(code: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f7ff">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7ff;padding:40px 20px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#1B2A6B,#2DC6C6);padding:32px 40px;text-align:center">
            <p style="margin:0;font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px">DrVet</p>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8)">Sistema de Gestão Veterinária</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a2e">Confirme seu e-mail</p>
            <p style="margin:0 0 28px;font-size:14px;color:#666;line-height:1.6">
              Use o código abaixo para verificar seu endereço de e-mail e concluir o cadastro.
            </p>
            <div style="background:#f0f4ff;border:2px dashed #1B2A6B;border-radius:12px;padding:24px;text-align:center;margin:0 0 28px">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.1em">Código de verificação</p>
              <p style="margin:0;font-size:40px;font-weight:800;color:#1B2A6B;letter-spacing:8px">${code}</p>
            </div>
            <p style="margin:0 0 8px;font-size:12px;color:#999">Este código expira em <strong>10 minutos</strong>.</p>
            <p style="margin:0;font-size:12px;color:#999">Se você não solicitou este código, ignore este e-mail.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 40px;border-top:1px solid #eee;text-align:center">
            <p style="margin:0;font-size:11px;color:#bbb">© ${new Date().getFullYear()} DrVet – Sistema de Gestão Veterinária</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
