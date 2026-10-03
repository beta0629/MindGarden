/**
 * §5. 호출 로그 테이블 + 필터 + 상세 모달 — 디자이너 §5.
 *
 * - 페이징, provider/caller/status 필터, 상세 모달 (UnifiedModal).
 *
 * @author MindGarden
 * @since 2026-05-24
 */
import React, { useCallback, useState } from 'react';
import { Eye, Filter, RefreshCw } from 'lucide-react';
import UnifiedModal from '../../../common/modals/UnifiedModal';
import SafeErrorDisplay from '../../../common/SafeErrorDisplay';
import EmptyState from '../../../common/EmptyState';
import ListTableView from '../../../common/ListTableView';
import StatusBadge from '../../../common/StatusBadge';
import { toDisplayString } from '../../../../utils/safeDisplay';
import { SettingsSectionPanel, SettingsButton } from '../../settings-shell';
import { getAiUsageLogDetail } from '../../../../api/admin/aiUsageApi';
import {
  AI_LOG_STATUS_OPTIONS,
  AI_USAGE_LOG_COLUMNS,
  AI_PROVIDER_LABELS,
  AI_PROVIDER_OPTIONS,
  PROVIDER_DISPLAY_LABEL
} from '../constants';

const PAGE_SIZE = 50;

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return toDisplayString(iso);
    return date.toLocaleString('ko-KR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return toDisplayString(iso);
  }
};

const UsageLogsTable = ({
  logsPage,
  loading,
  error,
  filters,
  callerOptions,
  onFiltersChange,
  onPageChange,
  onRefresh
}) => {
  const [detailLog, setDetailLog] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const handleFilterUpdate = useCallback((field, value) => {
    onFiltersChange({ ...filters, [field]: value, page: 0 });
  }, [filters, onFiltersChange]);

  const handleOpenDetail = useCallback(async(log) => {
    setDetailLog(null);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await getAiUsageLogDetail(log.id);
      setDetailLog(detail || log);
    } catch (e) {
      console.error('AI 사용 로그 상세 조회 실패:', e);
      setDetailError(e?.message || '상세 조회에 실패했습니다.');
      setDetailLog(log);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetailLog(null);
    setDetailError(null);
  }, []);

  const renderLogCell = (key, row) => {
    switch (key) {
      case 'createdAt':
        return formatDate(row.createdAt);
      case 'aiProvider':
        return (
          <span className="mg-ai-logs-table__provider">
            {toDisplayString(PROVIDER_DISPLAY_LABEL[row.aiProvider] || row.aiProvider)}
          </span>
        );
      case 'requestType':
        return toDisplayString(row.requestType);
      case 'model':
        return <span className="mg-ai-logs-table__model">{toDisplayString(row.model)}</span>;
      case 'status':
        return (
          <StatusBadge variant={row.status === 'failed' ? 'danger' : 'success'}>
            {row.status === 'failed' ? AI_PROVIDER_LABELS.logStatusFailed : AI_PROVIDER_LABELS.logStatusSuccess}
          </StatusBadge>
        );
      case 'durationMs':
        return row.durationMs ?? '—';
      case 'tokenCount':
        return row.tokenCount ?? '—';
      case 'errorMessage':
        return <span className="mg-ai-logs-table__error">{toDisplayString(row.errorMessage, '—')}</span>;
      case 'action':
        return (
          <SettingsButton
            type="button"
            variant="ghost"
            onClick={() => handleOpenDetail(row)}
            preventDoubleClick={false}
            aria-label={`로그 ${row.id} 상세`}
          >
            <Eye size={14} aria-hidden="true" />
          </SettingsButton>
        );
      default:
        return null;
    }
  };

  const content = logsPage?.content || [];
  const totalPages = logsPage?.totalPages ?? 0;
  const currentPage = logsPage?.number ?? 0;

  return (
    <SettingsSectionPanel
      title="호출 로그"
      className="mg-ai-section mg-ai-logs-table"
      body="plain"
      actions={(
        <SettingsButton
          type="button"
          variant="secondary"
          onClick={onRefresh}
          disabled={loading}
          loading={loading}
          loadingText="조회 중..."
          preventDoubleClick={false}
        >
          <RefreshCw size={14} aria-hidden="true" />
          {' '}새로고침
        </SettingsButton>
      )}
    >

      <div className="mg-ai-logs-table__filters mg-v2-settings-form-grid">
        <div className="mg-ai-logs-table__filter mg-v2-settings-field">
          <label htmlFor="ai-log-filter-provider" className="mg-v2-form-label">
            <Filter size={12} aria-hidden="true" />
            {' '}{AI_PROVIDER_LABELS.filterProvider}
          </label>
          <select
            id="ai-log-filter-provider"
            className="mg-v2-select"
            value={filters.provider || ''}
            onChange={(e) => handleFilterUpdate('provider', e.target.value)}
            disabled={loading}
          >
            <option value="">{AI_PROVIDER_LABELS.filterAll}</option>
            {AI_PROVIDER_OPTIONS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="mg-ai-logs-table__filter mg-v2-settings-field">
          <label htmlFor="ai-log-filter-caller" className="mg-v2-form-label">
            <Filter size={12} aria-hidden="true" />
            {' '}{AI_PROVIDER_LABELS.filterCaller}
          </label>
          <select
            id="ai-log-filter-caller"
            className="mg-v2-select"
            value={filters.caller || ''}
            onChange={(e) => handleFilterUpdate('caller', e.target.value)}
            disabled={loading}
          >
            <option value="">{AI_PROVIDER_LABELS.filterAll}</option>
            {callerOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="mg-ai-logs-table__filter mg-v2-settings-field">
          <label htmlFor="ai-log-filter-status" className="mg-v2-form-label">
            <Filter size={12} aria-hidden="true" />
            {' '}{AI_PROVIDER_LABELS.filterStatus}
          </label>
          <select
            id="ai-log-filter-status"
            className="mg-v2-select"
            value={filters.status || ''}
            onChange={(e) => handleFilterUpdate('status', e.target.value)}
            disabled={loading}
          >
            {AI_LOG_STATUS_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <SafeErrorDisplay error={toDisplayString(error)} />
      ) : null}

      {content.length === 0 && !loading ? (
        <EmptyState className="mg-ai-logs-table__empty" description={AI_PROVIDER_LABELS.emptyStateNoLogs} />
      ) : (
        <div className="mg-v2-settings-table">
          <ListTableView
            columns={AI_USAGE_LOG_COLUMNS}
            data={content}
            renderCell={renderLogCell}
          />
        </div>
      )}

      <div className="mg-ai-logs-table__pagination">
        <span className="mg-ai-logs-table__page-info">
          {totalPages > 0
            ? `${currentPage + 1} / ${totalPages} 페이지`
            : '0 / 0 페이지'}
        </span>
        <div className="mg-ai-logs-table__page-controls">
          <SettingsButton
            type="button"
            variant="secondary"
            onClick={() => onPageChange(Math.max(currentPage - 1, 0))}
            disabled={loading || currentPage <= 0}
            preventDoubleClick={false}
          >
            {AI_PROVIDER_LABELS.pagePrev}
          </SettingsButton>
          <SettingsButton
            type="button"
            variant="secondary"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={loading || currentPage + 1 >= totalPages}
            preventDoubleClick={false}
          >
            {AI_PROVIDER_LABELS.pageNext}
          </SettingsButton>
        </div>
      </div>

      {detailLog ? (
        <UnifiedModal
          isOpen
          onClose={closeDetail}
          title={`로그 #${detailLog.id} 상세`}
          subtitle={`${PROVIDER_DISPLAY_LABEL[detailLog.aiProvider] || detailLog.aiProvider || ''} · ${detailLog.requestType || ''}`}
          size="medium"
          variant="detail"
          loading={detailLoading}
        >
          {detailError ? (
            <SafeErrorDisplay error={toDisplayString(detailError)} />
          ) : null}
          <dl className="mg-ai-logs-table__detail-list">
            <div>
              <dt>모델</dt>
              <dd>{toDisplayString(detailLog.model)}</dd>
            </div>
            <div>
              <dt>상태</dt>
              <dd>{detailLog.status === 'failed' ? AI_PROVIDER_LABELS.logStatusFailed : AI_PROVIDER_LABELS.logStatusSuccess}</dd>
            </div>
            <div>
              <dt>호출 시각</dt>
              <dd>{formatDate(detailLog.createdAt)}</dd>
            </div>
            <div>
              <dt>응답 시간(ms)</dt>
              <dd>{detailLog.durationMs ?? '—'}</dd>
            </div>
            <div>
              <dt>prompt / completion / total 토큰</dt>
              <dd>
                {`${detailLog.promptTokens ?? '—'} / ${detailLog.completionTokens ?? '—'} / ${detailLog.totalTokens ?? detailLog.tokenCount ?? '—'}`}
              </dd>
            </div>
            <div>
              <dt>예상 비용(USD)</dt>
              <dd>{detailLog.estimatedCost != null ? detailLog.estimatedCost.toFixed(6) : '—'}</dd>
            </div>
            <div>
              <dt>호출자(requestedBy)</dt>
              <dd>{toDisplayString(detailLog.requestedBy)}</dd>
            </div>
            {detailLog.errorMessage ? (
              <div className="mg-ai-logs-table__detail-error">
                <dt>에러 메시지</dt>
                <dd>
                  <pre className="mg-ai-logs-table__pre">{toDisplayString(detailLog.errorMessage)}</pre>
                </dd>
              </div>
            ) : null}
            <div className="mg-ai-logs-table__detail-body">
              <dt>{AI_PROVIDER_LABELS.detailPromptBody}</dt>
              <dd>
                {detailLog.promptBody ? (
                  <pre className="mg-ai-logs-table__pre">{toDisplayString(detailLog.promptBody)}</pre>
                ) : (
                  <span className="mg-ai-logs-table__detail-empty">{AI_PROVIDER_LABELS.detailBodyEmpty}</span>
                )}
              </dd>
            </div>
            <div className="mg-ai-logs-table__detail-body">
              <dt>{AI_PROVIDER_LABELS.detailResponseBody}</dt>
              <dd>
                {detailLog.responseBody ? (
                  <pre className="mg-ai-logs-table__pre">{toDisplayString(detailLog.responseBody)}</pre>
                ) : (
                  <span className="mg-ai-logs-table__detail-empty">
                    {detailLog.status === 'failed'
                      ? AI_PROVIDER_LABELS.detailBodyNotApplicable
                      : AI_PROVIDER_LABELS.detailBodyEmpty}
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </UnifiedModal>
      ) : null}
    </SettingsSectionPanel>
  );
};

UsageLogsTable.DEFAULT_PAGE_SIZE = PAGE_SIZE;

export default UsageLogsTable;
