'use client';

import { useCallback, useEffect, useState } from 'react';

type NotifyMeta = {
  sendsUsing: string;
  effectiveEmails: string[];
  environmentFallback: string;
};

export default function ConsultationNotifyEmailsCard() {
  const [draft, setDraft] = useState('');
  const [meta, setMeta] = useState<NotifyMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  const load = useCallback(async () => {
    setLoading(true);
    setBanner(null);
    try {
      const res = await fetch('/api/admin/consultation-notify-emails');
      const data = await res.json();
      if (!data.success) {
        setBanner({ type: 'err', text: data.error || '불러오기에 실패했습니다.' });
        setMeta(null);
        return;
      }
      setDraft(typeof data.formValue === 'string' ? data.formValue : '');
      setMeta({
        sendsUsing: data.sendsUsing || 'environment',
        effectiveEmails: Array.isArray(data.effectiveEmails)
          ? data.effectiveEmails
          : [],
        environmentFallback: data.environmentFallback || '',
      });
    } catch {
      setBanner({ type: 'err', text: '네트워크 오류로 설정을 불러오지 못했습니다.' });
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setBanner(null);
    try {
      const res = await fetch('/api/admin/consultation-notify-emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: draft }),
      });
      const data = await res.json();
      if (!data.success) {
        setBanner({ type: 'err', text: data.error || '저장에 실패했습니다.' });
        return;
      }
      setBanner({ type: 'ok', text: data.message || '저장했습니다.' });
      await load();
    } catch {
      setBanner({ type: 'err', text: '저장 중 오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb',
          color: '#6b7280',
          fontSize: '0.875rem',
        }}
      >
        알림 수신 설정을 불러오는 중…
      </div>
    );
  }

  return (
    <div
      style={{
        marginBottom: '1.5rem',
        padding: '1.25rem',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <h2
        style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#1f2937',
          margin: '0 0 0.5rem 0',
        }}
      >
        상담 접수 알림 수신 이메일
      </h2>
      <p style={{ margin: '0 0 1rem 0', fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.5 }}>
        새 상담이 접수되면 아래 주소로 알림 메일이 발송됩니다. 쉼표로 여러 개를 넣을 수 있습니다.
        여기에 한 개 이상 저장되어 있으면 <strong>이 목록만</strong> 사용하고, 비우고 저장하면 서버{' '}
        <code style={{ fontSize: '0.75rem' }}>.env</code>의{' '}
        <code style={{ fontSize: '0.75rem' }}>CONSULTATION_ADMIN_NOTIFY_EMAILS</code>를
        다시 사용합니다. (SMTP 계정은 계속 <code style={{ fontSize: '0.75rem' }}>.env</code>입니다.)
      </p>
      {meta && (
        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8125rem', color: '#374151' }}>
          현재 발송 대상:{' '}
          <strong>{meta.sendsUsing === 'database' ? 'DB에 저장된 주소' : '환경 변수'}</strong>
          {meta.effectiveEmails.length > 0
            ? ` — ${meta.effectiveEmails.join(', ')}`
            : ' — (없음, 메일 미발송)'}
        </p>
      )}
      <label htmlFor="consultation-notify-emails" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.35rem' }}>
        수신 이메일 (쉼표 구분)
      </label>
      <textarea
        id="consultation-notify-emails"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        placeholder="예: staff@example.com, admin@example.com"
        style={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          padding: '0.5rem 0.75rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          fontFamily: 'inherit',
          marginBottom: '0.75rem',
        }}
      />
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: saving ? '#9ca3af' : '#598e3e',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? '저장 중…' : '저장'}
        </button>
        <button
          type="button"
          onClick={() => void load()}
          disabled={saving}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          새로고침
        </button>
      </div>
      {banner && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.65rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.8125rem',
            backgroundColor: banner.type === 'ok' ? '#ecfdf5' : '#fef2f2',
            color: banner.type === 'ok' ? '#065f46' : '#991b1b',
          }}
        >
          {banner.text}
        </div>
      )}
    </div>
  );
}
