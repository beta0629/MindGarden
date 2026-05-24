/**
 * API 키 변경 모달 본문 — `UnifiedModal` 내부.
 *
 * - 키 입력 (보기/숨기기 토글), URL, 모델 입력.
 * - "저장" 액션은 부모(`ApiKeyManager`)가 모달 `actions` 슬롯으로 주입.
 *
 * @author MindGarden
 * @since 2026-05-24
 */
import React, { useState } from 'react';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { toDisplayString } from '../../../../utils/safeDisplay';
import { AI_PROVIDER_LABELS } from '../constants';

const ApiKeyModalContent = ({
  provider,
  form,
  onChange,
  submitting
}) => {
  const [showKey, setShowKey] = useState(false);

  const update = (field, value) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <div className="mg-ai-api-key-modal">
      <p className="mg-ai-api-key-modal__desc">
        {toDisplayString(provider.label)}
        {' '}
        프로바이더의 API 키·URL·모델을 입력해 주세요. 키는 암호화되어 저장됩니다.
      </p>

      <div className="mg-ai-api-key-modal__field">
        <label htmlFor={`apiKey-modal-${provider.id}`}>
          {toDisplayString(AI_PROVIDER_LABELS.apiKeyLabel)}
        </label>
        <div className="mg-ai-api-key-modal__row">
          <input
            id={`apiKey-modal-${provider.id}`}
            type={showKey ? 'text' : 'password'}
            value={form.apiKey || ''}
            onChange={(e) => update('apiKey', e.target.value)}
            placeholder={provider.id === 'openai' ? 'sk-...' : 'API 키 입력'}
            className="mg-v2-input mg-ai-api-key-modal__input"
            disabled={submitting}
            autoComplete="off"
          />
          <button
            type="button"
            className="mg-ai-api-key-modal__toggle"
            onClick={() => setShowKey((prev) => !prev)}
            aria-label={showKey ? '키 숨기기' : '키 표시'}
            disabled={submitting}
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <small className="mg-ai-api-key-modal__help">
          <Shield size={14} aria-hidden="true" />
          {' '}API 키는 암호화되어 저장됩니다.
        </small>
      </div>

      <div className="mg-ai-api-key-modal__field">
        <label htmlFor={`apiUrl-modal-${provider.id}`}>
          {toDisplayString(AI_PROVIDER_LABELS.apiUrlLabel)}
        </label>
        <input
          id={`apiUrl-modal-${provider.id}`}
          type="text"
          value={form.apiUrl || ''}
          onChange={(e) => update('apiUrl', e.target.value)}
          placeholder="https://..."
          className="mg-v2-input mg-ai-api-key-modal__input"
          disabled={submitting}
        />
      </div>

      <div className="mg-ai-api-key-modal__field">
        <label htmlFor={`apiModel-modal-${provider.id}`}>
          {toDisplayString(AI_PROVIDER_LABELS.modelLabel)}
        </label>
        <input
          id={`apiModel-modal-${provider.id}`}
          type="text"
          value={form.model || ''}
          onChange={(e) => update('model', e.target.value)}
          placeholder={provider.defaultModel || '모델 ID'}
          className="mg-v2-input mg-ai-api-key-modal__input"
          disabled={submitting}
        />
      </div>
    </div>
  );
};

export default ApiKeyModalContent;
