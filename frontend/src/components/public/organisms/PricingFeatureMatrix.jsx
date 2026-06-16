/**
 * PricingFeatureMatrix — 기능 비교 표 Organism
 *
 * 데스크탑(≥768px): 4열 Sticky 헤더 테이블 (Feature / Basic / Pro / Enterprise)
 * 모바일(<768px): 카테고리별 Accordion 자동 변환
 *
 * 가격은 본 Organism에서 다루지 않음 (PricingCard 영역).
 * 기능 비교만 담당. 기능 텍스트는 외부 props로 주입 (운영팀 슬롯 정합).
 *
 * mg-v2-* 토큰 한정. CSS-only 반응형 전환.
 *
 * @author CoreSolution
 * @since 2026-06-15
 */

import React, { useState, useCallback, useId } from 'react';
import PropTypes from 'prop-types';
import './PricingFeatureMatrix.css';

/* ================================================================
   INTERNAL: Desktop Table View
   ================================================================ */
function DesktopTableView({ plans, featureCategories }) {
  return (
    <div
      className="mg-v2-feature-matrix__table"
      role="table"
      aria-label="Feature comparison table"
      data-testid="feature-matrix-table"
    >
      <div className="mg-v2-feature-matrix__thead" role="rowgroup">
        <div className="mg-v2-feature-matrix__header-row" role="row">
          <span className="mg-v2-feature-matrix__header-cell" role="columnheader">
            Features
          </span>
          {plans.map((plan) => (
            <span
              key={plan.key}
              className="mg-v2-feature-matrix__header-cell"
              role="columnheader"
            >
              {plan.name}
            </span>
          ))}
        </div>
      </div>

      <div role="rowgroup">
        {featureCategories.map((category) => (
          <React.Fragment key={category.category}>
            <div className="mg-v2-feature-matrix__category-row" role="row">
              <span
                className="mg-v2-feature-matrix__category-cell"
                role="cell"
                colSpan={plans.length + 1}
              >
                {category.category}
              </span>
            </div>
            {category.features.map((feature) => (
              <div
                key={feature.name}
                className="mg-v2-feature-matrix__feature-row"
                role="row"
              >
                <span className="mg-v2-feature-matrix__feature-cell" role="cell">
                  {feature.name}
                </span>
                {plans.map((plan) => (
                  <span
                    key={plan.key}
                    className="mg-v2-feature-matrix__feature-cell"
                    role="cell"
                  >
                    <CellValue value={feature[plan.key]} />
                  </span>
                ))}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

DesktopTableView.propTypes = {
  plans: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  })).isRequired,
  featureCategories: PropTypes.array.isRequired,
};

/* ================================================================
   INTERNAL: Mobile Accordion View
   ================================================================ */
function MobileAccordionView({ plans, featureCategories }) {
  const [expandedPanels, setExpandedPanels] = useState({});
  const idPrefix = useId();

  const togglePanel = useCallback((categoryKey) => {
    setExpandedPanels((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  }, []);

  return (
    <div
      className="mg-v2-feature-matrix__accordion"
      role="region"
      aria-label="Feature comparison"
      data-testid="feature-matrix-accordion"
    >
      {featureCategories.map((category, catIdx) => {
        const panelId = `${idPrefix}-panel-${catIdx}`;
        const triggerId = `${idPrefix}-trigger-${catIdx}`;
        const isExpanded = !!expandedPanels[category.category];

        return (
          <div
            key={category.category}
            className="mg-v2-feature-matrix__accordion-panel"
          >
            <button
              id={triggerId}
              type="button"
              className="mg-v2-feature-matrix__accordion-trigger"
              aria-expanded={isExpanded}
              aria-controls={panelId}
              onClick={() => togglePanel(category.category)}
              data-testid={`accordion-trigger-${catIdx}`}
            >
              <span>{category.category}</span>
              <ChevronIcon expanded={isExpanded} />
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              className={`mg-v2-feature-matrix__accordion-content${
                isExpanded ? ' mg-v2-feature-matrix__accordion-content--expanded' : ''
              }`}
            >
              <ul className="mg-v2-feature-matrix__accordion-list">
                {category.features.map((feature) => (
                  <li
                    key={feature.name}
                    className="mg-v2-feature-matrix__accordion-item"
                  >
                    <div className="mg-v2-feature-matrix__accordion-feature-name">
                      {feature.name}
                    </div>
                    <div className="mg-v2-feature-matrix__accordion-badges">
                      {plans.map((plan) => (
                        <AccordionBadge
                          key={plan.key}
                          planName={plan.name}
                          value={feature[plan.key]}
                        />
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}

MobileAccordionView.propTypes = {
  plans: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  })).isRequired,
  featureCategories: PropTypes.array.isRequired,
};

/* ================================================================
   INTERNAL: Cell Value Renderer
   ================================================================ */
function CellValue({ value }) {
  if (value === true) {
    return (
      <span className="mg-v2-feature-matrix__check" aria-label="Included">
        ✓
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="mg-v2-feature-matrix__dash" aria-label="Not included">
        —
      </span>
    );
  }
  return (
    <span className="mg-v2-feature-matrix__text-value">
      {value}
    </span>
  );
}

CellValue.propTypes = {
  value: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]).isRequired,
};

/* ================================================================
   INTERNAL: Accordion Badge
   ================================================================ */
function AccordionBadge({ planName, value }) {
  let valueClass = 'mg-v2-feature-matrix__accordion-badge-value--excluded';
  let displayValue = '—';

  if (value === true) {
    valueClass = 'mg-v2-feature-matrix__accordion-badge-value--included';
    displayValue = '✓';
  } else if (value !== false) {
    valueClass = 'mg-v2-feature-matrix__accordion-badge-value--text';
    displayValue = value;
  }

  return (
    <span className="mg-v2-feature-matrix__accordion-badge">
      <span className="mg-v2-feature-matrix__accordion-badge-label">
        {planName}:
      </span>
      <span className={valueClass}>
        {displayValue}
      </span>
    </span>
  );
}

AccordionBadge.propTypes = {
  planName: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]).isRequired,
};

/* ================================================================
   INTERNAL: Chevron Icon
   ================================================================ */
function ChevronIcon({ expanded }) {
  return (
    <svg
      className={`mg-v2-feature-matrix__chevron${
        expanded ? ' mg-v2-feature-matrix__chevron--expanded' : ''
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

ChevronIcon.propTypes = {
  expanded: PropTypes.bool.isRequired,
};

/* ================================================================
   PUBLIC: PricingFeatureMatrix
   ================================================================ */

/**
 * PricingFeatureMatrix
 *
 * @param {Object} props
 * @param {Array<{key: string, name: string}>} props.plans - Plan 메타 배열 (Basic/Pro/Enterprise)
 * @param {Array<{category: string, features: Array}>} props.featureCategories - 카테고리 + 기능 목록
 * @param {number} [props.breakpointMobile=768] - 모바일 전환 기준 (CSS @media 기반, 참조용)
 */
const PricingFeatureMatrix = ({ plans, featureCategories, breakpointMobile = 768 }) => {
  return (
    <section
      className="mg-v2-feature-matrix"
      data-testid="pricing-feature-matrix"
      data-breakpoint-mobile={breakpointMobile}
    >
      <DesktopTableView plans={plans} featureCategories={featureCategories} />
      <MobileAccordionView plans={plans} featureCategories={featureCategories} />
    </section>
  );
};

PricingFeatureMatrix.propTypes = {
  plans: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  featureCategories: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string.isRequired,
      features: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
        })
      ).isRequired,
    })
  ).isRequired,
  breakpointMobile: PropTypes.number,
};

export default PricingFeatureMatrix;
