import { getDbConnection } from '@/lib/db';

/** `homepage_settings.setting_key` — 비어 있지 않으면 env보다 우선 */
export const CONSULTATION_ADMIN_NOTIFY_EMAILS_SETTING_KEY =
  'consultation_admin_notify_emails';

function parseEmailList(raw: string | null | undefined): string[] {
  if (raw == null || raw === '') return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function envRecipientEmails(): string[] {
  const toRaw =
    process.env.CONSULTATION_ADMIN_NOTIFY_EMAILS ||
    process.env.ADMIN_NOTIFY_EMAILS ||
    '';
  return parseEmailList(toRaw);
}

/** 상담 알림 수신 주소: DB에 한 건 이상이면 DB만, 아니면 env */
export async function getConsultationAdminNotifyRecipientEmails(): Promise<
  string[]
> {
  try {
    const conn = await getDbConnection();
    try {
      const [rows] = await conn.execute(
        `SELECT setting_value FROM homepage_settings WHERE setting_key = ? LIMIT 1`,
        [CONSULTATION_ADMIN_NOTIFY_EMAILS_SETTING_KEY]
      );
      const row = (rows as { setting_value?: string | null }[])[0];
      if (row && row.setting_value != null) {
        const dbList = parseEmailList(row.setting_value);
        if (dbList.length > 0) return dbList;
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.warn(
      '[consultation-notify] DB 수신 목록 조회 생략:',
      (e as Error)?.message
    );
  }
  return envRecipientEmails();
}
