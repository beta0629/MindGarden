/**
 * §1. 현재 활성 Provider 카드 — 디자이너 §3 와이어.
 *
 * - 활성 provider 로고/아이콘, 헬스 상태 배지, 헬스 새로고침 버튼.
 * - 헬스 API: `getAiProviderHealth()` (aiHealthApi).
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
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName } from '../../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../../utils/safeDisplay';
import {
  AI_PROVIDER_LABELS,
  AI_PROVIDER_OPTIONS,
  PROVIDER_DISPLAY_LABEL
} from '../constants';

const ICON_BY_KEY = {
  Bot,
  Sparkles,
  BrainCircuit,
  Cpu
};

const findProviderOption = (id) =>
  AI_PROVIDER_OPTIONS.find((p) => p.id === id) || AI_PROVIDER_OPTIONS[0];

const ActiveProviderCard = ({ health, loading, error, onRefresh }) => {
  const activeProviderId = health?.activeProvider || 'openai';
  const activeOption = findProviderOption(activeProviderId);
  const IconComponent = ICON_BY_KEY[activeOption.iconKey] || Bot;

  const registeredLabel = (() => {
    if (loading) return AI_PROVIDER_LABELS.healthLoading;
    if (error) return AI_PROVIDER_LABELS.healthFailedPrefix;
    if (!health) return '—';
    if (activeProviderId === 'openai') {
      return health.openaiKeyRegistered ? AI_PROVIDER_LABELS.registered : AI_PROVIDER_LABELS.unregistered;
    }
    if (activeProviderId === 'gemini') {
      return health.geminiKeyRegistered ? AI_PROVIDER_LABELS.registered : AI_PROVIDER_LABELS.unregistered;
    }
    return AI_PROVIDER_LABELS.fallbackUnsupported;
  })();

  const badgeKind = (() => {
    if (loading) return 'loading';
    if (error || registeredLabel === AI_PROVIDER_LABELS.unregistered) return 'warn';
    if (registeredLabel === AI_PROVIDER_LABELS.registered) return 'ok';
    return 'neutral';
  })();

  return (
    <section className="mg-ai-section mg-ai-active-provider">
      <header className="mg-ai-section__header">
        <h2 className="mg-ai-section__title">
          <span className="mg-ai-section__accent" aria-hidden="true" />
          현재 활성 프로바이더
        </h2>
        <MGButton
          type="button"
          variant="secondary"
          size="medium"
          className={buildErpMgButtonClassName({
            variant: 'secondary',
            size: 'md',
            loading
          })}
          onClick={onRefresh}
          disabled={loading}
          loading={loading}
          loadingText={AI_PROVIDER_LABELS.healthRefreshLoading}
          preventDoubleClick={false}
          title="백엔드 DB 기준으로 키 등록 여부를 다시 확인합니다."
        >
          <RefreshCw size={14} aria-hidden="true" />
          {' '}
          {AI_PROVIDER_LABELS.healthRefresh}
        </MGButton>
      </header>

      <div className="mg-ai-active-provider__body">
        <div className="mg-ai-active-provider__logo" aria-hidden="true">
          <IconComponent size={36} strokeWidth={1.7} />
        </div>
        <div className="mg-ai-active-provider__meta">
          <div className="mg-ai-active-provider__name">
            {toDisplayString(PROVIDER_DISPLAY_LABEL[activeProviderId.toUpperCase()] || activeOption.label)}
          </div>
          <div className={`mg-ai-active-provider__badge mg-ai-active-provider__badge--${badgeKind}`}>
            {toDisplayString(registeredLabel)}
          </div>
          {error ? (
            <p className="mg-ai-active-provider__error">
              <AlertCircle size={14} aria-hidden="true" />
              {' '}
              {toDisplayString(error)}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default ActiveProviderCard;
