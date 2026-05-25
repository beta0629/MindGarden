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
import MGButton from '../../../common/MGButton';
import UnifiedModal from '../../../common/modals/UnifiedModal';
import { buildErpMgButtonClassName } from '../../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../../utils/safeDisplay';
import { getAiUsageLogDetail } from '../../../../api/admin/aiUsageApi';
import {
  AI_LOG_STATUS_OPTIONS,
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

  const content = logsPage?.content || [];
  const totalPages = logsPage?.totalPages ?? 0;
  const currentPage = logsPage?.number ?? 0;

  return (
    <section className="mg-ai-section mg-ai-logs-table">
      <header className="mg-ai-section__header">
        <h2 className="mg-ai-section__title">
          <span className="mg-ai-section__accent" aria-hidden="true" />
          호출 로그
        </h2>
        <MGButton
          type="button"
          variant="secondary"
          size="medium"
          className={buildErpMgButtonClassName({
            variant: 'secondary',
            size: 'md',
            loading
          })}
          onClick={onRefresh}
          disabled={loading}
          loading={loading}
          loadingText="조회 중..."
          preventDoubleClick={false}
        >
          <RefreshCw size={14} aria-hidden="true" />
          {' '}새로고침
        </MGButton>
      </header>

      <div className="mg-ai-logs-table__filters">
        <div className="mg-ai-logs-table__filter">
          <label htmlFor="ai-log-filter-provider">
            <Filter size={12} aria-hidden="true" />
            {' '}{AI_PROVIDER_LABELS.filterProvider}
          </label>
          <select
            id="ai-log-filter-provider"
            className="mg-v2-input"
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
        <div className="mg-ai-logs-table__filter">
          <label htmlFor="ai-log-filter-caller">
            <Filter size={12} aria-hidden="true" />
            {' '}{AI_PROVIDER_LABELS.filterCaller}
          </label>
          <select
            id="ai-log-filter-caller"
            className="mg-v2-input"
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
        <div className="mg-ai-logs-table__filter">
          <label htmlFor="ai-log-filter-status">
            <Filter size={12} aria-hidden="true" />
            {' '}{AI_PROVIDER_LABELS.filterStatus}
          </label>
          <select
            id="ai-log-filter-status"
            className="mg-v2-input"
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
        <p className="mg-ai-section__empty mg-ai-section__empty--error">{toDisplayString(error)}</p>
      ) : null}

      <div className="mg-ai-logs-table__wrap">
        <table className="mg-ai-logs-table__table">
          <thead>
            <tr>
              <th scope="col">시간</th>
              <th scope="col">프로바이더</th>
              <th scope="col">호출자</th>
              <th scope="col">모델</th>
              <th scope="col">상태</th>
              <th scope="col" className="mg-ai-logs-table__col-numeric">응답(ms)</th>
              <th scope="col" className="mg-ai-logs-table__col-numeric">토큰</th>
              <th scope="col">에러</th>
              <th scope="col" className="mg-ai-logs-table__col-action">{AI_PROVIDER_LABELS.detail}</th>
            </tr>
          </thead>
          <tbody>
            {content.length === 0 && !loading ? (
              <tr>
                <td colSpan={9} className="mg-ai-logs-table__empty">{AI_PROVIDER_LABELS.emptyStateNoLogs}</td>
              </tr>
            ) : null}
            {content.map((row) => (
              <tr key={row.id}>
                <td>{formatDate(row.createdAt)}</td>
                <td>
                  <span className="mg-ai-logs-table__provider">
                    {toDisplayString(PROVIDER_DISPLAY_LABEL[row.aiProvider] || row.aiProvider)}
                  </span>
                </td>
                <td>{toDisplayString(row.requestType)}</td>
                <td className="mg-ai-logs-table__model">{toDisplayString(row.model)}</td>
                <td>
                  <span
                    className={[
                      'mg-ai-logs-table__status',
                      row.status === 'failed'
                        ? 'mg-ai-logs-table__status--failed'
                        : 'mg-ai-logs-table__status--success'
                    ].join(' ')}
                  >
                    {row.status === 'failed' ? '실패' : '성공'}
                  </span>
                </td>
                <td className="mg-ai-logs-table__col-numeric">{row.durationMs ?? '—'}</td>
                <td className="mg-ai-logs-table__col-numeric">{row.tokenCount ?? '—'}</td>
                <td className="mg-ai-logs-table__error">{toDisplayString(row.errorMessage, '—')}</td>
                <td className="mg-ai-logs-table__col-action">
                  <MGButton
                    type="button"
                    variant="ghost"
                    size="small"
                    className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
                    onClick={() => handleOpenDetail(row)}
                    preventDoubleClick={false}
                    aria-label={`로그 ${row.id} 상세`}
                  >
                    <Eye size={14} aria-hidden="true" />
                  </MGButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mg-ai-logs-table__pagination">
        <span className="mg-ai-logs-table__page-info">
          {totalPages > 0
            ? `${currentPage + 1} / ${totalPages} 페이지`
            : '0 / 0 페이지'}
        </span>
        <div className="mg-ai-logs-table__page-controls">
          <MGButton
            type="button"
            variant="secondary"
            size="medium"
            className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
            onClick={() => onPageChange(Math.max(currentPage - 1, 0))}
            disabled={loading || currentPage <= 0}
            preventDoubleClick={false}
          >
            {AI_PROVIDER_LABELS.pagePrev}
          </MGButton>
          <MGButton
            type="button"
            variant="secondary"
            size="medium"
            className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={loading || currentPage + 1 >= totalPages}
            preventDoubleClick={false}
          >
            {AI_PROVIDER_LABELS.pageNext}
          </MGButton>
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
            <p className="mg-ai-section__empty mg-ai-section__empty--error">{toDisplayString(detailError)}</p>
          ) : null}
          <dl className="mg-ai-logs-table__detail-list">
            <div>
              <dt>모델</dt>
              <dd>{toDisplayString(detailLog.model)}</dd>
            </div>
            <div>
              <dt>상태</dt>
              <dd>{detailLog.status === 'failed' ? '실패' : '성공'}</dd>
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
    </section>
  );
};

UsageLogsTable.DEFAULT_PAGE_SIZE = PAGE_SIZE;

export default UsageLogsTable;
