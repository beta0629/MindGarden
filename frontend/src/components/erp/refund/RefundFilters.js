// 현재 앱 라우트에서 미사용일 수 있으나 ErpFilterToolbar 패턴 SSOT 유지용으로 보관합니다.
import React from 'react';
import { RefreshCw, Download } from 'lucide-react';
import CardContainer from '../../common/CardContainer';
import { ErpFilterToolbar } from '../common';
import { toDisplayString } from '../../../utils/safeDisplay';
import './RefundFilters.css';

const PERIOD_OPTIONS = [
  { value: 'today', label: '오늘' },
  { value: 'week', label: '최근 7일' },
  { value: 'month', label: '최근 1개월' },
  { value: 'quarter', label: '최근 3개월' },
  { value: 'year', label: '최근 1년' }
];

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'completed', label: '완료' },
  { value: 'pending', label: '대기' },
  { value: 'failed', label: '실패' }
];

/**
 * 환불 필터 및 제어 컴포넌트
 */
const RefundFilters = ({
  selectedPeriod,
  selectedStatus,
  onPeriodChange,
  onStatusChange,
  onRefresh,
  onExportExcel
}) => {
  return (
    <section className="mg-v2-erp-refund-panel" aria-labelledby="refund-filters-title">
      <CardContainer className="mg-v2-erp-refund-panel__card">
        <h3 id="refund-filters-title" className="mg-h4">
          필터 및 제어
        </h3>
        <div className="mg-v2-card-body">
          <ErpFilterToolbar
            ariaLabel="환불 조회 필터"
            primaryRow={(
              <fieldset
                className="refund-filters__fieldset"
                aria-labelledby="refund-filters-legend"
              >
                <legend id="refund-filters-legend" className="sr-only">
                  환불 조회 필터
                </legend>
                <div className="refund-filters__field mg-v2-form-group">
                  <label htmlFor="refund-filter-period" className="mg-v2-form-label">
                    기간
                  </label>
                  <select
                    id="refund-filter-period"
                    className="mg-v2-select"
                    name="period"
                    value={selectedPeriod}
                    onChange={(e) => onPeriodChange(e.target.value)}
                    aria-label="조회 기간"
                  >
                    {PERIOD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {toDisplayString(opt.label)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="refund-filters__field mg-v2-form-group">
                  <label htmlFor="refund-filter-status" className="mg-v2-form-label">
                    상태
                  </label>
                  <select
                    id="refund-filter-status"
                    className="mg-v2-select"
                    name="status"
                    value={selectedStatus}
                    onChange={(e) => onStatusChange(e.target.value)}
                    aria-label="환불 상태"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {toDisplayString(opt.label)}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>
            )}
            secondaryRow={(
              <div className="refund-filters__actions mg-v2-card-actions">
                <button
                  type="button"
                  className="mg-v2-button mg-v2-button--secondary"
                  onClick={onRefresh}
                  aria-label="새로고침"
                >
                  <RefreshCw size={16} aria-hidden />
                  새로고침
                </button>
                <button
                  type="button"
                  className="mg-v2-button mg-v2-button--secondary"
                  onClick={onExportExcel}
                  aria-label="엑셀 내보내기"
                >
                  <Download size={16} aria-hidden />
                  엑셀 내보내기
                </button>
              </div>
            )}
          />
        </div>
      </CardContainer>
    </section>
  );
};

export default RefundFilters;
