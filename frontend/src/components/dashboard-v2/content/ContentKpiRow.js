/**
 * ContentKpiRow - B0KlA KPI 카드 행
 * mindgarden-design-system.pen B0KlA kpiRow 스펙
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import './ContentKpiRow.css';

const ICON_VARIANTS = ['green', 'orange', 'blue', 'gray'];

const ContentKpiRow = ({ items = [] }) => {
  return (
    <div className="mg-v2-content-kpi-row">
      {items.map((item, idx) => {
        const iconVariant = item.iconVariant || ICON_VARIANTS[idx % ICON_VARIANTS.length];
        const cardContent = (
          <>
            <div className={`mg-v2-content-kpi-card__icon mg-v2-content-kpi-card__icon--${iconVariant}`}>
              {item.icon}
            </div>
            <div className="mg-v2-content-kpi-card__info">
              <div className="mg-v2-content-kpi-card__top">
                <span className="mg-v2-content-kpi-card__label">{item.label}</span>
                {item.badge != null && (
                  <span className={`mg-v2-content-kpi-card__badge mg-v2-content-kpi-card__badge--${item.badgeVariant || 'green'}`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="mg-v2-content-kpi-card__value">{item.value}</span>
              {(item.subtitle != null && item.subtitle !== '') || item.subtitleBadge != null ? (
                <div className="mg-v2-content-kpi-card__subtitle-row">
                  {item.subtitle != null && item.subtitle !== '' && (
                    <span className="mg-v2-content-kpi-card__subtitle">{item.subtitle}</span>
                  )}
                  {item.subtitleBadge != null && (
                    <span className={`mg-v2-content-kpi-card__subtitle-badge mg-v2-content-kpi-card__subtitle-badge--${item.badgeVariant || 'green'}`}>
                      {item.subtitleBadge}
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          </>
        );
        const hasClick = typeof item.onClick === 'function';
        if (hasClick) {
          return (
            <button
              key={item.id || idx}
              type="button"
              className="mg-v2-content-kpi-card mg-v2-content-kpi-card--clickable"
              onClick={item.onClick}
            >
              {cardContent}
            </button>
          );
        }
        return (
          <div key={item.id || idx} className="mg-v2-content-kpi-card">
            {cardContent}
          </div>
        );
      })}
    </div>
  );
};

export default ContentKpiRow;
