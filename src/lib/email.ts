/**
 * 트랜잭션 메일 발송. Supabase 내장 인증메일과 별개로, 가입 완료 안내처럼
 * 앱이 직접 보내는 메일을 Resend REST API로 처리한다. 서버 액션에서만 부른다.
 *
 * 필요 환경변수:
 * - RESEND_API_KEY : Resend API 키
 * - EMAIL_FROM     : 보내는 사람 (예: "맞춤 스킨케어 <no-reply@yourdomain.com>")
 *                    Resend에 인증된 도메인이어야 실제 발송된다.
 *
 * 설정이 없으면 조용히 skip한다 — 메일 실패가 가입 자체를 막아선 안 되므로
 * 호출부에서도 결과를 치명적으로 다루지 않는다.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

type SendResult = { ok: true } | { ok: false; error: string };

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return { ok: false, error: "email not configured (RESEND_API_KEY/EMAIL_FROM)" };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, ...params }),
    });
    if (!res.ok) {
      return { ok: false, error: `resend ${res.status}: ${await res.text()}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function sendSignupWelcomeEmail(to: string): Promise<SendResult> {
  return sendEmail({
    to,
    subject: "맞춤 스킨케어 가입이 완료됐어요",
    text: [
      "맞춤 스킨케어 가입이 완료됐어요.",
      "",
      "이제 피부 상태·목표·알레르기 이력을 입력하면 제외 성분을 걸러내고",
      "목표에 맞는 제품을 카테고리별로 추천해드려요.",
      "",
      "본 서비스는 자가 평가 참고용이며 의학적 진단이 아닙니다.",
    ].join("\n"),
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;color:#171717;line-height:1.6">
        <h1 style="font-size:18px;margin:0 0 12px">맞춤 스킨케어 가입이 완료됐어요</h1>
        <p style="font-size:14px;color:#525252;margin:0 0 12px">
          이제 피부 상태·목표·알레르기 이력을 입력하면 제외 성분을 걸러내고
          목표에 맞는 제품을 카테고리별로 추천해드려요.
        </p>
        <p style="font-size:12px;color:#a3a3a3;margin:16px 0 0">
          본 서비스는 자가 평가 참고용이며 의학적 진단이 아닙니다.
        </p>
      </div>
    `.trim(),
  });
}
