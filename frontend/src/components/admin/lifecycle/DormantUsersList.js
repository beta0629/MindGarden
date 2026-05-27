/**
 * 휴면 사용자 목록 (테이블) 컴포넌트 — Phase 4
 * (USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.9 + §10.12).
 *
 * Spring Data Page 응답을 받아 목록을 렌더링한다. 사용자 PII 는 절대 노출되지 않으며
 * 마스킹된 user_id 와 vault 메타데이터 (휴면 진입·익명화 예정·사전 통지) 만 표시한다.
 *
 * @author Core Solution
 * @since 2026-06-06
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import MGButton from '../../common/MGButton';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT
} from '../../erp/common/erpMgButtonProps';
import UnifiedLoading from '../../common/UnifiedLoading';
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

const DormantUsersList = ({
  page,
  loading = false,
  error = null,
  onChangePage,
  onViewDetail,
  onReactivate,
  onForceAnonymize
}) => {
  const { t } = useTranslation('admin');

  if (loading) {
    return (
      <UnifiedLoading
        type="inline"
        text={t('lifecycle.dormantUsers.pageSubtitle', '휴면 사용자 목록을 불러오는 중...')}
        variant="spinner"
        size="medium"
      />
    );
  }

  if (error) {
    return (
      <div
        className="mg-v2-empty-state mg-v2-empty-state--error"
        role="alert"
        data-testid="dormant-users-error"
      >
        {toDisplayString(error)}
      </div>
    );
  }

  const content = page?.content || [];
  if (!Array.isArray(content) || content.length === 0) {
    return (
      <div className="mg-v2-empty-state" data-testid="dormant-users-empty">
        <h3 className="mg-v2-empty-state__title">
          {t('lifecycle.dormantUsers.empty.title', '휴면 사용자가 없습니다')}
        </h3>
        <p className="mg-v2-empty-state__description">
          {t('lifecycle.dormantUsers.empty.description',
            '현재 테넌트에 DORMANT 상태의 사용자가 없습니다.')}
        </p>
      </div>
    );
  }

  const totalPages = page?.totalPages ?? 1;
  const currentPage = page?.number ?? 0;
  const hasPrev = currentPage > 0;
  const hasNext = currentPage + 1 < totalPages;

  return (
    <div className="mg-v2-card" data-testid="dormant-users-list">
      <div className="mg-v2-table-wrapper">
        <table className="mg-v2-table" aria-label="휴면 사용자 목록">
          <thead>
            <tr>
              <th scope="col">{t('lifecycle.dormantUsers.table.id', 'ID')}</th>
              <th scope="col">{t('lifecycle.dormantUsers.table.userId', '사용자 ID')}</th>
              <th scope="col">{t('lifecycle.dormantUsers.table.role', '역할')}</th>
              <th scope="col">{t('lifecycle.dormantUsers.table.dormantEnteredAt', '휴면 진입')}</th>
              <th scope="col">{t('lifecycle.dormantUsers.table.anonymizeScheduledAt', '익명화 예정')}</th>
              <th scope="col">{t('lifecycle.dormantUsers.table.preNoticeSentAt', '사전 통지')}</th>
              <th scope="col">{t('lifecycle.dormantUsers.table.preNoticeChannel', '통지 채널')}</th>
              <th scope="col">{t('lifecycle.dormantUsers.table.vault', 'Vault')}</th>
              <th scope="col">{t('lifecycle.dormantUsers.table.actions', '작업')}</th>
            </tr>
          </thead>
          <tbody>
            {content.map((row) => (
              <tr key={row.userId} data-testid={`dormant-user-row-${row.userId}`}>
                <td>{toDisplayString(row.userId)}</td>
                <td>{toDisplayString(row.maskedUserId)}</td>
                <td>{toDisplayString(row.role)}</td>
                <td>{formatDateTime(row.dormantEnteredAt)}</td>
                <td>{formatDateTime(row.anonymizeScheduledAt)}</td>
                <td>{formatDateTime(row.preNoticeSentAt)}</td>
                <td>{toDisplayString(row.preNoticeChannel)}</td>
                <td>
                  {row.vaultPresent
                    ? t('lifecycle.dormantUsers.vault.present', '보관 중')
                    : t('lifecycle.dormantUsers.vault.missing', 'Vault 누락')}
                </td>
                <td>
                  <MGButton
                    type="button"
                    variant="outline"
                    className={buildErpMgButtonClassName({
                      variant: 'outline', size: 'sm', loading: false
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => onViewDetail?.(row)}
                    data-testid={`dormant-user-detail-${row.userId}`}
                  >
                    {t('lifecycle.dormantUsers.actions.viewDetail', '상세')}
                  </MGButton>
                  {' '}
                  <MGButton
                    type="button"
                    variant="primary"
                    className={buildErpMgButtonClassName({
                      variant: 'primary', size: 'sm', loading: false
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => onReactivate?.(row)}
                    disabled={!row.vaultPresent}
                    data-testid={`dormant-user-reactivate-${row.userId}`}
                  >
                    {t('lifecycle.dormantUsers.actions.reactivate', '복귀')}
                  </MGButton>
                  {' '}
                  <MGButton
                    type="button"
                    variant="danger"
                    className={buildErpMgButtonClassName({
                      variant: 'danger', size: 'sm', loading: false
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => onForceAnonymize?.(row)}
                    data-testid={`dormant-user-force-anonymize-${row.userId}`}
                  >
                    {t('lifecycle.dormantUsers.actions.forceAnonymize', '즉시 익명화')}
                  </MGButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mg-v2-pagination" role="navigation" aria-label="페이지네이션">
        <MGButton
          type="button"
          variant="outline"
          className={buildErpMgButtonClassName({
            variant: 'outline', size: 'sm', loading: false
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => onChangePage?.(currentPage - 1)}
          disabled={!hasPrev}
          data-testid="dormant-users-prev-page"
        >
          ‹
        </MGButton>
        <span className="mg-v2-pagination__indicator">
          {currentPage + 1} / {totalPages || 1}
        </span>
        <MGButton
          type="button"
          variant="outline"
          className={buildErpMgButtonClassName({
            variant: 'outline', size: 'sm', loading: false
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => onChangePage?.(currentPage + 1)}
          disabled={!hasNext}
          data-testid="dormant-users-next-page"
        >
          ›
        </MGButton>
      </div>
    </div>
  );
};

export default DormantUsersList;
