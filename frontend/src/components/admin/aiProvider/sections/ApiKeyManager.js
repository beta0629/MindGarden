/**
 * §3. API 키 관리 섹션 — 디자이너 §3.
 *
 * - 4종 provider 별 키 마스킹·"키 변경" 모달 트리거.
 * - `UnifiedModal` 공통 모듈 사용 (커스텀 오버레이 금지).
 *
 * @author MindGarden
 * @since 2026-05-24
 */
import React, { useCallback, useState } from 'react';
import { KeyRound, Trash2 } from 'lucide-react';
import MGButton from '../../../common/MGButton';
import UnifiedModal from '../../../common/modals/UnifiedModal';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../../utils/safeDisplay';
import ApiKeyModalContent from '../molecules/ApiKeyModalContent';
import {
  AI_PROVIDER_LABELS,
  AI_PROVIDER_OPTIONS,
  maskApiKey
} from '../constants';

const ApiKeyManager = ({
  providers,
  saving,
  onSaveProviderKey,
  onDeleteProviderKey
}) => {
  const [editingProviderId, setEditingProviderId] = useState(null);
  const [formState, setFormState] = useState(null);

  const openModal = useCallback((providerId) => {
    const current = providers?.[providerId] || {};
    const opt = AI_PROVIDER_OPTIONS.find((p) => p.id === providerId);
    setFormState({
      apiKey: current.apiKey || '',
      apiUrl: current.apiUrl || '',
      model: current.model || (opt?.defaultModel || '')
    });
    setEditingProviderId(providerId);
  }, [providers]);

  const closeModal = useCallback(() => {
    setEditingProviderId(null);
    setFormState(null);
  }, []);

  const handleSave = useCallback(async() => {
    if (!editingProviderId || !formState) {
      return;
    }
    try {
      await onSaveProviderKey(editingProviderId, formState);
      closeModal();
    } catch (e) {
      // 부모가 알림 처리. 모달은 열어 둔 채로 유지.
    }
  }, [editingProviderId, formState, onSaveProviderKey, closeModal]);

  const handleDelete = useCallback(async(providerId) => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm(`${providerId.toUpperCase()} API 키를 삭제하시겠습니까?`);
      if (!ok) {
        return;
      }
    }
    await onDeleteProviderKey(providerId);
  }, [onDeleteProviderKey]);

  const editingProvider = editingProviderId
    ? AI_PROVIDER_OPTIONS.find((p) => p.id === editingProviderId)
    : null;

  return (
    <section className="mg-ai-section mg-ai-api-key-manager">
      <header className="mg-ai-section__header">
        <h2 className="mg-ai-section__title">
          <span className="mg-ai-section__accent" aria-hidden="true" />
          API 키 관리
        </h2>
      </header>
      <p className="mg-ai-section__desc">
        프로바이더별 API 키·URL·모델을 관리합니다. 키는 마스킹되어 노출됩니다 (실제 키 값은 백엔드에서 암호화 저장).
      </p>

      <ul className="mg-ai-api-key-manager__list" aria-label="API 키 목록">
        {AI_PROVIDER_OPTIONS.map((provider) => {
          const current = providers?.[provider.id] || {};
          const hasKey = (current.apiKey || '').trim() !== '';
          return (
            <li key={provider.id} className="mg-ai-api-key-manager__row">
              <div className="mg-ai-api-key-manager__head">
                <KeyRound size={16} aria-hidden="true" />
                <span className="mg-ai-api-key-manager__name">{toDisplayString(provider.label)}</span>
              </div>
              <div className="mg-ai-api-key-manager__meta">
                <span
                  className={[
                    'mg-ai-api-key-manager__key',
                    hasKey ? 'mg-ai-api-key-manager__key--filled' : 'mg-ai-api-key-manager__key--empty'
                  ].join(' ')}
                >
                  {hasKey ? toDisplayString(maskApiKey(current.apiKey)) : AI_PROVIDER_LABELS.unregistered}
                </span>
                {current.model ? (
                  <span className="mg-ai-api-key-manager__model">{toDisplayString(current.model)}</span>
                ) : null}
              </div>
              <div className="mg-ai-api-key-manager__actions">
                <MGButton
                  type="button"
                  variant="secondary"
                  size="medium"
                  className={buildErpMgButtonClassName({
                    variant: 'secondary',
                    size: 'md',
                    loading: false
                  })}
                  onClick={() => openModal(provider.id)}
                  disabled={saving}
                  preventDoubleClick={false}
                >
                  {hasKey ? AI_PROVIDER_LABELS.changeKey : AI_PROVIDER_LABELS.saveKey}
                </MGButton>
                {hasKey ? (
                  <MGButton
                    type="button"
                    variant="ghost"
                    size="medium"
                    className={buildErpMgButtonClassName({
                      variant: 'secondary',
                      size: 'md',
                      loading: false,
                      className: 'mg-ai-api-key-manager__delete'
                    })}
                    onClick={() => handleDelete(provider.id)}
                    disabled={saving}
                    preventDoubleClick={false}
                    aria-label={`${provider.label} 키 삭제`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    {' '}
                    {AI_PROVIDER_LABELS.deleteKey}
                  </MGButton>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {editingProvider && formState ? (
        <UnifiedModal
          isOpen
          onClose={saving ? undefined : closeModal}
          title={`${editingProvider.label} API 키 ${maskApiKey(formState.apiKey) ? '변경' : '등록'}`}
          subtitle="키는 암호화되어 저장됩니다."
          size="medium"
          variant="form"
          loading={saving}
          actions={(
            <>
              <MGButton
                type="button"
                variant="secondary"
                size="medium"
                className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
                onClick={closeModal}
                disabled={saving}
                preventDoubleClick={false}
              >
                취소
              </MGButton>
              <MGButton
                type="button"
                variant="primary"
                size="medium"
                className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: saving })}
                onClick={handleSave}
                disabled={saving}
                loading={saving}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
              >
                저장
              </MGButton>
            </>
          )}
        >
          <ApiKeyModalContent
            provider={editingProvider}
            form={formState}
            onChange={setFormState}
            submitting={saving}
          />
        </UnifiedModal>
      ) : null}
    </section>
  );
};

export default ApiKeyManager;
