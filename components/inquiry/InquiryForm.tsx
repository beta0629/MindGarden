'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { useState, type FormEvent } from 'react';
import {
  INQUIRY_TYPES,
  type InquiryType,
} from '@/lib/clinic-os/types';

type InquiryFormProps = {
  collapsedOnMobile?: boolean;
};

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export function InquiryForm({ collapsedOnMobile = false }: InquiryFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [inquiryType, setInquiryType] = useState<InquiryType>('개인상담');
  const [content, setContent] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [status, setStatus] = useState<FormState>('idle');
  const [message, setMessage] = useState('');

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');

    if (!privacyConsent) {
      setStatus('error');
      setMessage('개인정보 수집·이용 동의는 필수입니다.');
      return;
    }

    if (siteKey && !turnstileToken) {
      setStatus('error');
      setMessage('보안 확인을 완료해 주세요.');
      return;
    }

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          inquiryType,
          content,
          privacyConsent,
          turnstileToken: turnstileToken || 'dev-bypass',
          website,
        }),
      });

      if (res.status === 202) {
        setStatus('success');
        setMessage('문의가 접수되었습니다. 운영 시간 안에 연락드립니다.');
        setName('');
        setPhone('');
        setInquiryType('개인상담');
        setContent('');
        setPrivacyConsent(false);
        setWebsite('');
        setTurnstileToken('');
        return;
      }

      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      setStatus('error');
      setMessage(data?.error || '문의 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } catch {
      setStatus('error');
      setMessage('문의 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  const form = (
    <form className="form" onSubmit={onSubmit} noValidate>
      <label>
        이름 (성함)
        <input
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        연락처 (핸드폰)
        <input
          name="phone"
          autoComplete="tel"
          inputMode="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
      <label>
        문의 유형
        <select
          name="inquiryType"
          value={inquiryType}
          onChange={(e) => setInquiryType(e.target.value as InquiryType)}
          required
        >
          {INQUIRY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label>
        문의 내용
        <textarea
          name="content"
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </label>

      <label className="form__honeypot" aria-hidden="true">
        웹사이트
        <input
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </label>

      <label className="form__check">
        <input
          type="checkbox"
          checked={privacyConsent}
          onChange={(e) => setPrivacyConsent(e.target.checked)}
        />
        <span>[필수] 개인정보 수집·이용에 동의합니다.</span>
      </label>

      <p className="muted" style={{ margin: 0, fontSize: '0.875rem' }}>
        문의 내용에 진단명, 복용 약물, 병력 등 건강 정보는 적지 말아 주세요.
      </p>

      {siteKey ? (
        <Turnstile
          siteKey={siteKey}
          onSuccess={setTurnstileToken}
          onExpire={() => setTurnstileToken('')}
          options={{ theme: 'light' }}
        />
      ) : null}

      <button
        className="btn btn--block"
        type="submit"
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? '보내는 중…' : '문의 보내기'}
      </button>

      {message ? (
        <p
          className={`form__status ${
            status === 'success' ? 'form__status--ok' : 'form__status--err'
          }`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </form>
  );

  if (!collapsedOnMobile) {
    return form;
  }

  return (
    <>
      <div className="inquiry-desktop-only">{form}</div>
      <details className="inquiry-collapse inquiry-mobile-only">
        <summary>
          문의 폼 열기
          <span aria-hidden="true">∨</span>
        </summary>
        <div style={{ marginTop: '1rem' }}>{form}</div>
      </details>
    </>
  );
}
