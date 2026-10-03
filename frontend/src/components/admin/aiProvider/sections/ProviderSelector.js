/**
 * §2. Provider 선택 라디오 카드 그룹 — 디자이너 §2 / §3.
 *
 * - 4종 provider 라디오 (`role="radiogroup"`).
 * - 미등록 카드 disabled + tooltip.
 * - P1 보안(2026-10-03): 기본 프로바이더 변경은 운영자 전용(서버 403) — 모든 카드 읽기 전용.
 *
 * @author MindGarden
 * @since 2026-05-24
 */
import React, { useId } from 'react';
import ProviderCard from '../molecules/ProviderCard';
import { SettingsSectionPanel } from '../../settings-shell';
import {
  AI_PROVIDER_DISABLED_TOOLTIP,
  AI_PROVIDER_LABELS,
  AI_PROVIDER_OPTIONS,
  AI_PROVIDER_UNGUARDED_TOOLTIP
} from '../constants';
import { OPS_MANAGED_AI_PROVIDER_NOTICE } from '../../../../constants/opsManagedSettings';

const noop = () => {};

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
  providers
}) => {
  const tooltipPrefix = useId();

  return (
    <SettingsSectionPanel
      title="사용할 AI 프로바이더 선택"
      description={OPS_MANAGED_AI_PROVIDER_NOTICE}
      className="mg-ai-section mg-ai-provider-selector"
      body="plain"
    >

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
          return (
            <ProviderCard
              key={provider.id}
              provider={provider}
              checked={activeProvider === provider.id}
              disabled
              tooltip={tooltip}
              registered={registered}
              onChange={noop}
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
        </p>
      )}
    </SettingsSectionPanel>
  );
};

export default ProviderSelector;
