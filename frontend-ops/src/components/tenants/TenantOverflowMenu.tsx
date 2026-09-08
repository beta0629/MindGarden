'use client';

import { useEffect, useRef, useState } from 'react';

import MGButton from '@/components/ui/MGButton';
import {
  OPS_TENANT_CSS,
  OPS_TENANT_LABELS,
  OPS_TENANT_STATUS
} from '@/constants/opsTenants';

/**
 * TenantOverflowMenu — 상세 · 정지/재개 (remove action 없음)
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

type TenantOverflowMenuProps = {
  status: string;
  onDetail: () => void;
  onSuspend: () => void;
  onResume: () => void;
  onViewPg?: () => void;
};

export default function TenantOverflowMenu({
  status,
  onDetail,
  onSuspend,
  onResume,
  onViewPg
}: TenantOverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const showSuspend = status === OPS_TENANT_STATUS.ACTIVE;
  const showResume = status === OPS_TENANT_STATUS.SUSPENDED;

  return (
    <div className={OPS_TENANT_CSS.OVERFLOW} ref={rootRef}>
      <MGButton
        type="button"
        variant="ghost"
        size="small"
        className={OPS_TENANT_CSS.OVERFLOW_TRIGGER}
        aria-label={OPS_TENANT_LABELS.MENU_ARIA}
        aria-expanded={open}
        aria-haspopup="menu"
        preventDoubleClick={false}
        onClick={() => setOpen((prev) => !prev)}
      >
        ⋯
      </MGButton>
      {open ? (
        <ul className={OPS_TENANT_CSS.OVERFLOW_MENU} role="menu">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className={OPS_TENANT_CSS.OVERFLOW_ITEM}
              onClick={() => {
                setOpen(false);
                onDetail();
              }}
            >
              {OPS_TENANT_LABELS.MENU_DETAIL}
            </button>
          </li>
          {showSuspend ? (
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className={OPS_TENANT_CSS.OVERFLOW_ITEM}
                onClick={() => {
                  setOpen(false);
                  onSuspend();
                }}
              >
                {OPS_TENANT_LABELS.MENU_SUSPEND}
              </button>
            </li>
          ) : null}
          {showResume ? (
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className={OPS_TENANT_CSS.OVERFLOW_ITEM}
                onClick={() => {
                  setOpen(false);
                  onResume();
                }}
              >
                {OPS_TENANT_LABELS.MENU_RESUME}
              </button>
            </li>
          ) : null}
          {typeof onViewPg === 'function' ? (
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className={OPS_TENANT_CSS.OVERFLOW_ITEM}
                onClick={() => {
                  setOpen(false);
                  onViewPg();
                }}
              >
                {OPS_TENANT_LABELS.MENU_PG_VIEW}
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
