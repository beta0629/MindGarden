/**
 * ContentKpiRow - B0KlA KPI 카드 행
 * mindgarden-design-system.pen B0KlA kpiRow 스펙
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import MGButton from '../../common/MGButton';
import { toDisplayString } from '../../../utils/safeDisplay';
import './ContentKpiRow.css';

/** KPI 텍스트/숫자·객체 혼재 시 React #130 방지 */
function safeKpiChild(value) {
  if (value == null) return '—';
  if (React.isValidElement(value)) return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return value;
  return toDisplayString(value, '—');
}

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
                <span className="mg-v2-content-kpi-card__label">{safeKpiChild(item.label)}</span>
                {item.badge != null && (
                  <span
                    className={`mg-v2-content-kpi-card__badge mg-v2-content-kpi-card__badge--${item.badgeVariant || 'green'}`}
                    title={item.badgeTitle ?? undefined}
                  >
                    {safeKpiChild(item.badge)}
                  </span>
                )}
              </div>
              <span className="mg-v2-content-kpi-card__value">{safeKpiChild(item.value)}</span>
              {(item.subtitle != null && item.subtitle !== '') || item.subtitleBadge != null ? (
                <div className="mg-v2-content-kpi-card__subtitle-row">
                  {item.subtitle != null && item.subtitle !== '' && (
                    <span className="mg-v2-content-kpi-card__subtitle">{safeKpiChild(item.subtitle)}</span>
                  )}
                  {item.subtitleBadge != null && (
                    <span className={`mg-v2-content-kpi-card__subtitle-badge mg-v2-content-kpi-card__subtitle-badge--${item.badgeVariant || 'green'}`}>
                      {safeKpiChild(item.subtitleBadge)}
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          </>
        );
        const hasClick = typeof item.onClick === 'function';
        const accentClass = `mg-v2-content-kpi-card--accent-${iconVariant}`;
        const cardClassName = `mg-v2-content-kpi-card ${accentClass}`;
        if (hasClick) {
          return (
            <MGButton
              key={item.id || idx}
              type="button"
              variant="primary"
              size="medium"
              className={`${cardClassName} mg-v2-content-kpi-card--clickable`}
              onClick={item.onClick}
              preventDoubleClick={false}
            >
              {cardContent}
            </MGButton>
          );
        }
        return (
          <div key={item.id || idx} className={cardClassName}>
            {cardContent}
          </div>
        );
      })}
    </div>
  );
};

export default ContentKpiRow;
