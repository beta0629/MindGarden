import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import SegmentedTabs from '../../common/SegmentedTabs';
import '../ErpCommon.css';
import { RM_HUB } from '../../../constants/refundManagementClinicOsStrings';

/** 기존 라우트 유지: `/erp/financial`, `/erp/refund-management` */
export const ERP_FINANCIAL_HUB_PATH = '/erp/financial';
export const ERP_REFUND_HUB_PATH = '/erp/refund-management';

/**
 * 재무·환불 허브 상단 탭(일상 거래 / 환불·정산) — ErpPageShell.tabsSlot 등에 주입.
 * Clinic-OS SegmentedTabs only — B0KlA pill class 금지.
 */
export const FinancialRefundHubTabs = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isFinancial = pathname === ERP_FINANCIAL_HUB_PATH;
  const isRefund = pathname === ERP_REFUND_HUB_PATH;

  const handleHubChange = useCallback(
    (next) => {
      if (next === 'financial') {
        navigate(ERP_FINANCIAL_HUB_PATH);
      } else if (next === 'refund') {
        navigate(ERP_REFUND_HUB_PATH);
      }
    },
    [navigate]
  );

  const activeValue = isRefund ? 'refund' : isFinancial ? 'financial' : 'financial';

  return (
    <div className="mg-v2-financial-refund-hub" aria-label={RM_HUB.ARIA}>
      <SegmentedTabs
        ariaLabel={RM_HUB.ARIA}
        items={[
          { value: 'financial', label: RM_HUB.FINANCIAL },
          { value: 'refund', label: RM_HUB.REFUND }
        ]}
        activeValue={activeValue}
        onChange={handleHubChange}
        size="sm"
      />
    </div>
  );
};

/**
 * 재무·환불 허브: 상단 탭 + 자식 본문 (레거시 래퍼 — 신규 화면은 ErpPageShell + FinancialRefundHubTabs 권장)
 */
const FinancialRefundHubLayout = ({ children }) => {
  return (
    <>
      <FinancialRefundHubTabs />
      {children}
    </>
  );
};

FinancialRefundHubLayout.propTypes = {
  children: PropTypes.node
};

export default FinancialRefundHubLayout;
