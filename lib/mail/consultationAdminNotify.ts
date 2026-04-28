import nodemailer from 'nodemailer';
import { getConsultationAdminNotifyRecipientEmails } from '@/lib/consultationNotifyRecipients';

export type ConsultationAdminMailPayload = {
  inquiryId: number;
  name: string;
  phone: string;
  email?: string | null;
  preferredContactMethod: string;
  inquiryType: string;
  referralSource?: string | null;
  message?: string | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
};

/**
 * 마인드가든 코어(`~/mindGarden`)와 동일 SMTP를 쓰도록 env를 맞춥니다.
 * - 로컬: `src/main/resources/application-local.yml` → `spring.mail.*`
 * - 운영: `src/main/resources/application-prod.yml` → `production.mail`의 `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`
 */
/** SMTP만 (수신자는 DB·env에서 별도 조회) */
function resolveSmtpCredentials() {
  const host =
    process.env.SMTP_HOST ||
    process.env.MAIL_HOST ||
    process.env.SPRING_MAIL_HOST ||
    '';
  const port = parseInt(
    process.env.SMTP_PORT ||
      process.env.MAIL_PORT ||
      process.env.SPRING_MAIL_PORT ||
      '587',
    10
  );
  const user =
    process.env.SMTP_USER ||
    process.env.SMTP_USERNAME ||
    process.env.MAIL_USERNAME ||
    process.env.SPRING_MAIL_USERNAME ||
    '';
  const pass =
    process.env.SMTP_PASSWORD ||
    process.env.MAIL_PASSWORD ||
    process.env.SPRING_MAIL_PASSWORD ||
    '';
  const from =
    process.env.MAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.SPRING_MAIL_USERNAME ||
    user;
  const secure =
    process.env.SMTP_SECURE === 'true' ||
    process.env.SMTP_SECURE === '1' ||
    port === 465;
  const requireTLS =
    process.env.SMTP_REQUIRE_TLS === 'false' ||
    process.env.SMTP_REQUIRE_TLS === '0'
      ? false
      : !secure && port !== 25;

  return { host, port, user, pass, from, secure, requireTLS };
}

function inquiryTypeLabel(code: string): string {
  const map: Record<string, string> = {
    general: '일반 상담',
    adhd: 'ADHD 개인 상담',
    coaching: '코칭(실행 전략)',
    family: '가족/부모 상담',
  };
  return map[code] ?? code;
}

function referralSourceLabel(code: string): string {
  const map: Record<string, string> = {
    homepage: '홈페이지',
    search_google: '검색엔진 (구글)',
    search_naver: '검색엔진 (네이버)',
    sns_instagram: 'SNS (인스타그램)',
    sns_facebook: 'SNS (페이스북)',
    sns_kakao: 'SNS (카카오톡)',
    blog: '블로그',
    mom_cafe: '맘카페',
    referral: '지인 소개',
    other: '기타',
  };
  return map[code] ?? code;
}

function contactMethodLabel(code: string): string {
  const map: Record<string, string> = {
    phone: '전화',
    email: '이메일',
    both: '전화·이메일',
  };
  return map[code] ?? code;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 메일 클라이언트에서 로고 로드용 절대 URL (원격 이미지 차단 시 alt만 표시) */
function consultationMailPublicOrigin(): string {
  const raw =
    process.env.MAIL_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://m-garden.co.kr';
  return raw.replace(/\/+$/, '');
}

function buildPlainTextBody(data: ConsultationAdminMailPayload): string {
  const lines = [
    `접수 번호: ${data.inquiryId}`,
    `이름: ${data.name}`,
    `전화: ${data.phone}`,
    data.email ? `이메일: ${data.email}` : null,
    `선호 연락: ${contactMethodLabel(data.preferredContactMethod)}`,
    `문의 유형: ${inquiryTypeLabel(data.inquiryType)}`,
    data.referralSource
      ? `유입 경로: ${referralSourceLabel(data.referralSource)}`
      : null,
    data.preferredDate ? `희망 날짜: ${data.preferredDate}` : null,
    data.preferredTime ? `희망 시간: ${data.preferredTime}` : null,
    data.message ? `메모:\n${data.message}` : null,
  ].filter(Boolean) as string[];
  return lines.join('\n');
}

function rowHtml(label: string, value: string | null | undefined): string {
  if (value == null || value === '') return '';
  const v = escapeHtml(value);
  return `<tr>
  <td style="padding:10px 14px;border-bottom:1px solid #e8ebe8;width:132px;vertical-align:top;font-size:13px;color:#5c6570;font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;">${escapeHtml(label)}</td>
  <td style="padding:10px 14px;border-bottom:1px solid #e8ebe8;font-size:14px;color:#1a1f1a;font-weight:600;font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;">${v}</td>
</tr>`;
}

function buildHtmlEmail(data: ConsultationAdminMailPayload): string {
  const origin = consultationMailPublicOrigin();
  const logoUrl =
    process.env.MAIL_LOGO_URL || `${origin}/assets/images/logo/logo.png`;
  const rows = [
    rowHtml('접수 번호', String(data.inquiryId)),
    rowHtml('이름', data.name),
    rowHtml('전화', data.phone),
    data.email ? rowHtml('이메일', data.email) : '',
    rowHtml('선호 연락', contactMethodLabel(data.preferredContactMethod)),
    rowHtml('문의 유형', inquiryTypeLabel(data.inquiryType)),
    data.referralSource
      ? rowHtml('유입 경로', referralSourceLabel(data.referralSource))
      : '',
    data.preferredDate ? rowHtml('희망 날짜', data.preferredDate) : '',
    data.preferredTime ? rowHtml('희망 시간', data.preferredTime) : '',
  ].join('');

  const memoBlock =
    data.message && data.message.trim()
      ? `<tr><td colspan="2" style="padding:16px 14px 8px;font-size:13px;color:#5c6570;font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;">메모</td></tr>
<tr><td colspan="2" style="padding:0 14px 16px;font-size:14px;color:#1a1f1a;line-height:1.55;font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;white-space:pre-wrap;">${escapeHtml(data.message.trim())}</td></tr>`
      : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#eef1ee;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef1ee;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(26,31,26,0.08);">
<tr>
  <td bgcolor="#5a8f3f" style="background:linear-gradient(135deg,#5a8f3f 0%,#4a7a34 100%);padding:22px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:middle;">
          <img src="${escapeHtml(logoUrl)}" width="140" height="" alt="마인드가든" style="display:block;max-width:140px;height:auto;border:0;" />
        </td>
        <td align="right" style="vertical-align:middle;font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;">
          <div style="font-size:11px;letter-spacing:0.06em;color:rgba(255,255,255,0.9);text-transform:uppercase;">MindGarden</div>
          <div style="font-size:17px;font-weight:700;color:#ffffff;margin-top:4px;">새 상담 문의</div>
        </td>
      </tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:8px 0 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rows}
      ${memoBlock}
    </table>
  </td>
</tr>
<tr>
  <td style="padding:18px 20px 22px;font-size:12px;line-height:1.5;color:#7a8478;font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;border-top:1px solid #e8ebe8;">
    홈페이지 상담 예약 폼에서 접수된 내용입니다. 빠른 연락 부탁드립니다.<br/>
    <span style="color:#9aa399;">이 메일은 발신 전용입니다.</span>
  </td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildBodies(data: ConsultationAdminMailPayload): { text: string; html: string } {
  return {
    text: buildPlainTextBody(data),
    html: buildHtmlEmail(data),
  };
}

/**
 * DB 저장 성공 후 호출. 설정이 없거나 발송 실패해도 API 응답은 성공으로 유지하고 로그만 남깁니다.
 */
export async function sendConsultationAdminNotify(
  data: ConsultationAdminMailPayload
): Promise<void> {
  const cred = resolveSmtpCredentials();
  const to = await getConsultationAdminNotifyRecipientEmails();
  const enabled = Boolean(cred.host && cred.user && cred.pass && to.length > 0);
  if (!enabled) {
    if (!cred.host) {
      console.warn(
        '[mail] SMTP 미설정(SMTP_HOST, SMTP_USERNAME/SMTP_USER, SMTP_PASSWORD). ~/mindGarden 의 application-local.yml / application-prod.yml 과 동일 값을 .env 에 넣으면 발송됩니다.'
      );
    } else if (!to.length) {
      console.warn(
        '[mail] 알림 수신자 없음: /admin/consultation 에서 수신 이메일을 등록하거나 CONSULTATION_ADMIN_NOTIFY_EMAILS(.env)를 설정하세요.'
      );
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    host: cred.host,
    port: cred.port,
    secure: cred.secure,
    auth: { user: cred.user, pass: cred.pass },
    ...(!cred.secure && cred.requireTLS ? { requireTLS: true as const } : {}),
  });

  const { text, html } = buildBodies(data);
  await transporter.sendMail({
    from: cred.from,
    to: to.join(', '),
    subject: `[마인드가든] 새 상담 문의 #${data.inquiryId}`,
    text,
    html,
  });
}
