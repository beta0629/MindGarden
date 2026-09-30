/**
 * 관리자 쇼핑 스위트 공용 조각 — 상태 칩·회기 변화·쌍 패널·안내 박스·토스트·스켈레톤
 *
 * @author CoreSolution
 * @since 2026-09-29
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import {
  ADMIN_SHOP_EXPIRING_SOON_CHIP,
  ADMIN_SHOP_LEDGER_CHIP,
  ADMIN_SHOP_LEDGER_STATE,
  ADMIN_SHOP_ORDERS_COPY,
  ADMIN_SHOP_SUITE_TEST_IDS,
  ADMIN_SHOP_TOAST_DURATION_MS,
  formatAdminShopCopy
} from '../../../constants/adminShopSuite';
import { resolveAdminPaymentStatusLabel } from '../../../constants/adminShopApi';
import { ADMIN_SHOP_SESSION_DELTA_KIND } from '../../../utils/adminShopSuite';

const SKELETON_ROW_COUNT = 5;

/**
 * 쌍장부 상태 칩. 만료 임박은 `만료 임박 D-{n}`.
 *
 * @param {{ state: string, daysLeft?: number|null }} props
 * @returns {JSX.Element|null}
 */
export function AdminShopLedgerChip({ state, daysLeft }) {
  const chip = ADMIN_SHOP_LEDGER_CHIP[state];
  if (!chip) {
    return null;
  }
  const label = state === ADMIN_SHOP_LEDGER_STATE.EXPIRING_SOON && daysLeft != null
    ? formatAdminShopCopy(ADMIN_SHOP_EXPIRING_SOON_CHIP, { days: daysLeft })
    : chip.label;
  return (
    <span className={`admin-shop-suite__chip admin-shop-suite__chip--${chip.modifier}`}>
      <SafeText>{label}</SafeText>
    </span>
  );
}

AdminShopLedgerChip.propTypes = {
  state: PropTypes.string.isRequired,
  daysLeft: PropTypes.number
};

AdminShopLedgerChip.defaultProps = {
  daysLeft: null
};

/**
 * 결제 행 상태 칩 — 라벨이 정의된 서버 상태(예: REFUND_REQUIRED → 환불 필요)만 표시.
 *
 * @param {{ paymentStatus?: string|null }} props
 * @returns {JSX.Element|null}
 */
export function AdminShopPaymentStatusChip({ paymentStatus }) {
  const label = resolveAdminPaymentStatusLabel(paymentStatus);
  if (!label) {
    return null;
  }
  return (
    <span className="admin-shop-suite__chip admin-shop-suite__chip--amber">
      <SafeText>{label}</SafeText>
    </span>
  );
}

AdminShopPaymentStatusChip.propTypes = {
  paymentStatus: PropTypes.string
};

AdminShopPaymentStatusChip.defaultProps = {
  paymentStatus: null
};

/**
 * 주문 목록 상태 칸 — 장부 칩과 결제 상태 칩(환불 필요 등)을 세로로 쌓아 좁은 칸에서 잘리지 않게 한다.
 *
 * @param {{ state: string, daysLeft?: number|null, paymentStatus?: string|null }} props
 * @returns {JSX.Element}
 */
export function AdminShopOrderStatusChips({ state, daysLeft, paymentStatus }) {
  return (
    <span className="admin-shop-suite__cell-stack admin-shop-suite__cell-stack--chips">
      <AdminShopLedgerChip state={state} daysLeft={daysLeft} />
      <AdminShopPaymentStatusChip paymentStatus={paymentStatus} />
    </span>
  );
}

AdminShopOrderStatusChips.propTypes = {
  state: PropTypes.string.isRequired,
  daysLeft: PropTypes.number,
  paymentStatus: PropTypes.string
};

AdminShopOrderStatusChips.defaultProps = {
  daysLeft: null,
  paymentStatus: null
};

/**
 * 회기 변화 텍스트 (+N회기 · −N원복 · (+N) 대기/미반영 · (N) 만료 · —).
 *
 * @param {{ kind: string, count: number|null }} delta
 * @returns {string}
 */
export function formatAdminShopSessionDelta(delta) {
  const count = delta?.count;
  if (count == null || delta.kind === ADMIN_SHOP_SESSION_DELTA_KIND.NONE) {
    return '—';
  }
  switch (delta.kind) {
    case ADMIN_SHOP_SESSION_DELTA_KIND.GRANT:
      return `+${count}${ADMIN_SHOP_ORDERS_COPY.SESSION_GRANTED}`;
    case ADMIN_SHOP_SESSION_DELTA_KIND.RESTORE:
      return `−${count} ${ADMIN_SHOP_ORDERS_COPY.SESSION_RESTORED}`;
    case ADMIN_SHOP_SESSION_DELTA_KIND.WAITING:
      return `(+${count}) ${ADMIN_SHOP_ORDERS_COPY.SESSION_WAITING}`;
    case ADMIN_SHOP_SESSION_DELTA_KIND.UNREFLECTED:
      return `(+${count}) ${ADMIN_SHOP_ORDERS_COPY.SESSION_UNREFLECTED}`;
    case ADMIN_SHOP_SESSION_DELTA_KIND.EXPIRED:
      return `(${count}) ${ADMIN_SHOP_ORDERS_COPY.SESSION_EXPIRED}`;
    default:
      return '—';
  }
}

/**
 * @param {{ delta: { kind: string, count: number|null } }} props
 * @returns {JSX.Element}
 */
export function AdminShopSessionDelta({ delta }) {
  const kind = delta?.count == null ? ADMIN_SHOP_SESSION_DELTA_KIND.NONE : delta.kind;
  return (
    <span className={`admin-shop-suite__delta admin-shop-suite__delta--${kind}`}>
      <SafeText>{formatAdminShopSessionDelta(delta)}</SafeText>
    </span>
  );
}

AdminShopSessionDelta.propTypes = {
  delta: PropTypes.shape({
    kind: PropTypes.string,
    count: PropTypes.number
  }).isRequired
};

/**
 * 금액 | 회기 쌍 패널.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
export function AdminShopPairPanel({
  amountLabel,
  amountText,
  amountTone,
  amountCaption,
  sessionsLabel,
  sessionsText,
  sessionsTone,
  sessionsCaption
}) {
  return (
    <div className="admin-shop-suite__pair">
      <div className="admin-shop-suite__pair-cell">
        <span className="admin-shop-suite__pair-label"><SafeText>{amountLabel}</SafeText></span>
        <span className={`admin-shop-suite__pair-value${amountTone ? ` admin-shop-suite__pair-value--${amountTone}` : ''}`}>
          <SafeText>{amountText}</SafeText>
        </span>
        {amountCaption ? (
          <span className="admin-shop-suite__pair-caption"><SafeText>{amountCaption}</SafeText></span>
        ) : null}
      </div>
      <div className="admin-shop-suite__pair-cell">
        <span className="admin-shop-suite__pair-label"><SafeText>{sessionsLabel}</SafeText></span>
        <span className={`admin-shop-suite__pair-value${sessionsTone ? ` admin-shop-suite__pair-value--${sessionsTone}` : ''}`}>
          <SafeText>{sessionsText}</SafeText>
        </span>
        {sessionsCaption ? (
          <span className="admin-shop-suite__pair-caption"><SafeText>{sessionsCaption}</SafeText></span>
        ) : null}
      </div>
    </div>
  );
}

AdminShopPairPanel.propTypes = {
  amountLabel: PropTypes.string.isRequired,
  amountText: PropTypes.string.isRequired,
  amountTone: PropTypes.oneOf(['out', 'dim', null]),
  amountCaption: PropTypes.string,
  sessionsLabel: PropTypes.string.isRequired,
  sessionsText: PropTypes.string.isRequired,
  sessionsTone: PropTypes.oneOf(['out', 'dim', null]),
  sessionsCaption: PropTypes.string
};

AdminShopPairPanel.defaultProps = {
  amountTone: null,
  amountCaption: '',
  sessionsTone: null,
  sessionsCaption: ''
};

/**
 * 안내 박스 (quiet · amber · error).
 *
 * @param {{ tone?: string, icon?: React.ReactNode, children: React.ReactNode, testId?: string }} props
 * @returns {JSX.Element}
 */
export function AdminShopNotice({ tone, icon, children, testId }) {
  return (
    <div
      className={`admin-shop-suite__notice${tone ? ` admin-shop-suite__notice--${tone}` : ''}`}
      role={tone === 'error' ? 'alert' : undefined}
      data-testid={testId}
    >
      {icon}
      <div className="admin-shop-suite__notice-body">{children}</div>
    </div>
  );
}

AdminShopNotice.propTypes = {
  tone: PropTypes.oneOf(['amber', 'error', 'info', null]),
  icon: PropTypes.node,
  children: PropTypes.node.isRequired,
  testId: PropTypes.string
};

AdminShopNotice.defaultProps = {
  tone: null,
  icon: null,
  testId: undefined
};

/**
 * 스위트 토스트 상태 훅 — 하단 중앙 1개, 되돌리기 액션 선택.
 *
 * @returns {{ toast: object|null, showToast: Function, hideToast: Function }}
 */
export function useAdminShopSuiteToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((message, action = null) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToast({ message, action });
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setToast(null);
    }, ADMIN_SHOP_TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  return { toast, showToast, hideToast };
}

/**
 * @param {{ toast: { message: string, action?: { label: string, onClick: Function } }|null, onDismiss: Function }} props
 * @returns {JSX.Element|null}
 */
export function AdminShopSuiteToast({ toast, onDismiss }) {
  if (!toast) {
    return null;
  }
  const { message, action } = toast;
  return (
    <div
      className="admin-shop-suite__toast"
      role="status"
      aria-live="polite"
      data-testid={ADMIN_SHOP_SUITE_TEST_IDS.SUITE_TOAST}
    >
      <SafeText>{message}</SafeText>
      {action ? (
        <button
          type="button"
          className="admin-shop-suite__toast-action"
          onClick={() => {
            onDismiss();
            action.onClick();
          }}
        >
          <SafeText>{action.label}</SafeText>
        </button>
      ) : null}
    </div>
  );
}

AdminShopSuiteToast.propTypes = {
  toast: PropTypes.shape({
    message: PropTypes.string.isRequired,
    action: PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired
    })
  }),
  onDismiss: PropTypes.func.isRequired
};

AdminShopSuiteToast.defaultProps = {
  toast: null
};

/**
 * 표 스켈레톤 행 (tbody).
 *
 * @param {{ columnCount: number, testId?: string }} props
 * @returns {JSX.Element}
 */
export function AdminShopTableSkeleton({ columnCount, testId }) {
  const rows = Array.from({ length: SKELETON_ROW_COUNT }, (_, r) => r);
  const cols = Array.from({ length: columnCount }, (_, c) => c);
  return (
    <tbody data-testid={testId} aria-busy="true">
      {rows.map((r) => (
        <tr key={`sk-${r}`} className="admin-shop-suite__row--static">
          {cols.map((c) => (
            <td key={`sk-${r}-${c}`}>
              <span className="admin-shop-suite__skeleton-bar" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

AdminShopTableSkeleton.propTypes = {
  columnCount: PropTypes.number.isRequired,
  testId: PropTypes.string
};

AdminShopTableSkeleton.defaultProps = {
  testId: undefined
};
