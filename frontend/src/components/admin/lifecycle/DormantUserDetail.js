/**
 * 휴면 사용자 상세 모달 — Phase 4
 * (USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.9 + §10.12).
 *
 * UnifiedModal 기반. vault 메타데이터 + community 익명화 audit 건수만 표시. 원본 PII 는
 * 절대 노출하지 않는다.
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
import { toDisplayString } from '../../../utils/safeDisplay';

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return toDisplayString(value);
    return d.toLocaleString('ko-KR');
  } catch (_e) {
    return toDisplayString(value);
  }
};

const DormantUserDetail = ({
  isOpen,
  onClose,
  detail,
  loading = false,
  error = null
}) => {
  const { t } = useTranslation('admin');

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('lifecycle.dormantUsers.detail.sectionUser', '사용자 정보')}
      size="medium"
      variant="detail"
      loading={loading}
      actions={(
        <MGButton
          type="button"
          variant="outline"
          className={buildErpMgButtonClassName({
            variant: 'outline', size: 'md', loading: false
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onClose}
          data-testid="dormant-user-detail-close"
        >
          {t('lifecycle.dormantUsers.detail.back', '목록으로')}
        </MGButton>
      )}
    >
      {error ? (
        <p className="mg-modal__message mg-modal__message--danger" role="alert">
          {toDisplayString(error)}
        </p>
      ) : null}

      {!error && detail ? (
        <div className="mg-v2-detail-grid" data-testid="dormant-user-detail">
          <section>
            <h3>{t('lifecycle.dormantUsers.detail.sectionUser', '사용자 정보')}</h3>
            <dl>
              <dt>ID</dt>
              <dd>{toDisplayString(detail.userId)}</dd>
              <dt>{t('lifecycle.dormantUsers.table.userId', '사용자 ID')}</dt>
              <dd>{toDisplayString(detail.maskedUserId)}</dd>
              <dt>{t('lifecycle.dormantUsers.table.role', '역할')}</dt>
              <dd>{toDisplayString(detail.role)}</dd>
              <dt>{t('lifecycle.dormantUsers.detail.lifecycleState', '라이프사이클 상태')}</dt>
              <dd>{toDisplayString(detail.lifecycleState)}</dd>
              <dt>{t('lifecycle.dormantUsers.detail.lastLoginAt', '최근 로그인')}</dt>
              <dd>{formatDateTime(detail.lastLoginAt)}</dd>
              <dt>{t('lifecycle.dormantUsers.detail.updatedAt', '최근 갱신')}</dt>
              <dd>{formatDateTime(detail.updatedAt)}</dd>
            </dl>
          </section>

          <section>
            <h3>{t('lifecycle.dormantUsers.detail.sectionVault', 'Vault 메타데이터')}</h3>
            <p className="mg-v2-detail-note">
              {t('lifecycle.dormantUsers.detail.noPiiNotice',
                '원본 PII (이름·이메일·전화)는 안전 보관(AES-256-GCM)되어 본 화면에 절대 노출되지 않습니다. 복귀(Reactivate) 처리 시점에만 복호화되어 사용자 행으로 복원됩니다.')}
            </p>
            {!detail.vaultPresent ? (
              <p className="mg-v2-detail-warning" role="alert">
                {t('lifecycle.dormantUsers.detail.vaultMissingWarning',
                  'Vault 행이 없어 복귀할 수 없습니다. 운영 담당자에게 문의하세요.')}
              </p>
            ) : (
              <dl>
                <dt>{t('lifecycle.dormantUsers.table.dormantEnteredAt', '휴면 진입')}</dt>
                <dd>{formatDateTime(detail.dormantEnteredAt)}</dd>
                <dt>{t('lifecycle.dormantUsers.table.anonymizeScheduledAt', '익명화 예정')}</dt>
                <dd>{formatDateTime(detail.anonymizeScheduledAt)}</dd>
                <dt>{t('lifecycle.dormantUsers.table.preNoticeSentAt', '사전 통지')}</dt>
                <dd>{formatDateTime(detail.preNoticeSentAt)}</dd>
                <dt>{t('lifecycle.dormantUsers.table.preNoticeChannel', '통지 채널')}</dt>
                <dd>{toDisplayString(detail.preNoticeChannel)}</dd>
              </dl>
            )}
          </section>

          <section>
            <h3>{t('lifecycle.dormantUsers.detail.sectionAudit', '커뮤니티 익명화 이력')}</h3>
            <dl>
              <dt>{t('lifecycle.dormantUsers.detail.auditCount', '커뮤니티 익명화 이력 (건)')}</dt>
              <dd>{toDisplayString(detail.communityAnonymizationAuditCount)}</dd>
            </dl>
          </section>
        </div>
      ) : null}
    </UnifiedModal>
  );
};

export default DormantUserDetail;
