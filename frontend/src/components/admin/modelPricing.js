/**
 * AI 모델별 요금 참고 (1M tokens 기준, USD)
 * 공식 요금은 변동될 수 있으므로 참고용이며, 실제 과금은 각 서비스 약관을 따릅니다.
 * @see https://openai.com/api/pricing/
 * @see https://ai.google.dev/gemini-api/docs/pricing
 */

/** 요금 구간 라벨 (소비자 선택 시 참고) */
export const PRICING_TIER_LABELS = {
  economy: '저렴',
  standard: '보통',
  premium: '고가'
};

/** 프로바이더별 공식 요금 페이지 */
export const PRICING_URLS = {
  openai: 'https://openai.com/api/pricing/',
  gemini: 'https://ai.google.dev/gemini-api/docs/pricing',
  claude: 'https://www.anthropic.com/pricing',
  replicate: 'https://replicate.com/pricing'
};

/**
 * 모델 ID 또는 접두사로 요금 정보 조회
 * @param {string} providerId - openai | gemini | claude | replicate
 * @param {string} modelId - 예: gpt-4o-mini, gemini-2.5-flash
 * @returns {{ inputPer1M: number, outputPer1M: number, tier: string, label?: string } | null}
 */
export function getModelPricing(providerId, modelId) {
  if (!modelId || typeof modelId !== 'string') return null;
  const id = modelId.trim().toLowerCase();
  const map = MODEL_PRICING[providerId];
  if (!map) return null;
  if (map[id]) return map[id];
  // 접두사 일치 (가장 긴 키 우선, 예: gpt-4o-2024-05-13 -> gpt-4o)
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (id.startsWith(key)) return map[key];
  }
  return null;
}

/**
 * 선택한 모델의 요금 문구 (UI 표시용)
 * @returns {string} 예: "입력 $0.15/1M·출력 $0.60/1M (저렴)"
 */
export function getModelPricingLabel(providerId, modelId) {
  const p = getModelPricing(providerId, modelId);
  if (!p) return '';
  const tier = PRICING_TIER_LABELS[p.tier] ? ` (${PRICING_TIER_LABELS[p.tier]})` : '';
  return `입력 $${p.inputPer1M}/1M·출력 $${p.outputPer1M}/1M${tier}`;
}

/**
 * 드롭다운 옵션에 붙일 짧은 라벨 (모델명 + 요금 구간)
 */
export function getModelOptionSuffix(providerId, modelId) {
  const p = getModelPricing(providerId, modelId);
  if (!p || !PRICING_TIER_LABELS[p.tier]) return '';
  return ` (${PRICING_TIER_LABELS[p.tier]})`;
}

const MODEL_PRICING = {
  openai: {
    'gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.6, tier: 'economy', label: 'GPT-4o Mini' },
    'gpt-3.5-turbo': { inputPer1M: 0.5, outputPer1M: 1.5, tier: 'economy', label: 'GPT-3.5 Turbo' },
    'gpt-4o': { inputPer1M: 2.5, outputPer1M: 10, tier: 'standard', label: 'GPT-4o' },
    'gpt-4-turbo': { inputPer1M: 10, outputPer1M: 30, tier: 'premium', label: 'GPT-4 Turbo' },
    'gpt-4-turbo-preview': { inputPer1M: 10, outputPer1M: 30, tier: 'premium', label: 'GPT-4 Turbo Preview' },
    'gpt-4': { inputPer1M: 30, outputPer1M: 60, tier: 'premium', label: 'GPT-4' },
    'gpt-4-1106-preview': { inputPer1M: 10, outputPer1M: 30, tier: 'premium', label: 'GPT-4 1106' },
    'gpt-5-pro': { inputPer1M: 5, outputPer1M: 15, tier: 'premium', label: 'GPT-5 Pro' },
    'gpt-5': { inputPer1M: 5, outputPer1M: 15, tier: 'premium', label: 'GPT-5' },
    'o1': { inputPer1M: 15, outputPer1M: 60, tier: 'premium', label: 'o1' },
    'o1-mini': { inputPer1M: 3, outputPer1M: 12, tier: 'standard', label: 'o1-mini' }
  },
  gemini: {
    'gemini-2.0-flash': { inputPer1M: 0.1, outputPer1M: 0.4, tier: 'economy', label: 'Gemini 2.0 Flash' },
    'gemini-2.5-flash-lite': { inputPer1M: 0.1, outputPer1M: 0.4, tier: 'economy', label: 'Gemini 2.5 Flash Lite' },
    'gemini-2.5-flash': { inputPer1M: 0.3, outputPer1M: 2.5, tier: 'economy', label: 'Gemini 2.5 Flash' },
    'gemini-1.5-flash': { inputPer1M: 0.075, outputPer1M: 0.3, tier: 'economy', label: 'Gemini 1.5 Flash' },
    'gemini-1.5-pro': { inputPer1M: 1.25, outputPer1M: 5, tier: 'standard', label: 'Gemini 1.5 Pro' },
    'gemini-2.5-pro': { inputPer1M: 1.25, outputPer1M: 10, tier: 'standard', label: 'Gemini 2.5 Pro' },
    'gemini-3.1-pro': { inputPer1M: 2, outputPer1M: 12, tier: 'premium', label: 'Gemini 3.1 Pro' }
  },
  claude: {
    'claude-3-5-sonnet': { inputPer1M: 3, outputPer1M: 15, tier: 'standard', label: 'Claude 3.5 Sonnet' },
    'claude-3-5-haiku': { inputPer1M: 0.8, outputPer1M: 4, tier: 'economy', label: 'Claude 3.5 Haiku' },
    'claude-3-opus': { inputPer1M: 15, outputPer1M: 75, tier: 'premium', label: 'Claude 3 Opus' }
  },
  replicate: {}
};

export default MODEL_PRICING;
