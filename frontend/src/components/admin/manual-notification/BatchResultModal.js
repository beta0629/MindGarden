/**
 * 수동 발송 결과 모달 (Organism).
 *
 * - 백엔드 `BulkNotificationResponse` 정규화 결과를 받아 표시.
 * - 헤더: 배치 ID + 채널 + 시작 시각
 * - 통계: SettingsSummaryStrip (전체 / 성공 / 스킵 / 실패)
 * - 실패·스킵 행 상세 표 (이름 + phoneMasked + errorCode + errorMessage)
 * - 성공 행 상세 표 (Solapi groupId/messageId 포함, 감사 추적용)
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
import { SettingsButton, SettingsNotice, SettingsSummaryStrip } from '../settings-shell';
import ListTableView from '../../common/ListTableView';
import UnifiedModal from '../../common/modals/UnifiedModal';
import { toDisplayString } from '../../../utils/safeDisplay';
import { MANUAL_NOTIFICATION_ERROR_CODES } from '../../../api/admin/manualNotificationApi';
import './BatchResultModal.css';

const MODAL_CLASS = 'mg-manual-notif-result';

/**
 * 푸시 broadcast 에서 SKIPPED 로 분류하는 errorCode 집합.
 * 백엔드 {@code MobilePushBroadcastResult.ERROR_CODE_*} 와 1:1 매핑.
 */
const SKIPPED_ERROR_CODES = new Set([
  MANUAL_NOTIFICATION_ERROR_CODES.PUSH_NO_TOKEN,
  MANUAL_NOTIFICATION_ERROR_CODES.PUSH_OPTED_OUT,
  MANUAL_NOTIFICATION_ERROR_CODES.PUSH_DUPLICATE
]);

/**
 * 결과 행을 SENT / SKIPPED / FAILED 로 분류. SMS/알림톡은 SKIPPED 가 없으므로 SENT/FAILED 로 양분.
 *
 * @param {object} row BulkRecipientResult
 * @returns {'SENT'|'SKIPPED'|'FAILED'}
 */
const classifyRow = (row) => {
  if (!row) {
    return 'FAILED';
  }
  if (row.success !== false) {
    return 'SENT';
  }
  if (row.errorCode && SKIPPED_ERROR_CODES.has(String(row.errorCode))) {
    return 'SKIPPED';
  }
  return 'FAILED';
};

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

  const classifiedRows = useMemo(() => {
    if (!result?.results || !Array.isArray(result.results)) {
      return { sent: [], skipped: [], failed: [] };
    }
    const sent = [];
    const skipped = [];
    const failed = [];
    for (const row of result.results) {
      const kind = classifyRow(row);
      if (kind === 'SENT') {
        sent.push(row);
      } else if (kind === 'SKIPPED') {
        skipped.push(row);
      } else {
        failed.push(row);
      }
    }
    return { sent, skipped, failed };
  }, [result]);

  const totals = useMemo(() => ({
    total: Number(result?.totalCount ?? 0),
    success: Number(result?.successCount ?? classifiedRows.sent.length),
    skipped: classifiedRows.skipped.length,
    failed: classifiedRows.failed.length
  }), [result, classifiedRows]);

  const failureRows = classifiedRows.failed;
  const skippedRows = classifiedRows.skipped;
  const successRows = classifiedRows.sent;

  const batchErrorCode = result?.batchErrorCode || null;
  const batchErrorMessage = result?.batchErrorMessage || result?.message || null;

  const batchErrorI18nKey = batchErrorCode
    && Object.values(MANUAL_NOTIFICATION_ERROR_CODES).includes(batchErrorCode)
    ? `manualNotification.errors.${batchErrorCode}`
    : null;

  const subtitle = totals.skipped > 0
    ? t('manualNotification.result.subtitleWithSkipped', {
      total: totals.total,
      success: totals.success,
      skipped: totals.skipped,
      failed: totals.failed,
      defaultValue: '총 {{total}}명 중 성공 {{success}}건 / 스킵 {{skipped}}건 / 실패 {{failed}}건'
    })
    : t('manualNotification.result.subtitle', {
      total: totals.total,
      success: totals.success,
      failed: totals.failed,
      defaultValue: '총 {{total}}명 중 성공 {{success}}건 / 실패 {{failed}}건'
    });

  const statLabel = (key, fallback) => t(key, { count: '', defaultValue: fallback }).trim();

  const statItems = [
    { key: 'total', label: statLabel('manualNotification.result.statTotal', '전체'), value: totals.total },
    { key: 'success', label: statLabel('manualNotification.result.statSuccess', '성공'), value: totals.success },
    ...(totals.skipped > 0
      ? [{ key: 'skipped', label: statLabel('manualNotification.result.statSkipped', '스킵'), value: totals.skipped }]
      : []),
    { key: 'failed', label: statLabel('manualNotification.result.statFailed', '실패'), value: totals.failed }
  ];

  const errorColumns = [
    { key: 'recipient', label: t('manualNotification.result.columnRecipient') },
    { key: 'errorCode', label: t('manualNotification.result.columnErrorCode') },
    { key: 'errorMessage', label: t('manualNotification.result.columnErrorMessage'), hideOnMobile: true }
  ];

  const successColumns = [
    { key: 'recipient', label: t('manualNotification.result.columnRecipient') },
    { key: 'solapi', label: t('manualNotification.result.columnSolapiId', 'Solapi ID') }
  ];

  const withRowKeys = (rows, prefix) => rows.map((row, idx) => ({
    ...row,
    rowKey: `${prefix}-${row?.userId ?? idx}`
  }));

  const renderResultCell = (key, row) => {
    switch (key) {
      case 'recipient':
        return (
          <span className="mg-v2-settings-table__cell-stack">
            <strong>{toDisplayString(row?.name, '이름 없음')}</strong>
            <span className="mg-v2-settings-muted">{toDisplayString(row?.phoneMasked, '번호 없음')}</span>
          </span>
        );
      case 'errorCode':
        return <span className="mg-v2-settings-mono">{toDisplayString(row?.errorCode || '', '-')}</span>;
      case 'errorMessage': {
        const code = row?.errorCode || '';
        const codeKey = code && Object.values(MANUAL_NOTIFICATION_ERROR_CODES).includes(code)
          ? `manualNotification.errors.${code}`
          : null;
        const fallbackMessage = toDisplayString(row?.errorMessage, '-');
        return codeKey ? t(codeKey, fallbackMessage) : fallbackMessage;
      }
      case 'solapi':
        return (
          <span className="mg-v2-settings-mono">
            {toDisplayString(row?.solapiGroupId, '-')}
            {' / '}
            {toDisplayString(row?.solapiMessageId, '-')}
          </span>
        );
      default:
        return null;
    }
  };

  const renderSection = ({ modifier, title, rows, columns, prefix, emptyText }) => (
    <section className={`${MODAL_CLASS}__section ${MODAL_CLASS}__section--${modifier}`} aria-label={title}>
      <h4 className="mg-v2-settings-subheading">
        {title}
        {' '}
        <span className="mg-v2-settings-muted">({rows.length})</span>
      </h4>
      {rows.length === 0 ? (
        <p className="mg-v2-settings-muted">{emptyText}</p>
      ) : (
        <div className="mg-v2-settings-table">
          <ListTableView
            columns={columns}
            data={withRowKeys(rows, prefix)}
            renderCell={renderResultCell}
            rowKeyField="rowKey"
          />
        </div>
      )}
    </section>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('manualNotification.result.title')}
      subtitle={subtitle}
      size="large"
      variant="default"
      actions={(
        <SettingsButton
          type="button"
          variant="primary"
          preventDoubleClick
          onClick={onClose}
        >
          {t('manualNotification.result.close')}
        </SettingsButton>
      )}
    >
      <div className={MODAL_CLASS}>
        <dl className="mg-v2-settings-kv">
          <div>
            <dt>{t('manualNotification.result.batchIdLabel')}</dt>
            <dd className="mg-v2-settings-mono">{toDisplayString(result?.batchId, '-')}</dd>
          </div>
          <div>
            <dt>{t('manualNotification.result.channelLabel')}</dt>
            <dd>{toDisplayString(result?.channel, '-')}</dd>
          </div>
          <div>
            <dt>{t('manualNotification.result.startedAtLabel')}</dt>
            <dd>{toDisplayString(result?.startedAt, '-')}</dd>
          </div>
        </dl>

        {batchErrorCode && (
          <SettingsNotice tone="danger">
            <p>
              <strong>{toDisplayString(batchErrorCode, '-')}</strong>
              {' '}
              {batchErrorI18nKey
                ? t(batchErrorI18nKey, toDisplayString(batchErrorMessage, '-'))
                : toDisplayString(batchErrorMessage, '-')}
            </p>
          </SettingsNotice>
        )}

        <SettingsSummaryStrip items={statItems} ariaLabel="발송 통계" testId="manual-notif-result-stats" />

        {skippedRows.length > 0 && renderSection({
          modifier: 'skipped',
          title: t('manualNotification.result.skippedListTitle'),
          rows: skippedRows,
          columns: errorColumns,
          prefix: 'skip',
          emptyText: ''
        })}

        {renderSection({
          modifier: 'failure',
          title: t('manualNotification.result.failureListTitle'),
          rows: failureRows,
          columns: errorColumns,
          prefix: 'fail',
          emptyText: t('manualNotification.result.failureEmpty')
        })}

        {renderSection({
          modifier: 'success',
          title: t('manualNotification.result.successListTitle'),
          rows: successRows,
          columns: successColumns,
          prefix: 'ok',
          emptyText: t('manualNotification.result.successEmpty')
        })}
      </div>
    </UnifiedModal>
  );
};

export default BatchResultModal;
