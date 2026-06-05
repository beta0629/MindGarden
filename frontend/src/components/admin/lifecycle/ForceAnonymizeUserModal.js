/**
 * 휴면 사용자 강제 즉시 익명화 확인 모달 — Phase 4
 * (USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.12 + §10.9).
 *
 * UnifiedModal SSOT 기반. 4년 안정 보관 기간이 만료되지 않았더라도 운영 결재 후
 * 어드민이 즉시 익명화를 수행할 수 있도록 한다. 되돌릴 수 없는 작업이므로 명시적
 * 경고 + 별도 확인 단계.
 *
 * @author Core Solution
 * @since 2026-06-06
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import UnifiedModal from '../../common/modals/UnifiedModal';
import ActionBar from '../../common/ActionBar';
import ActionBarButton from '../../common/ActionBarButton';

const ForceAnonymizeUserModal = ({
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
      title={t('lifecycle.dormantUsers.forceAnonymizeModal.title', '휴면 사용자 즉시 익명화')}
      size="small"
      variant="confirm"
      loading={loading}
      actions={(
        <ActionBar align="end" gap="md">
          <ActionBarButton
            variant="outline"
            onClick={onClose}
            disabled={loading}
            data-testid="force-anonymize-cancel"
          >
            {t('lifecycle.dormantUsers.forceAnonymizeModal.cancel', '취소')}
          </ActionBarButton>
          <ActionBarButton
            variant="danger"
            onClick={handleConfirm}
            loading={loading}
            data-testid="force-anonymize-confirm"
          >
            {t('lifecycle.dormantUsers.forceAnonymizeModal.confirm', '익명화 실행')}
          </ActionBarButton>
        </ActionBar>
      )}
    >
      <p className="mg-modal__message mg-modal__message--danger">
        {t('lifecycle.dormantUsers.forceAnonymizeModal.warning',
          '이 작업은 되돌릴 수 없습니다.')}
      </p>
      <p className="mg-modal__message">
        {t('lifecycle.dormantUsers.forceAnonymizeModal.confirmMessage',
          '선택한 휴면 사용자의 PII 를 즉시 익명화하고 Vault 를 파기합니다. 4년 안정 보관 기간이 만료되지 않았더라도 운영 결재 후 실행되어야 합니다. 진행할까요?')}
      </p>
    </UnifiedModal>
  );
};

export default ForceAnonymizeUserModal;
