import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, Undo2 } from 'lucide-react';
import '../../admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../ErpCommon.css';

/** 기존 라우트 유지: `/erp/financial`, `/erp/refund-management` */
export const ERP_FINANCIAL_HUB_PATH = '/erp/financial';
export const ERP_REFUND_HUB_PATH = '/erp/refund-management';

/**
 * 재무·환불 허브 상단 탭(일상 거래 / 환불·정산) — ErpPageShell.tabsSlot 등에 주입.
 */
export const FinancialRefundHubTabs = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isFinancial = pathname === ERP_FINANCIAL_HUB_PATH;
  const isRefund = pathname === ERP_REFUND_HUB_PATH;

  const goFinancial = useCallback(() => {
    navigate(ERP_FINANCIAL_HUB_PATH);
  }, [navigate]);

  const goRefund = useCallback(() => {
    navigate(ERP_REFUND_HUB_PATH);
  }, [navigate]);

  return (
    <nav className="mg-v2-financial-refund-hub" aria-label="재무·환불 허브">
      <div className="mg-v2-ad-b0kla__pill-toggle" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={isFinancial}
          className={`mg-v2-ad-b0kla__pill ${isFinancial ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
          onClick={goFinancial}
        >
          <ClipboardList size={18} aria-hidden /> 일상 거래
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isRefund}
          className={`mg-v2-ad-b0kla__pill ${isRefund ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
          onClick={goRefund}
        >
          <Undo2 size={18} aria-hidden /> 환불·정산
        </button>
      </div>
    </nav>
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
