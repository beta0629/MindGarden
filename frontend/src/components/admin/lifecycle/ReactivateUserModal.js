/**
 * 휴면 사용자 복귀 확인 모달 — Phase 4
 * (USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.9).
 *
 * UnifiedModal SSOT 기반. 어드민이 휴면 사용자의 PII 를 vault 에서 복호화·원복하고
 * lifecycle 을 ACTIVE 로 전이하기 전에 확인 단계를 강제한다.
 *
 * @author Core Solution
 * @since 2026-06-06
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT
} from '../../erp/common/erpMgButtonProps';

const ReactivateUserModal = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  loading = false
}) => {
  const { t } = useTranslation('admin');

  const handleConfirm = () => {
    if (loading) return;
    onConfirm?.(user);
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      title={t('lifecycle.dormantUsers.reactivateModal.title', '휴면 사용자 복귀')}
      size="small"
      variant="confirm"
      loading={loading}
      actions={(
        <>
          <MGButton
            type="button"
            variant="outline"
            className={buildErpMgButtonClassName({
              variant: 'outline', size: 'md', loading
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onClose}
            disabled={loading}
            data-testid="reactivate-cancel"
          >
            {t('lifecycle.dormantUsers.reactivateModal.cancel', '취소')}
          </MGButton>
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({
              variant: 'primary', size: 'md', loading
            })}
            loadingText={loading
              ? t('lifecycle.dormantUsers.reactivateModal.processing', '복귀 처리 중...')
              : ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleConfirm}
            disabled={loading}
            data-testid="reactivate-confirm"
          >
            {t('lifecycle.dormantUsers.reactivateModal.confirm', '복귀 처리')}
          </MGButton>
        </>
      )}
    >
      <p className="mg-modal__message">
        {t('lifecycle.dormantUsers.reactivateModal.confirmMessage',
          '선택한 사용자를 휴면 상태에서 활성으로 복귀시킵니다. Vault 의 PII 가 복호화되어 사용자 행에 원복됩니다. 진행할까요?')}
      </p>
    </UnifiedModal>
  );
};

export default ReactivateUserModal;
