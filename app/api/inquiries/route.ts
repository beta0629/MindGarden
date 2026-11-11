import { NextRequest, NextResponse } from 'next/server';
import { clinicOsClient } from '@/lib/clinic-os/client';
import {
  INQUIRY_TYPES,
  type InquiryType,
} from '@/lib/clinic-os/types';

function isInquiryType(value: unknown): value is InquiryType {
  return (
    typeof value === 'string' &&
    (INQUIRY_TYPES as readonly string[]).includes(value)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = String(body.name ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const content = String(body.content ?? '').trim();
    const inquiryType = body.inquiryType;
    const privacyConsent = Boolean(body.privacyConsent);
    const turnstileToken = String(body.turnstileToken ?? '');
    const website = String(body.website ?? '');

    // Honeypot: pretend success
    if (website) {
      return NextResponse.json({ ok: true }, { status: 202 });
    }

    if (!name || !phone || !content) {
      return NextResponse.json(
        { error: '이름, 연락처, 문의 내용은 필수입니다.' },
        { status: 400 },
      );
    }

    if (!isInquiryType(inquiryType)) {
      return NextResponse.json(
        { error: '문의 유형이 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    if (!privacyConsent) {
      return NextResponse.json(
        { error: '개인정보 수집·이용 동의는 필수입니다.' },
        { status: 400 },
      );
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (secret) {
      const form = new URLSearchParams();
      form.set('secret', secret);
      form.set('response', turnstileToken);
      const verifyRes = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        { method: 'POST', body: form },
      );
      const verify = (await verifyRes.json()) as { success?: boolean };
      if (!verify.success) {
        return NextResponse.json(
          { error: '보안 확인에 실패했습니다.' },
          { status: 400 },
        );
      }
    }

    const result = await clinicOsClient.submitInquiry({
      name,
      phone,
      inquiryType,
      content,
      privacyConsent,
      turnstileToken,
      website: '',
    });

    if (result.status !== 202) {
      return NextResponse.json(
        { error: '문의 전송에 실패했습니다.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch {
    return NextResponse.json(
      { error: '문의 처리 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
