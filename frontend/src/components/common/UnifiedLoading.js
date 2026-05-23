import React from 'react';
import '../../styles/main.css'; // mg-loading-* / mg-spinner-spin SSOT 보장

/**
 * UnifiedLoading — 모든 로딩 UI의 단일 SSOT 컴포넌트
 *
 * 디자인 시스템 정합:
 * - 회전(jitter-free): `mg-spinner-spin` linear infinite (`06-components/_loading.css`)
 * - 사이즈 토큰: `--mg-spinner-size-{xs,sm,md,lg,xl}`
 * - 색상 토큰: `--mg-spinner-track-color`, `--mg-spinner-accent-color`
 * - 접근성: `role="status"`, `aria-live="polite"`, `aria-label`
 * - 사용자 환경: `prefers-reduced-motion` 시 회전 정지·페이드
 *
 * Props 표준 (신규 API):
 * @param {('xs'|'sm'|'md'|'lg'|'xl'|'small'|'medium'|'large')} [props.size='md']
 *   - `small`/`medium`/`large` 는 레거시 호환 (각각 `sm`/`md`/`lg`)
 * @param {('primary'|'secondary'|'success'|'danger'|'neutral')} [props.tone='primary']
 *   - 색상 톤. 디자인 토큰을 통해 매핑.
 * @param {string} [props.label='로딩 중'] - 스크린리더용 접근성 라벨 (aria-label)
 * @param {boolean} [props.inline=false] - 인라인 모드 (텍스트 흐름에 그대로 배치)
 * @param {boolean} [props.overlay=false] - 전체 화면 오버레이 (fullscreen) 모드
 *
 * Props 레거시 호환 (변경 없음):
 * @param {string} [props.text='로딩 중...'] - 표시 텍스트
 * @param {('spinner'|'dots'|'pulse'|'bars'|'logo')} [props.variant='spinner']
 * @param {('inline'|'fullscreen'|'page'|'button')} [props.type='inline']
 *   - 명시적으로 전달되면 `inline`/`overlay` 보다 우선.
 * @param {boolean} [props.showText=true]
 * @param {string} [props.className='']
 * @param {boolean} [props.centered=true]
 * @param {('text'|'image'|'custom')} [props.logoType='text']
 * @param {string} [props.logoImage='']
 * @param {string} [props.logoAlt='Core Solution']
 * @param {boolean} [props.logoRotate=true]
 *
 * @author Core Solution
 * @since 2025-01-02
 * @version 1.2.0 (2026-05-23 — jitter-free + 표준 props + a11y)
 */

const LEGACY_SIZE_MAP = {
  small: 'sm',
  medium: 'md',
  large: 'lg'
};

const TONE_WHITELIST = new Set([
  'primary',
  'secondary',
  'success',
  'danger',
  'neutral'
]);

const SIZE_WHITELIST = new Set(['xs', 'sm', 'md', 'lg', 'xl']);

const normalizeSize = (size) => {
  if (!size) return 'md';
  if (LEGACY_SIZE_MAP[size]) return LEGACY_SIZE_MAP[size];
  if (SIZE_WHITELIST.has(size)) return size;
  return 'md';
};

const normalizeTone = (tone) => (TONE_WHITELIST.has(tone) ? tone : 'primary');

const resolveType = ({ type, overlay, inline }) => {
  if (type) return type;
  if (overlay) return 'fullscreen';
  if (inline) return 'inline';
  return 'inline';
};

const UnifiedLoading = ({
  text = '로딩 중...',
  size = 'md',
  variant = 'spinner',
  type,
  tone = 'primary',
  label,
  inline = false,
  overlay = false,
  showText = true,
  className = '',
  centered = true,
  logoType = 'text',
  logoImage = '',
  logoAlt = 'Core Solution',
  logoRotate = true,
  ...props
}) => {
  const normalizedSize = normalizeSize(size);
  const normalizedTone = normalizeTone(tone);
  const resolvedType = resolveType({ type, overlay, inline });
  const accessibleLabel = label || text || '로딩 중';

  const renderLogo = () => {
    const logoClasses = [
      'mg-loading-logo',
      `mg-loading-logo--${normalizedSize}`,
      logoRotate ? 'mg-loading-logo--rotating' : '',
      `mg-loading-logo--${logoType}`
    ].filter(Boolean).join(' ');

    switch (logoType) {
      case 'image':
        return (
          <img
            src={logoImage || '/logo.png'}
            alt={logoAlt}
            className={logoClasses}
          />
        );
      case 'custom':
        return (
          <div
            className={logoClasses}
            dangerouslySetInnerHTML={{ __html: logoImage }}
          />
        );
      case 'text':
      default:
        return (
          <div className={logoClasses}>
            <span className="mg-loading-logo-text">
              Core Solution
            </span>
          </div>
        );
    }
  };

  const renderSpinner = () => {
    const baseClasses = [
      'mg-loading',
      `mg-loading--${normalizedSize}`,
      `mg-loading--${variant}`,
      `mg-loading--tone-${normalizedTone}`
    ].join(' ');

    switch (variant) {
      case 'dots':
        return (
          <div className={`${baseClasses} mg-loading-dots`} aria-hidden="true">
            <div className="mg-loading-dot" />
            <div className="mg-loading-dot" />
            <div className="mg-loading-dot" />
          </div>
        );
      case 'pulse':
        return (
          <div className={`${baseClasses} mg-loading-pulse`} aria-hidden="true">
            <div className="mg-loading-pulse-circle" />
          </div>
        );
      case 'bars':
        return (
          <div className={`${baseClasses} mg-loading-bars`} aria-hidden="true">
            <div className="mg-loading-bar" />
            <div className="mg-loading-bar" />
            <div className="mg-loading-bar" />
            <div className="mg-loading-bar" />
          </div>
        );
      case 'logo':
        return renderLogo();
      case 'spinner':
      default:
        return (
          <div className={baseClasses} aria-hidden="true">
            <div className="mg-loading-spinner">
              <div className="mg-loading-spinner-icon" />
            </div>
          </div>
        );
    }
  };

  const containerClasses = [
    'mg-loading-container',
    `mg-loading-container--${resolvedType}`,
    `mg-loading-container--tone-${normalizedTone}`,
    centered ? 'mg-loading-container--centered' : '',
    className
  ].filter(Boolean).join(' ');

  // DOM에 전달하지 않을 props 필터링 (boolean attribute 경고 방지)
  const { fullscreen, ...domProps } = props;

  return (
    <div
      className={containerClasses}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={accessibleLabel}
      {...domProps}
    >
      <div className="mg-loading-content">
        {renderSpinner()}
        {showText && text && (
          <div className="mg-loading-text">
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedLoading;
