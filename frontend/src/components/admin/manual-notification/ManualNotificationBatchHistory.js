/**
 * 수동 발송 배치 히스토리 (Organism).
 *
 * - `GET /api/v1/admin/manual-notifications/history` 페이지네이션 조회
 * - batchId 기준 표(ListTableView, 1행 = 1배치) + 펼친 배치의 수신자 표
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
import { SettingsButton, SettingsNotice, SettingsSectionPanel } from '../settings-shell';
import ListTableView from '../../common/ListTableView';
import StatusBadge from '../../common/StatusBadge';
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

/**
 * 채널 enum(BulkNotificationResponse.channel) → 디스플레이 라벨 매핑.
 * 디자인 토큰 SSOT 정책에 따라 한국어 라벨은 i18n 키에서만 가져온다.
 *
 * @param {string} rawChannel
 * @param {(key:string, options?: any)=>string} t
 * @returns {string}
 */
const formatChannelLabel = (rawChannel, t) => {
  const upper = String(rawChannel || '').toUpperCase();
  if (upper === 'PUSH') {
    return t('manualNotification.history.channel.push');
  }
  if (upper === 'ALIMTALK') {
    return t('manualNotification.history.channel.alimtalk');
  }
  if (upper === 'SMS') {
    return t('manualNotification.history.channel.sms', 'SMS');
  }
  return toDisplayString(rawChannel, '-');
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
        || t('manualNotification.errors.loadFailed'));
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
        || t('manualNotification.history.detailError'));
    } finally {
      setDetailLoading(false);
    }
  }, [expandedBatchId, detailByBatch, t]);

  const totalPages = Math.max(pageMeta.totalPages, 1);

  const batchColumns = [
    { key: 'batchId', label: t('manualNotification.history.cardBatchId'), hideOnMobile: true },
    { key: 'channel', label: t('manualNotification.history.cardChannel') },
    { key: 'startedAt', label: t('manualNotification.history.cardStartedAt') },
    { key: 'stats', label: t('manualNotification.result.title') },
    { key: 'reason', label: t('manualNotification.history.cardReason'), hideOnMobile: true },
    { key: 'action', label: t('manualNotification.history.openDetail') }
  ];

  const recipientColumns = [
    { key: 'recipient', label: t('manualNotification.result.columnRecipient') },
    { key: 'status', label: t('manualNotification.result.title') },
    { key: 'solapi', label: t('manualNotification.result.columnSolapiId'), hideOnMobile: true },
    { key: 'error', label: t('manualNotification.result.columnErrorMessage') }
  ];

  const renderBatchCell = (key, item) => {
    switch (key) {
      case 'batchId':
        return <span className="mg-v2-settings-mono">{toDisplayString(item.batchId, '-')}</span>;
      case 'channel':
        return formatChannelLabel(item.channel, t);
      case 'startedAt':
        return toDisplayString(item.startedAt, '-');
      case 'stats':
        return t('manualNotification.history.cardStats', {
          success: item.successCount,
          failed: item.failureCount,
          total: item.totalCount,
          defaultValue: '성공 {{success}} / 실패 {{failed}} / 전체 {{total}}'
        });
      case 'reason':
        return toDisplayString(item.reason, '-');
      case 'action': {
        const expanded = expandedBatchId === item.batchId;
        return (
          <SettingsButton
            type="button"
            variant="ghost"
            preventDoubleClick
            onClick={() => handleToggleDetail(item.batchId)}
            aria-expanded={expanded}
          >
            {expanded
              ? t('manualNotification.history.closeDetail')
              : t('manualNotification.history.openDetail')}
          </SettingsButton>
        );
      }
      default:
        return null;
    }
  };

  const renderRecipientCell = (key, row) => {
    const isSuccess = row?.success !== false;
    switch (key) {
      case 'recipient':
        return (
          <span className="mg-v2-settings-table__cell-stack">
            <strong>{toDisplayString(row?.name, '이름 없음')}</strong>
            <span className="mg-v2-settings-muted">{toDisplayString(row?.phoneMasked, '번호 없음')}</span>
          </span>
        );
      case 'status':
        return (
          <StatusBadge variant={isSuccess ? 'success' : 'danger'}>
            {isSuccess
              ? t('manualNotification.result.statSuccess', { count: '', defaultValue: '성공' })
              : t('manualNotification.result.statFailed', { count: '', defaultValue: '실패' })}
          </StatusBadge>
        );
      case 'solapi':
        return (
          <span className="mg-v2-settings-mono">
            {toDisplayString(row?.solapiGroupId, '-')}
            {' / '}
            {toDisplayString(row?.solapiMessageId, '-')}
          </span>
        );
      case 'error': {
        if (isSuccess) {
          return '-';
        }
        const code = row?.errorCode || '';
        const codeKey = code && Object.values(MANUAL_NOTIFICATION_ERROR_CODES).includes(code)
          ? `manualNotification.errors.${code}`
          : null;
        const fallbackMessage = toDisplayString(row?.errorMessage, '');
        const displayedMessage = codeKey ? t(codeKey, fallbackMessage) : fallbackMessage;
        return (
          <span className="mg-v2-settings-text--danger">
            {toDisplayString(code, '-')}
            {displayedMessage ? ` · ${displayedMessage}` : null}
          </span>
        );
      }
      default:
        return null;
    }
  };

  const renderDetail = (batchId) => {
    if (detailLoading && expandedBatchId === batchId && !detailByBatch[batchId]) {
      return <p className="mg-v2-settings-muted">{t('manualNotification.history.detailLoading')}</p>;
    }
    if (detailError && expandedBatchId === batchId && !detailByBatch[batchId]) {
      return <SettingsNotice tone="danger">{detailError}</SettingsNotice>;
    }
    const detail = detailByBatch[batchId];
    if (!detail) {
      return null;
    }
    if (!Array.isArray(detail.results) || detail.results.length === 0) {
      return <p className="mg-v2-settings-muted">{t('manualNotification.history.empty')}</p>;
    }
    const rows = detail.results.map((row, idx) => ({
      ...row,
      rowKey: `${batchId}-row-${row?.userId ?? idx}`
    }));
    return (
      <div className={`mg-v2-settings-table ${HISTORY_CLASS}__detail-table`}>
        <ListTableView
          columns={recipientColumns}
          data={rows}
          renderCell={renderRecipientCell}
          rowKeyField="rowKey"
        />
      </div>
    );
  };

  const expandedItem = items.find((item) => item.batchId === expandedBatchId);

  return (
    <SettingsSectionPanel
      className={HISTORY_CLASS}
      body="plain"
      headingLevel={3}
      title={t('manualNotification.history.title')}
      description={t('manualNotification.history.subtitle', {
        size: MANUAL_NOTIFICATION_HISTORY_DEFAULT_SIZE,
        defaultValue: '최대 {{size}}건 (페이지당). 배치 ID 기준으로 그룹화되어 있습니다.'
      })}
      actions={(
        <SettingsButton
          type="button"
          variant="outline"
          preventDoubleClick
          loading={loading}
          onClick={load}
          aria-label={t('manualNotification.history.refresh')}
        >
          {t('manualNotification.history.refresh')}
        </SettingsButton>
      )}
    >
      {loading && items.length === 0 && (
        <p className="mg-v2-settings-muted">{t('manualNotification.history.loading')}</p>
      )}

      {!loading && error && <SettingsNotice tone="danger">{error}</SettingsNotice>}

      {!loading && !error && items.length === 0 && (
        <p className="mg-v2-settings-muted">{t('manualNotification.history.empty')}</p>
      )}

      {items.length > 0 && (
        <div className="mg-v2-settings-table">
          <ListTableView
            columns={batchColumns}
            data={items}
            renderCell={renderBatchCell}
            rowKeyField="batchId"
          />
        </div>
      )}

      {expandedItem && (
        <section className={`${HISTORY_CLASS}__detail`} aria-live="polite">
          <h4 className="mg-v2-settings-subheading">
            {`${t('manualNotification.history.cardBatchId')} ${toDisplayString(expandedItem.batchId, '-')}`}
          </h4>
          {renderDetail(expandedItem.batchId)}
        </section>
      )}

      {pageMeta.totalPages > 1 && (
        <nav className={`${HISTORY_CLASS}__pagination`} aria-label="페이지">
          <SettingsButton
            type="button"
            variant="outline"
            preventDoubleClick
            disabled={page <= 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            {t('manualNotification.history.pagePrev')}
          </SettingsButton>
          <span className={`${HISTORY_CLASS}__page-indicator`}>
            {t('manualNotification.history.pageIndicator', {
              current: page + 1,
              total: totalPages,
              defaultValue: '{{current}} / {{total}}'
            })}
          </span>
          <SettingsButton
            type="button"
            variant="outline"
            preventDoubleClick
            disabled={page + 1 >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            {t('manualNotification.history.pageNext')}
          </SettingsButton>
        </nav>
      )}
    </SettingsSectionPanel>
  );
};

export default ManualNotificationBatchHistory;
