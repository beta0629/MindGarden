/**
 * §2. Provider 선택 라디오 카드 그룹 — 디자이너 §2 / §3.
 *
 * - 4종 provider 라디오 (`role="radiogroup"`).
 * - 미등록 카드 disabled + tooltip.
 * - 선택 변경 시 부모로 PUT 위임.
 *
 * @author MindGarden
 * @since 2026-05-24
 */
import React, { useId } from 'react';
import ProviderCard from '../molecules/ProviderCard';
import {
  AI_PROVIDER_DISABLED_TOOLTIP,
  AI_PROVIDER_LABELS,
  AI_PROVIDER_OPTIONS,
  AI_PROVIDER_UNGUARDED_TOOLTIP
} from '../constants';

const isProviderRegistered = (providerId, health, providers) => {
  if (health) {
    if (providerId === 'openai') return health.openaiKeyRegistered === true;
    if (providerId === 'gemini') return health.geminiKeyRegistered === true;
  }
  const formKey = providers?.[providerId]?.apiKey || '';
  return formKey.trim() !== '';
};

const ProviderSelector = ({
  activeProvider,
  health,
  healthLoading,
  providers,
  saving,
  onSelect
}) => {
  const tooltipPrefix = useId();

  return (
    <section className="mg-ai-section mg-ai-provider-selector">
      <header className="mg-ai-section__header">
        <h2 className="mg-ai-section__title">
          <span className="mg-ai-section__accent" aria-hidden="true" />
          사용할 AI 프로바이더 선택
        </h2>
      </header>
      <p className="mg-ai-section__desc">
        API 키가 등록된 프로바이더만 선택할 수 있습니다. 심리검사 AI 리포트·웰니스 등에 선택한 프로바이더가 사용됩니다.
      </p>

      <div
        role="radiogroup"
        aria-label="사용할 AI 프로바이더"
        className="mg-ai-provider-selector__grid"
      >
        {AI_PROVIDER_OPTIONS.map((provider) => {
          const registered = isProviderRegistered(provider.id, health, providers);
          const guarded = provider.id === 'openai' || provider.id === 'gemini';
          let tooltip = '';
          if (!registered) {
            tooltip = AI_PROVIDER_DISABLED_TOOLTIP;
          } else if (!guarded) {
            tooltip = AI_PROVIDER_UNGUARDED_TOOLTIP;
          }
          const disabled = (healthLoading && guarded) || saving || !registered;
          return (
            <ProviderCard
              key={provider.id}
              provider={provider}
              checked={activeProvider === provider.id}
              disabled={disabled}
              tooltip={tooltip}
              registered={registered}
              onChange={onSelect}
              tooltipId={`${tooltipPrefix}-${provider.id}-tooltip`}
            />
          );
        })}
      </div>

      {!healthLoading
        && health
        && !health.openaiKeyRegistered
        && !health.geminiKeyRegistered
        && AI_PROVIDER_OPTIONS.every((p) => !(providers?.[p.id]?.apiKey || '').trim()) && (
        <p className="mg-ai-section__empty">
          {AI_PROVIDER_LABELS.unregistered}
          {' — '}
          우측의 "API 키 관리" 카드에서 1개 이상 등록한 뒤 선택할 수 있습니다.
        </p>
      )}
    </section>
  );
};

export default ProviderSelector;
