/**
 * 환불 필터 + 제어 블록 (Organism)
 * 기간·상태 선택, 새로고침, 엑셀, 선택 건 ERP 환불 반영
 *
 * @author CoreSolution
 * @since 2025-03-16
 */

import React from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { toDisplayString } from '../../../utils/safeDisplay';

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

const RefundFilterBlock = ({
  selectedPeriod,
  selectedStatus,
  onPeriodChange,
  onStatusChange,
  onRefresh,
  onExportExcel,
  onBatchReflectErp,
  selectedRowIds = [],
  isLoadingReflect = false
}) => {
  const hasSelection = Array.isArray(selectedRowIds) && selectedRowIds.length > 0;

  return (
    <section
      className="refund-management__filter-block"
      aria-labelledby="refund-filter-block-heading"
    >
      <h2 id="refund-filter-block-heading" className="sr-only">
        조회 조건 및 액션
      </h2>
      <div className="refund-management__filter-row">
        <fieldset
          className="refund-management__filter-fieldset"
          aria-labelledby="refund-filter-legend"
        >
          <legend id="refund-filter-legend" className="sr-only">
            환불 조회 필터
          </legend>
          <div className="refund-management__filter-field mg-v2-form-group">
            <label htmlFor="refund-period" className="mg-v2-form-label">
              기간
            </label>
            <select
              id="refund-period"
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
          <div className="refund-management__filter-field mg-v2-form-group">
            <label htmlFor="refund-status" className="mg-v2-form-label">
              상태
            </label>
            <select
              id="refund-status"
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
        <div className="refund-management__filter-actions mg-v2-card-actions">
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
          <button
            type="button"
            className="mg-v2-button mg-v2-button--outline"
            onClick={onBatchReflectErp}
            disabled={!hasSelection || isLoadingReflect}
            aria-label="선택 건 ERP 환불 반영"
          >
            선택 건 ERP 환불 반영
          </button>
        </div>
      </div>
    </section>
  );
};

export default RefundFilterBlock;
