import React from 'react';
import './ErpFilterToolbar.css';

/**
 * ERP 화면용 필터·툴바 레이아웃 래퍼 (표시 전용, 상태는 부모에서 관리).
 *
 * @param {React.ReactNode} primaryRow 첫 줄(기간·뱃지 등)
 * @param {React.ReactNode} secondaryRow 둘째 줄(검색·액션)
 * @param {React.ReactNode} [expandedSlot] 고급 필터 등 확장 영역
 * @param {string} [ariaLabel] region 레이블 (기본: 거래 필터)
 * @author CoreSolution
 * @since 2026-04-09
 */
const ErpFilterToolbar = ({
  primaryRow,
  secondaryRow,
  expandedSlot,
  ariaLabel = '거래 필터'
}) => {
  return (
    <section className="mg-v2-erp-filter-toolbar" aria-label={ariaLabel}>
      {primaryRow ? (
        <div className="mg-v2-erp-filter-toolbar__primary">
          {primaryRow}
        </div>
      ) : null}
      {secondaryRow ? (
        <div className="mg-v2-erp-filter-toolbar__secondary">
          {secondaryRow}
        </div>
      ) : null}
      {expandedSlot ? (
        <div className="mg-v2-erp-filter-toolbar__expanded">
          {expandedSlot}
        </div>
      ) : null}
    </section>
  );
};

export default ErpFilterToolbar;
