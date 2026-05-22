/**
 * 수동 발송 배치 히스토리 (Organism).
 *
 * - `GET /api/v1/admin/manual-notifications/history` 페이지네이션 조회
 * - batchId 기준 카드 그룹 (1행 = 1배치) + 아코디언 확장
 * - 펼치면 `GET /api/v1/admin/manual-notifications/batches/{batchId}` 호출하여
 *   수신자별 결과(이름 / 마스킹 전화 / Solapi ID / 상태 / 에러 메시지) 노출
 * - `refreshKey` prop 변경 시 자동 새로고침 (폼에서 발송 성공 후 호출)
 * - React #130 방어: 모든 표시 값 `toDisplayString` 변환
 * - 디자인 토큰만 사용. 인라인 스타일 0건. 자체 모달 X.
 *
 * 백엔드 응답 형태:
 *  - `/history`: Spring `Page` (`content`, `totalElements`, `number`, `totalPages`) 또는
 *    표준 envelope `{ success, data: { content: [...] } }`
 *  - `/batches/{batchId}`: `BulkNotificationResponse`
 *
 * 참조:
 *  - docs/project-management/2026-05-23/MANUAL_NOTIFICATION_DESIGN_HANDOFF.md §4
 *
 * @author MindGarden
 * @since 2026-05-23
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import MGButton from '../../common/MGButton';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  normalizeSpringPageRows,
  pickSpringPageMeta,
  normalizeApiRecordPayload
} from '../../../constants/adminWebScaffold';
import {
  fetchHistory,
  fetchBatchDetail,
  normalizeBulkResponse,
  MANUAL_NOTIFICATION_HISTORY_DEFAULT_SIZE,
  MANUAL_NOTIFICATION_ERROR_CODES
} from '../../../api/admin/manualNotificationApi';
import './ManualNotificationBatchHistory.css';

const HISTORY_CLASS = 'mg-manual-notif-history';

/**
 * 히스토리 행 정규화 (Spring Page `content` 의 단일 요소).
 * @param {*} raw
 * @param {number} idx
 * @returns {object|null}
 */
const normalizeHistoryRow = (raw, idx) => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const batchId = raw.batchId != null ? String(raw.batchId) : `row-${idx}`;
  return {
    batchId,
    channel: toDisplayString(raw.channel, ''),
    startedAt: toDisplayString(raw.startedAt ?? raw.createdAt ?? raw.sentAt, ''),
    templateCode: toDisplayString(raw.templateCode, ''),
    reason: toDisplayString(raw.reason, ''),
    totalCount: Number(raw.totalCount ?? 0),
    successCount: Number(raw.successCount ?? 0),
    failureCount: Number(raw.failureCount ?? 0)
  };
};

const ManualNotificationBatchHistory = ({ refreshKey = 0 }) => {
  const { t } = useTranslation('admin');

  const [items, setItems] = useState([]);
  const [pageMeta, setPageMeta] = useState({
    totalElements: 0,
    number: 0,
    size: MANUAL_NOTIFICATION_HISTORY_DEFAULT_SIZE,
    totalPages: 0
  });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [expandedBatchId, setExpandedBatchId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailByBatch, setDetailByBatch] = useState({});

  const load = useCallback(async() => {
    setLoading(true);
    setError('');
    try {
      const raw = await fetchHistory({
        page,
        size: MANUAL_NOTIFICATION_HISTORY_DEFAULT_SIZE
      });
      const record = normalizeApiRecordPayload(raw) ?? raw;
      const rows = normalizeSpringPageRows(record)
        .map((row, idx) => normalizeHistoryRow(row, idx))
        .filter(Boolean);
      setItems(rows);
      setPageMeta(pickSpringPageMeta(record));
    } catch (err) {
      console.error('수동 발송 히스토리 로드 실패:', err);
      setError(err?.response?.data?.message
        || err?.message
        || t('manualNotification.errors.loadFailed', '데이터를 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  }, [page, t]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handleToggleDetail = useCallback(async(batchId) => {
    if (expandedBatchId === batchId) {
      setExpandedBatchId(null);
      setDetailError('');
      return;
    }
    setExpandedBatchId(batchId);
    setDetailError('');
    if (detailByBatch[batchId]) {
      return;
    }
    setDetailLoading(true);
    try {
      const raw = await fetchBatchDetail(batchId);
      const normalized = normalizeBulkResponse(raw);
      setDetailByBatch((prev) => ({
        ...prev,
        [batchId]: normalized
      }));
    } catch (err) {
      console.error('수동 발송 배치 상세 로드 실패:', err);
      setDetailError(err?.response?.data?.message
        || err?.message
        || t('manualNotification.history.detailError', '수신자 상세를 불러오지 못했습니다.'));
    } finally {
      setDetailLoading(false);
    }
  }, [expandedBatchId, detailByBatch, t]);

  const totalPages = Math.max(pageMeta.totalPages, 1);

  const renderDetail = (batchId) => {
    if (detailLoading && expandedBatchId === batchId && !detailByBatch[batchId]) {
      return (
        <p className={`${HISTORY_CLASS}__detail-empty`}>
          {t('manualNotification.history.detailLoading', '수신자 상세 불러오는 중...')}
        </p>
      );
    }
    if (detailError && expandedBatchId === batchId && !detailByBatch[batchId]) {
      return (
        <p className={`${HISTORY_CLASS}__detail-error`} role="alert">
          {detailError}
        </p>
      );
    }
    const detail = detailByBatch[batchId];
    if (!detail) {
      return null;
    }
    if (!Array.isArray(detail.results) || detail.results.length === 0) {
      return (
        <p className={`${HISTORY_CLASS}__detail-empty`}>
          {t('manualNotification.history.empty', '발송 이력이 없습니다.')}
        </p>
      );
    }
    return (
      <ul className={`${HISTORY_CLASS}__detail-list`}>
        {detail.results.map((row, idx) => {
          const code = row?.errorCode || '';
          const codeKey = code && Object.values(MANUAL_NOTIFICATION_ERROR_CODES).includes(code)
            ? `manualNotification.errors.${code}`
            : null;
          const fallbackMessage = toDisplayString(row?.errorMessage, '');
          const displayedMessage = codeKey ? t(codeKey, fallbackMessage) : fallbackMessage;
          const isSuccess = row?.success !== false;
          return (
            <li
              key={`${batchId}-row-${row?.userId ?? idx}`}
              className={`${HISTORY_CLASS}__detail-row${isSuccess ? '' : ` ${HISTORY_CLASS}__detail-row--failed`}`}
            >
              <div className={`${HISTORY_CLASS}__detail-row-main`}>
                <span className={`${HISTORY_CLASS}__detail-row-name`}>
                  {toDisplayString(row?.name, '이름 없음')}
                </span>
                <span className={`${HISTORY_CLASS}__detail-row-phone`}>
                  {toDisplayString(row?.phoneMasked, '번호 없음')}
                </span>
                <span
                  className={`${HISTORY_CLASS}__detail-row-status${isSuccess ? ` ${HISTORY_CLASS}__detail-row-status--ok` : ` ${HISTORY_CLASS}__detail-row-status--fail`}`}
                >
                  {isSuccess
                    ? t('manualNotification.result.statSuccess', { count: '', defaultValue: '성공' })
                    : t('manualNotification.result.statFailed', { count: '', defaultValue: '실패' })}
                </span>
              </div>
              <div className={`${HISTORY_CLASS}__detail-row-aux`}>
                <span className={`${HISTORY_CLASS}__detail-row-solapi`}>
                  {toDisplayString(row?.solapiGroupId, '-')}
                  {' / '}
                  {toDisplayString(row?.solapiMessageId, '-')}
                </span>
                {!isSuccess && (
                  <span className={`${HISTORY_CLASS}__detail-row-error`}>
                    {toDisplayString(code, '-')}
                    {displayedMessage && (
                      <>
                        {' · '}
                        {displayedMessage}
                      </>
                    )}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <section
      className={HISTORY_CLASS}
      aria-label={t('manualNotification.history.title', '배치 발송 히스토리')}
    >
      <header className={`${HISTORY_CLASS}__header`}>
        <div>
          <h3 className={`${HISTORY_CLASS}__title`}>
            {t('manualNotification.history.title', '배치 발송 히스토리')}
          </h3>
          <p className={`${HISTORY_CLASS}__subtitle`}>
            {t('manualNotification.history.subtitle', {
              size: MANUAL_NOTIFICATION_HISTORY_DEFAULT_SIZE,
              defaultValue: '최대 {{size}}건 (페이지당). 배치 ID 기준으로 그룹화되어 있습니다.'
            })}
          </p>
        </div>
        <MGButton
          type="button"
          variant="outline"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'sm',
            loading,
            className: `${HISTORY_CLASS}__refresh`
          })}
          loading={loading}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={load}
          aria-label={t('manualNotification.history.refresh', '새로고침')}
        >
          {t('manualNotification.history.refresh', '새로고침')}
        </MGButton>
      </header>

      {loading && items.length === 0 && (
        <p className={`${HISTORY_CLASS}__empty`}>
          {t('manualNotification.history.loading', '이력 불러오는 중...')}
        </p>
      )}

      {!loading && error && (
        <p className={`${HISTORY_CLASS}__error`} role="alert">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className={`${HISTORY_CLASS}__empty`}>
          {t('manualNotification.history.empty', '발송 이력이 없습니다.')}
        </p>
      )}

      {items.length > 0 && (
        <ul className={`${HISTORY_CLASS}__list`}>
          {items.map((item) => {
            const expanded = expandedBatchId === item.batchId;
            return (
              <li
                key={item.batchId}
                className={`${HISTORY_CLASS}__card${expanded ? ` ${HISTORY_CLASS}__card--expanded` : ''}`}
              >
                <div className={`${HISTORY_CLASS}__card-header`}>
                  <div className={`${HISTORY_CLASS}__card-meta`}>
                    <span className={`${HISTORY_CLASS}__card-batch`}>
                      <strong>{t('manualNotification.history.cardBatchId', '배치')}:</strong>{' '}
                      {toDisplayString(item.batchId, '-')}
                    </span>
                    <span className={`${HISTORY_CLASS}__card-channel`}>
                      <strong>{t('manualNotification.history.cardChannel', '채널')}:</strong>{' '}
                      {toDisplayString(item.channel, '-')}
                    </span>
                    <span className={`${HISTORY_CLASS}__card-started`}>
                      <strong>{t('manualNotification.history.cardStartedAt', '발송 시각')}:</strong>{' '}
                      {toDisplayString(item.startedAt, '-')}
                    </span>
                  </div>
                  <div className={`${HISTORY_CLASS}__card-stats`}>
                    {t('manualNotification.history.cardStats', {
                      success: item.successCount,
                      failed: item.failureCount,
                      total: item.totalCount,
                      defaultValue: '성공 {{success}} / 실패 {{failed}} / 전체 {{total}}'
                    })}
                  </div>
                </div>
                <div className={`${HISTORY_CLASS}__card-reason`}>
                  <strong>{t('manualNotification.history.cardReason', '사유')}:</strong>{' '}
                  {toDisplayString(item.reason, '-')}
                </div>
                <div className={`${HISTORY_CLASS}__card-actions`}>
                  <MGButton
                    type="button"
                    variant="outline"
                    size="small"
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'sm',
                      loading: false,
                      className: `${HISTORY_CLASS}__detail-toggle`
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => handleToggleDetail(item.batchId)}
                    aria-expanded={expanded}
                  >
                    {expanded
                      ? t('manualNotification.history.closeDetail', '상세 닫기')
                      : t('manualNotification.history.openDetail', '수신자 상세 보기')}
                  </MGButton>
                </div>
                {expanded && (
                  <div className={`${HISTORY_CLASS}__detail`}>
                    {renderDetail(item.batchId)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {pageMeta.totalPages > 1 && (
        <nav className={`${HISTORY_CLASS}__pagination`} aria-label="페이지">
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            disabled={page <= 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            {t('manualNotification.history.pagePrev', '이전')}
          </MGButton>
          <span className={`${HISTORY_CLASS}__page-indicator`}>
            {t('manualNotification.history.pageIndicator', {
              current: page + 1,
              total: totalPages,
              defaultValue: '{{current}} / {{total}}'
            })}
          </span>
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            disabled={page + 1 >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            {t('manualNotification.history.pageNext', '다음')}
          </MGButton>
        </nav>
      )}
    </section>
  );
};

export default ManualNotificationBatchHistory;
