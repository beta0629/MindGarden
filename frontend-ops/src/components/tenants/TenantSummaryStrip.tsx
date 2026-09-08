'use client';

import {
  OPS_TENANT_CSS,
  OPS_TENANT_LABELS,
  OPS_TENANT_STRIP_FILTER,
  type OpsTenantStripFilter,
  toDisplayString
} from '@/constants/opsTenants';

/**
 * TenantSummaryStrip — strip3 전체 · 운영중 · 정지 (아이콘 타일 없음)
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

type TenantSummaryStripProps = {
  total: number;
  active: number;
  suspended: number;
  selected: OpsTenantStripFilter;
  loading?: boolean;
  onSelect: (filter: OpsTenantStripFilter) => void;
};

type StripCell = {
  id: OpsTenantStripFilter;
  label: string;
  value: number;
};

export default function TenantSummaryStrip({
  total,
  active,
  suspended,
  selected,
  loading = false,
  onSelect
}: TenantSummaryStripProps) {
  const cells: StripCell[] = [
    {
      id: OPS_TENANT_STRIP_FILTER.ALL,
      label: OPS_TENANT_LABELS.STRIP_ALL,
      value: total
    },
    {
      id: OPS_TENANT_STRIP_FILTER.ACTIVE,
      label: OPS_TENANT_LABELS.STRIP_ACTIVE,
      value: active
    },
    {
      id: OPS_TENANT_STRIP_FILTER.SUSPENDED,
      label: OPS_TENANT_LABELS.STRIP_SUSPENDED,
      value: suspended
    }
  ];

  return (
    <section
      className={OPS_TENANT_CSS.STRIP}
      data-testid="ops-tenants-summary"
      aria-label={OPS_TENANT_LABELS.STRIP_ARIA}
      aria-busy={loading}
    >
      {cells.map((cell) => {
        const isActive = selected === cell.id;
        return (
          <button
            key={cell.id}
            type="button"
            className={
              isActive
                ? `${OPS_TENANT_CSS.STRIP_CELL} ${OPS_TENANT_CSS.STRIP_CELL_ACTIVE}`
                : OPS_TENANT_CSS.STRIP_CELL
            }
            onClick={() => onSelect(cell.id)}
            aria-pressed={isActive}
          >
            <span className={OPS_TENANT_CSS.STRIP_LABEL}>{cell.label}</span>
            <span className={OPS_TENANT_CSS.STRIP_VALUE}>
              {loading
                ? OPS_TENANT_LABELS.COUNT_PLACEHOLDER
                : toDisplayString(cell.value)}
            </span>
          </button>
        );
      })}
    </section>
  );
}
