import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import {
  CONSULTATION_ADMIN_NOTIFY_EMAILS_SETTING_KEY,
  getConsultationAdminNotifyRecipientEmails,
} from '@/lib/consultationNotifyRecipients';

function checkAuth(request: NextRequest) {
  const authCookie = request.cookies.get('blog_admin_token');
  return !!(authCookie && authCookie.value);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseAndValidateEmails(raw: string): { ok: true; list: string[] } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, list: [] };
  const parts = trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const p of parts) {
    if (!EMAIL_RE.test(p)) {
      return { ok: false, error: `올바르지 않은 이메일: ${p}` };
    }
  }
  return { ok: true, list: parts };
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const envRaw =
    process.env.CONSULTATION_ADMIN_NOTIFY_EMAILS ||
    process.env.ADMIN_NOTIFY_EMAILS ||
    '';

  let connection;
  try {
    connection = await getDbConnection();
    const [rows] = await connection.execute(
      `SELECT setting_value FROM homepage_settings WHERE setting_key = ? LIMIT 1`,
      [CONSULTATION_ADMIN_NOTIFY_EMAILS_SETTING_KEY]
    );
    const row = (rows as { setting_value?: string }[])[0];
    const hasDatabaseRow = !!row;
    const databaseValue = hasDatabaseRow ? (row.setting_value ?? '') : null;

    const formValue =
      hasDatabaseRow && databaseValue != null
        ? databaseValue
        : envRaw.trim();

    const effectiveEmails = await getConsultationAdminNotifyRecipientEmails();
    const sendsUsing =
      hasDatabaseRow &&
      databaseValue != null &&
      databaseValue
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean).length > 0
        ? 'database'
        : 'environment';

    return NextResponse.json({
      success: true,
      formValue,
      hasDatabaseRow,
      environmentFallback: envRaw.trim(),
      effectiveEmails,
      sendsUsing,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '알 수 없는 오류';
    console.error('consultation-notify-emails GET:', e);
    return NextResponse.json(
      {
        success: false,
        error: `설정을 불러오지 못했습니다. DB에 homepage_settings 테이블이 있는지 확인하세요: ${msg}`,
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  let body: { emails?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'JSON 본문이 필요합니다.' },
      { status: 400 }
    );
  }

  const parsed = parseAndValidateEmails(String(body.emails ?? ''));
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  }

  let connection;
  try {
    connection = await getDbConnection();

    if (parsed.list.length === 0) {
      await connection.execute(
        `DELETE FROM homepage_settings WHERE setting_key = ?`,
        [CONSULTATION_ADMIN_NOTIFY_EMAILS_SETTING_KEY]
      );
      return NextResponse.json({
        success: true,
        message: '저장했습니다. 수신 목록이 비어 있어 환경 변수(CONSULTATION_ADMIN_NOTIFY_EMAILS)를 사용합니다.',
        cleared: true,
      });
    }

    const value = parsed.list.join(', ');
    await connection.execute(
      `INSERT INTO homepage_settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
      [CONSULTATION_ADMIN_NOTIFY_EMAILS_SETTING_KEY, value]
    );

    return NextResponse.json({
      success: true,
      message: '알림 수신 이메일을 저장했습니다.',
      emails: parsed.list,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '알 수 없는 오류';
    console.error('consultation-notify-emails PUT:', e);
    return NextResponse.json(
      {
        success: false,
        error: `저장에 실패했습니다. homepage_settings 테이블이 있는지 확인하세요: ${msg}`,
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
