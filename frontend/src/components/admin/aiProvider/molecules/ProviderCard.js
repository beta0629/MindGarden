/**
 * Provider 라디오 카드 (단일) — 디자이너 §2.
 *
 * - 4종 provider 중 1개를 라디오 입력으로 선택.
 * - 키 미등록 시 disabled + tooltip 노출 (a11y `aria-describedby`).
 * - 시각 스펙·색상은 모두 `AiProviderManagementPage.css` 에서 디자인 토큰 사용.
 *
 * @author MindGarden
 * @since 2026-05-24
 */
import React from 'react';
import {
  Bot,
  Sparkles,
  BrainCircuit,
  Cpu,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { toDisplayString } from '../../../../utils/safeDisplay';

const ICON_BY_KEY = {
  Bot,
  Sparkles,
  BrainCircuit,
  Cpu
};

const ProviderCard = ({
  provider,
  checked,
  disabled,
  tooltip,
  registered,
  onChange,
  tooltipId
}) => {
  const IconComponent = ICON_BY_KEY[provider.iconKey] || Bot;
  const statusLabel = registered ? '등록됨' : 'API 키 미등록';
  const ariaProps = tooltip ? { 'aria-describedby': tooltipId } : {};

  return (
    <label
      className={[
        'mg-ai-provider-card',
        checked ? 'mg-ai-provider-card--checked' : '',
        disabled ? 'mg-ai-provider-card--disabled' : ''
      ].filter(Boolean).join(' ')}
      title={tooltip || undefined}
      {...ariaProps}
    >
      <input
        type="radio"
        name="aiActiveProvider"
        value={provider.id}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(provider.id)}
        className="mg-ai-provider-card__radio"
        aria-label={`${provider.label} 사용`}
      />
      <span className="mg-ai-provider-card__icon" aria-hidden="true">
        <IconComponent size={28} strokeWidth={1.7} />
      </span>
      <span className="mg-ai-provider-card__body">
        <span className="mg-ai-provider-card__title">{toDisplayString(provider.label)}</span>
        <span className="mg-ai-provider-card__description">
          {toDisplayString(provider.description)}
        </span>
        <span
          className={[
            'mg-ai-provider-card__status',
            registered ? 'mg-ai-provider-card__status--ok' : 'mg-ai-provider-card__status--warn'
          ].join(' ')}
        >
          {registered ? (
            <CheckCircle2 size={14} strokeWidth={2} />
          ) : (
            <AlertTriangle size={14} strokeWidth={2} />
          )}
          {toDisplayString(statusLabel)}
        </span>
      </span>
      {tooltip ? (
        <span id={tooltipId} className="mg-sr-only">{toDisplayString(tooltip)}</span>
      ) : null}
    </label>
  );
};

export default ProviderCard;
