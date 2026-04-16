/**
 * Admin 대시보드 V2 — 관리 기능 그리드 카드 (네비게이션 Link / 비동기 액션 button)
 *
 * @author CoreSolution
 * @since 2026-04-16
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const ADMIN_CARD_CLASS = 'mg-v2-ad-b0kla__admin-card';

/**
 * 관리 기능 카드 상단 아이콘 (B0KlA 톤 배지 + Lucide)
 * @param {{ icon: import('lucide-react').LucideIcon, tone?: string }} props
 */
export function AdminMgmtCardIcon({ icon: LucideIcon, tone = 'blue' }) {
  return (
    <span
      className={`mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--${tone}`}
      aria-hidden
    >
      <LucideIcon size={28} strokeWidth={2} />
    </span>
  );
}

/**
 * 라우트 이동 전용 카드 (시맨틱 링크)
 * @param {{
 *   to: string,
 *   icon: import('lucide-react').LucideIcon,
 *   tone?: string,
 *   label: string,
 *   description: string
 * }} props
 */
export function AdminMgmtNavCard({ to, icon, tone = 'blue', label, description }) {
  return (
    <Link
      to={to}
      className={ADMIN_CARD_CLASS}
    >
      <AdminMgmtCardIcon icon={icon} tone={tone} />
      <span className="mg-v2-ad-b0kla__admin-label">{label}</span>
      <span className="mg-v2-ad-b0kla__admin-desc">{description}</span>
    </Link>
  );
}

/**
 * 비동기 액션 전용 카드 (button)
 * @param {{
 *   onClick: () => void | Promise<void>,
 *   loading: boolean,
 *   icon: import('lucide-react').LucideIcon,
 *   tone?: string,
 *   label: string,
 *   description: string,
 *   disabled?: boolean
 * }} props
 */
export function AdminMgmtActionCard({
  onClick,
  loading,
  icon,
  tone = 'blue',
  label,
  description,
  disabled = false
}) {
  const isDisabled = Boolean(disabled || loading);
  return (
    <button
      type="button"
      className={ADMIN_CARD_CLASS}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
    >
      {loading ? (
        <span
          className="mg-v2-ad-b0kla__admin-action-icon-slot"
          aria-hidden
        >
          <Loader2
            className="mg-v2-ad-b0kla__admin-action-spinner"
            size={28}
            strokeWidth={2}
          />
        </span>
      ) : (
        <AdminMgmtCardIcon icon={icon} tone={tone} />
      )}
      <span className="mg-v2-ad-b0kla__admin-label">{label}</span>
      <span className="mg-v2-ad-b0kla__admin-desc">
        {loading ? '처리 중…' : description}
      </span>
    </button>
  );
}
