/**
 * MappingKpiSection — Clinic-OS 3-cell summary strip
 * Visual SSOT: IntegratedScheduleSummaryStrip / PurchaseSummaryStrip
 * (no icon tiles, no left accent bars)
 *
 * @author Core Solution
 * @since 2025-02-22
 * @updated 2026-09-04 — Clinic-OS chrome (icon KPI wells 제거)
 */

import React from 'react';
import PropTypes from 'prop-types';
import KpiNumeral from '../../../dashboard-v2/atoms/KpiNumeral';
import SafeText from '../../../common/SafeText';
import './MappingKpiSection.css';

const UNIT_COUNT = '건';
const STRIP_ARIA = '매칭 요약';

const buildKpiItems = (mappings) => {
  const pending = mappings.filter((m) => m.status === 'PENDING_PAYMENT').length;
  const active = mappings.filter((m) => m.status === 'ACTIVE').length;
  const total = mappings.length;

  return [
    {
      id: 'TOTAL',
      label: '전체',
      value: total,
      count: total,
      action: 'view_all'
    },
    {
      id: 'ACTIVE',
      label: '활성 매칭',
      value: active,
      count: active,
      action: 'view'
    },
    {
      id: 'PENDING_PAYMENT',
      label: '결제 대기',
      value: pending,
      count: pending,
      action: 'payment'
    }
  ];
};

const MappingKpiSection = ({ mappings = [], onStatCardClick }) => {
  const items = buildKpiItems(mappings);

  return (
    <section
      className="mg-v2-mapping-kpi-section mapping-management-summary"
      data-testid="mapping-management-summary"
      aria-label={STRIP_ARIA}
    >
      {items.map((item) => (
        <article
          key={item.id}
          className="mapping-management-summary__cell"
        >
          <button
            type="button"
            className="mapping-management-summary__hit"
            onClick={() => onStatCardClick && onStatCardClick(item)}
          >
            <p className="mapping-management-summary__label">
              <SafeText>{item.label}</SafeText>
            </p>
            <div
              className="mapping-management-summary__amount"
              data-testid={`mapping-summary-${item.id}`}
            >
              <KpiNumeral value={String(item.value)} unit={UNIT_COUNT} />
            </div>
          </button>
        </article>
      ))}
    </section>
  );
};

MappingKpiSection.propTypes = {
  mappings: PropTypes.array,
  onStatCardClick: PropTypes.func
};

export default MappingKpiSection;
