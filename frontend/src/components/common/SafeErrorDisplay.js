import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { toErrorMessage } from '../../utils/safeDisplay';

/**
 * API·예외 오류를 안전한 문자열로 표시 (React 자식 객체 렌더 방지)
 * @param {object} props
 * @param {unknown} props.error
 * @param {'banner'|'inline'} [props.variant='banner']
 * @param {string} [props.role]
 * @param {string} [props.className]
 * @param {boolean} [props.icon]
 * @param {string} [props.fallback='오류가 발생했습니다.']
 * @param {number} [props.iconSize=20]
 * @param {string} [props.prefix]
 * @param {'p'|'span'|'div'} [props.as] — `variant="inline"`일 때만 래퍼 요소 (기본 `p`)
 */
export default function SafeErrorDisplay({
  error,
  variant = 'banner',
  role,
  className = '',
  icon,
  fallback = '오류가 발생했습니다.',
  iconSize = 20,
  prefix,
  as: inlineTag = 'p'
}) {
  if (error == null || error === '') return null;

  const resolvedRole = role ?? (variant === 'banner' ? 'alert' : 'status');
  const showIcon = icon === undefined ? variant === 'banner' : icon;
  const message = toErrorMessage(error, fallback);
  const text = prefix != null && prefix !== '' ? `${prefix}${message}` : message;
  const extra = className ? ` ${className}` : '';

  if (variant === 'banner') {
    return (
      <div
        className={`mg-safe-error-display mg-safe-error-display--banner alert alert-danger d-flex align-items-center gap-2${extra}`}
        role={resolvedRole}
      >
        {showIcon ? <AlertTriangle size={iconSize} aria-hidden /> : null}
        {text}
      </div>
    );
  }

  const inlineFlex = showIcon ? ' d-flex align-items-center gap-2' : '';
  const InlineTag = inlineTag || 'p';

  return (
    <InlineTag
      className={`mg-safe-error-display mg-safe-error-display--inline${inlineFlex}${extra}`}
      role={resolvedRole}
    >
      {showIcon ? <AlertTriangle size={iconSize} aria-hidden /> : null}
      {text}
    </InlineTag>
  );
}
