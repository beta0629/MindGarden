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

function buildBodies(data: ConsultationAdminMailPayload): { text: string; html: string } {
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

  const text = lines.join('\n');
  const htmlBody = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const html = `<pre style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5">${htmlBody}</pre>`;
  return { text, html };
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
