/**
 * ContentKpiRow - B0KlA KPI 카드 행
 * mindgarden-design-system.pen B0KlA kpiRow 스펙
 * Dashboard KPI Zone pilot: 좌측 악센트 바 + 선택적 스파크라인
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../utils/safeDisplay';
import KpiSparkline from '../atoms/KpiSparkline';
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

const ContentKpiRow = ({ items = [], loading = false, className = '', ariaLabel = '핵심 지표' }) => {
  const rowClassName = ['mg-v2-content-kpi-row', className].filter(Boolean).join(' ');

  return (
    <div
      className={rowClassName}
      role="list"
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      data-testid="content-kpi-row"
    >
      {items.map((item, idx) => {
        const iconVariant = item.iconVariant || ICON_VARIANTS[idx % ICON_VARIANTS.length];
        const iconEl = (
          <div className={`mg-v2-content-kpi-card__icon mg-v2-content-kpi-card__icon--${iconVariant}`}>
            {item.icon}
          </div>
        );
        const trendAriaLabel = item.trendAriaLabel;
        const infoEl = (
          <div className="mg-v2-content-kpi-card__info">
            <div className="mg-v2-content-kpi-card__top">
              <span className="mg-v2-content-kpi-card__label">{safeKpiChild(item.label)}</span>
              {item.badge != null && (
                <span
                  className={`mg-v2-content-kpi-card__badge mg-v2-content-kpi-card__badge--${item.badgeVariant || 'green'}`}
                  title={item.badgeTitle ?? undefined}
                  aria-label={trendAriaLabel || undefined}
                >
                  {safeKpiChild(item.badge)}
                </span>
              )}
            </div>
            <span className="mg-v2-content-kpi-card__value">
              {loading ? '…' : safeKpiChild(item.value)}
            </span>
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
            {!loading && Array.isArray(item.sparklineData) && item.sparklineData.length > 0 ? (
              <KpiSparkline data={item.sparklineData} variant={iconVariant} />
            ) : null}
            {trendAriaLabel ? (
              <span className="sr-only">{trendAriaLabel}</span>
            ) : null}
          </div>
        );
        const hasClick = typeof item.onClick === 'function';
        const accentClass = `mg-v2-content-kpi-card--accent-${iconVariant}`;
        const cardClassName = [
          'mg-v2-content-kpi-card',
          accentClass,
          loading ? 'mg-v2-content-kpi-card--loading' : ''
        ].filter(Boolean).join(' ');
        if (hasClick) {
          return (
            <div
              key={item.id || idx}
              className={`${cardClassName} mg-v2-content-kpi-card--clickable-split`}
              role="listitem"
            >
              <div className="mg-v2-content-kpi-card__accent" aria-hidden="true" />
              {iconEl}
              <MGButton
                type="button"
                variant="primary"
                size="medium"
                className={buildErpMgButtonClassName({
                  variant: 'primary',
                  size: 'md',
                  loading: false,
                  className: 'mg-v2-content-kpi-card__click-target'
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={item.onClick}
                preventDoubleClick={false}
              >
                {infoEl}
              </MGButton>
            </div>
          );
        }
        return (
          <div key={item.id || idx} className={cardClassName} role="listitem">
            <div className="mg-v2-content-kpi-card__accent" aria-hidden="true" />
            {iconEl}
            {infoEl}
          </div>
        );
      })}
    </div>
  );
};

export default ContentKpiRow;
