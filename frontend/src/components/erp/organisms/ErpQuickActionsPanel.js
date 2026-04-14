/**
 * ERP 대시보드 — 빠른 액션 그리드 (B0KlA)
 *
 * @author CoreSolution
 * @since 2026-04-05
 */

import { useNavigate } from 'react-router-dom';
import MGButton from '../../common/MGButton';

/**
 * @param {object} props
 * @param {boolean} props.hasPurchaseRequestView
 * @param {boolean} props.hasApprovalManage
 * @param {boolean} props.hasItemManage
 * @param {boolean} props.hasBudgetManage
 * @param {boolean} props.hasSalaryManage
 * @param {boolean} props.hasTaxManage
 * @param {boolean} props.hasIntegratedFinanceView
 * @param {boolean} props.hasRefundManage
 */
const ErpQuickActionsPanel = ({
  hasPurchaseRequestView,
  hasApprovalManage,
  hasItemManage,
  hasBudgetManage,
  hasSalaryManage,
  hasTaxManage,
  hasIntegratedFinanceView,
  hasRefundManage
}) => {
  const navigate = useNavigate();

  return (
    <div className="mg-v2-ad-b0kla__card erp-quick-actions">
      <h2 className="mg-v2-ad-b0kla__section-title">빠른 액션</h2>
      <div className="mg-v2-ad-b0kla__admin-grid">
        {hasPurchaseRequestView && (
          <MGButton
            type="button"
            variant="outline"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate('/erp/purchase-requests')}
            preventDoubleClick={false}
          >
            <span className="mg-v2-ad-b0kla__admin-label">구매 요청하기</span>
            <span className="mg-v2-ad-b0kla__admin-desc">상품 및 비품 구매 요청을 제출합니다</span>
          </MGButton>
        )}
        {hasApprovalManage && (
          <MGButton
            type="button"
            variant="outline"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate('/erp/approvals')}
            preventDoubleClick={false}
          >
            <span className="mg-v2-ad-b0kla__admin-label">승인 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">구매 요청 승인 및 거부를 관리합니다</span>
          </MGButton>
        )}
        {hasItemManage && (
          <MGButton
            type="button"
            variant="outline"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate('/erp/items')}
            preventDoubleClick={false}
          >
            <span className="mg-v2-ad-b0kla__admin-label">아이템 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">등록된 비품 및 상품을 관리합니다</span>
          </MGButton>
        )}
        {hasBudgetManage && (
          <MGButton
            type="button"
            variant="outline"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate('/erp/budget')}
            preventDoubleClick={false}
          >
            <span className="mg-v2-ad-b0kla__admin-label">예산 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">지점별 예산을 설정하고 관리합니다</span>
          </MGButton>
        )}
        {hasSalaryManage && hasTaxManage && (
          <MGButton
            type="button"
            variant="outline"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate('/erp/salary')}
            preventDoubleClick={false}
          >
            <span className="mg-v2-ad-b0kla__admin-label">급여 세금 통합관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">급여 계산·세금 통계를 한 화면에서 관리합니다</span>
          </MGButton>
        )}
        {hasSalaryManage && !hasTaxManage && (
          <MGButton
            type="button"
            variant="outline"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate('/erp/salary')}
            preventDoubleClick={false}
          >
            <span className="mg-v2-ad-b0kla__admin-label">급여 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">상담사 급여 계산 및 지급을 관리합니다</span>
          </MGButton>
        )}
        {!hasSalaryManage && hasTaxManage && (
          <MGButton
            type="button"
            variant="outline"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate('/erp/tax')}
            preventDoubleClick={false}
          >
            <span className="mg-v2-ad-b0kla__admin-label">세금 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">원천징수 및 세금 관련 업무를 관리합니다</span>
          </MGButton>
        )}
        {hasIntegratedFinanceView && (
          <MGButton
            type="button"
            variant="outline"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate('/admin/erp/financial')}
            preventDoubleClick={false}
          >
            <span className="mg-v2-ad-b0kla__admin-label">수입·지출 한눈에</span>
            <span className="mg-v2-ad-b0kla__admin-desc">거래·손익·정산을 한곳에서 확인합니다</span>
          </MGButton>
        )}
        {hasRefundManage && (
          <MGButton
            type="button"
            variant="outline"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate('/erp/refund-management')}
            preventDoubleClick={false}
          >
            <span className="mg-v2-ad-b0kla__admin-label">환불 관리 시스템</span>
            <span className="mg-v2-ad-b0kla__admin-desc">환불 요청 및 처리 내역을 관리합니다</span>
          </MGButton>
        )}
      </div>
    </div>
  );
};

export default ErpQuickActionsPanel;
