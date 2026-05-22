/**
 * 수동 발송 결과 모달 (Organism).
 *
 * - 백엔드 `BulkNotificationResponse` 정규화 결과를 받아 표시.
 * - 헤더: 배치 ID + 채널 + 시작 시각
 * - 통계 카드: 전체 / 성공 / 실패 카운트
 * - 실패 행 상세 리스트 (이름 + phoneMasked + errorCode + errorMessage)
 * - 성공 행 상세 리스트 (Solapi groupId/messageId 포함, 감사 추적용)
 * - 전체 차단(`batchErrorCode`)인 경우 결과 행이 없으므로
 *   배치 에러 메시지를 상단 배너로 노출 (RATE_LIMIT_EXCEEDED_BULK 등).
 *
 * 자체 모달 금지 정책에 따라 `UnifiedModal` 기반으로만 구성.
 * React #130 방어: 모든 표시 값은 `toDisplayString` 으로 변환.
 * 디자인 토큰만 사용. 인라인 스타일 0건.
 *
 * @author MindGarden
 * @since 2026-05-23
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import MGButton from '../../common/MGButton';
import UnifiedModal from '../../common/modals/UnifiedModal';
import { toDisplayString } from '../../../utils/safeDisplay';
import { MANUAL_NOTIFICATION_ERROR_CODES } from '../../../api/admin/manualNotificationApi';
import './BatchResultModal.css';

const MODAL_CLASS = 'mg-manual-notif-result';

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: function,
 *   result: ({
 *     batchId: string,
 *     channel: string,
 *     startedAt: string,
 *     totalCount: number,
 *     successCount: number,
 *     failureCount: number,
 *     batchErrorCode: (string|null),
 *     batchErrorMessage: (string|null),
 *     results: Array<object>,
 *     success?: boolean,
 *     message?: (string|null)
 *   }|null)
 * }} props
 */
const BatchResultModal = ({ isOpen, onClose, result }) => {
  const { t } = useTranslation('admin');

  const totals = useMemo(() => ({
    total: Number(result?.totalCount ?? 0),
    success: Number(result?.successCount ?? 0),
    failed: Number(result?.failureCount ?? 0)
  }), [result]);

  const failureRows = useMemo(() => {
    if (!result?.results || !Array.isArray(result.results)) {
      return [];
    }
    return result.results.filter((r) => r && r.success === false);
  }, [result]);

  const successRows = useMemo(() => {
    if (!result?.results || !Array.isArray(result.results)) {
      return [];
    }
    return result.results.filter((r) => r && r.success !== false);
  }, [result]);

  const batchErrorCode = result?.batchErrorCode || null;
  const batchErrorMessage = result?.batchErrorMessage || result?.message || null;

  const batchErrorI18nKey = batchErrorCode
    && Object.values(MANUAL_NOTIFICATION_ERROR_CODES).includes(batchErrorCode)
    ? `manualNotification.errors.${batchErrorCode}`
    : null;

  const subtitle = t('manualNotification.result.subtitle', {
    total: totals.total,
    success: totals.success,
    failed: totals.failed,
    defaultValue: '총 {{total}}명 중 성공 {{success}}건 / 실패 {{failed}}건'
  });

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('manualNotification.result.title', '발송 결과')}
      subtitle={subtitle}
      size="large"
      variant="default"
      actions={(
        <MGButton
          type="button"
          variant="primary"
          className={buildErpMgButtonClassName({
            variant: 'primary',
            size: 'md',
            loading: false
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onClose}
        >
          {t('manualNotification.result.close', '닫기')}
        </MGButton>
      )}
    >
      <div className={MODAL_CLASS}>
        <header className={`${MODAL_CLASS}__header`}>
          <dl className={`${MODAL_CLASS}__meta`}>
            <div className={`${MODAL_CLASS}__meta-item`}>
              <dt className={`${MODAL_CLASS}__meta-label`}>
                {t('manualNotification.result.batchIdLabel', '배치 ID')}
              </dt>
              <dd className={`${MODAL_CLASS}__meta-value`}>
                {toDisplayString(result?.batchId, '-')}
              </dd>
            </div>
            <div className={`${MODAL_CLASS}__meta-item`}>
              <dt className={`${MODAL_CLASS}__meta-label`}>
                {t('manualNotification.result.channelLabel', '채널')}
              </dt>
              <dd className={`${MODAL_CLASS}__meta-value`}>
                {toDisplayString(result?.channel, '-')}
              </dd>
            </div>
            <div className={`${MODAL_CLASS}__meta-item`}>
              <dt className={`${MODAL_CLASS}__meta-label`}>
                {t('manualNotification.result.startedAtLabel', '시작 시각')}
              </dt>
              <dd className={`${MODAL_CLASS}__meta-value`}>
                {toDisplayString(result?.startedAt, '-')}
              </dd>
            </div>
          </dl>
        </header>

        {batchErrorCode && (
          <div
            className={`${MODAL_CLASS}__batch-error`}
            role="alert"
          >
            <strong className={`${MODAL_CLASS}__batch-error-code`}>
              {toDisplayString(batchErrorCode, '-')}
            </strong>
            <span className={`${MODAL_CLASS}__batch-error-message`}>
              {batchErrorI18nKey
                ? t(batchErrorI18nKey, toDisplayString(batchErrorMessage, '-'))
                : toDisplayString(batchErrorMessage, '-')}
            </span>
          </div>
        )}

        <section className={`${MODAL_CLASS}__stats`} aria-label="발송 통계">
          <div className={`${MODAL_CLASS}__stat ${MODAL_CLASS}__stat--total`}>
            {t('manualNotification.result.statTotal', {
              count: totals.total,
              defaultValue: '전체 {{count}}'
            })}
          </div>
          <div className={`${MODAL_CLASS}__stat ${MODAL_CLASS}__stat--success`}>
            {t('manualNotification.result.statSuccess', {
              count: totals.success,
              defaultValue: '성공 {{count}}'
            })}
          </div>
          <div className={`${MODAL_CLASS}__stat ${MODAL_CLASS}__stat--failed`}>
            {t('manualNotification.result.statFailed', {
              count: totals.failed,
              defaultValue: '실패 {{count}}'
            })}
          </div>
        </section>

        <section
          className={`${MODAL_CLASS}__section ${MODAL_CLASS}__section--failure`}
          aria-label={t('manualNotification.result.failureListTitle', '실패 상세')}
        >
          <h4 className={`${MODAL_CLASS}__section-title`}>
            {t('manualNotification.result.failureListTitle', '실패 상세')}
            {' '}
            <span className={`${MODAL_CLASS}__section-count`}>({failureRows.length})</span>
          </h4>
          {failureRows.length === 0 ? (
            <p className={`${MODAL_CLASS}__empty`}>
              {t('manualNotification.result.failureEmpty', '실패한 수신자가 없습니다.')}
            </p>
          ) : (
            <ul className={`${MODAL_CLASS}__list`}>
              {failureRows.map((row, idx) => {
                const code = row?.errorCode || '';
                const codeKey = code && Object.values(MANUAL_NOTIFICATION_ERROR_CODES).includes(code)
                  ? `manualNotification.errors.${code}`
                  : null;
                const fallbackMessage = toDisplayString(row?.errorMessage, '-');
                const displayedMessage = codeKey ? t(codeKey, fallbackMessage) : fallbackMessage;
                return (
                  <li
                    key={`fail-${row?.userId ?? idx}`}
                    className={`${MODAL_CLASS}__row ${MODAL_CLASS}__row--failure`}
                  >
                    <div className={`${MODAL_CLASS}__row-main`}>
                      <span className={`${MODAL_CLASS}__row-name`}>
                        {toDisplayString(row?.name, '이름 없음')}
                      </span>
                      <span className={`${MODAL_CLASS}__row-phone`}>
                        {toDisplayString(row?.phoneMasked, '번호 없음')}
                      </span>
                    </div>
                    <div className={`${MODAL_CLASS}__row-error`}>
                      <span className={`${MODAL_CLASS}__row-error-code`}>
                        {toDisplayString(code, '-')}
                      </span>
                      <span className={`${MODAL_CLASS}__row-error-message`}>
                        {displayedMessage}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          className={`${MODAL_CLASS}__section ${MODAL_CLASS}__section--success`}
          aria-label={t('manualNotification.result.successListTitle', '성공 상세')}
        >
          <h4 className={`${MODAL_CLASS}__section-title`}>
            {t('manualNotification.result.successListTitle', '성공 상세')}
            {' '}
            <span className={`${MODAL_CLASS}__section-count`}>({successRows.length})</span>
          </h4>
          {successRows.length === 0 ? (
            <p className={`${MODAL_CLASS}__empty`}>
              {t('manualNotification.result.successEmpty', '성공한 수신자가 없습니다.')}
            </p>
          ) : (
            <ul className={`${MODAL_CLASS}__list`}>
              {successRows.map((row, idx) => (
                <li
                  key={`ok-${row?.userId ?? idx}`}
                  className={`${MODAL_CLASS}__row ${MODAL_CLASS}__row--success`}
                >
                  <div className={`${MODAL_CLASS}__row-main`}>
                    <span className={`${MODAL_CLASS}__row-name`}>
                      {toDisplayString(row?.name, '이름 없음')}
                    </span>
                    <span className={`${MODAL_CLASS}__row-phone`}>
                      {toDisplayString(row?.phoneMasked, '번호 없음')}
                    </span>
                  </div>
                  <div className={`${MODAL_CLASS}__row-solapi`}>
                    <span className={`${MODAL_CLASS}__row-solapi-label`}>
                      {t('manualNotification.result.columnSolapiId', 'Solapi ID')}:
                    </span>
                    <span className={`${MODAL_CLASS}__row-solapi-value`}>
                      {toDisplayString(row?.solapiGroupId, '-')}
                      {' / '}
                      {toDisplayString(row?.solapiMessageId, '-')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </UnifiedModal>
  );
};

export default BatchResultModal;
