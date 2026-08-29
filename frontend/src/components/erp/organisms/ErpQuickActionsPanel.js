/**
 * ERP 대시보드 — 빠른 액션 그리드 (B0KlA)
 *
 * @author CoreSolution
 * @since 2026-04-05
 */

import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  ClipboardCheck,
  LineChart,
  RotateCcw,
  Wallet
} from 'lucide-react';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../common/erpMgButtonProps';
import { useTranslation } from 'react-i18next';

const ERP_QUICK_ICON_SIZE = 28;

/**
 * @param {object} props
 * @param {boolean} [props.hasPurchaseRequestView] 미사용(호출부 호환용, 렌더 안 함)
 * @param {boolean} props.hasApprovalManage
 * @param {boolean} [props.hasItemManage] 미사용(호출부 호환용, 렌더 안 함)
 * @param {boolean} props.hasBudgetManage
 * @param {boolean} props.hasSalaryManage
 * @param {boolean} props.hasTaxManage
 * @param {boolean} props.hasIntegratedFinanceView
 * @param {boolean} props.hasRefundManage
 */
const ErpQuickActionsPanel = ({
  hasPurchaseRequestView: _hasPurchaseRequestView,
  hasApprovalManage,
  hasItemManage: _hasItemManage,
  hasBudgetManage,
  hasSalaryManage,
  hasTaxManage,
  hasIntegratedFinanceView,
  hasRefundManage
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="mg-v2-ad-b0kla__card erp-quick-actions">
      <h2 className="mg-v2-ad-b0kla__section-title">{t('erp:ErpQuickActionsPanel.t_15e878d3')}</h2>
      <div className="mg-v2-ad-b0kla__admin-grid erp-quick-actions__grid">
        {hasApprovalManage && (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: 'mg-v2-ad-b0kla__admin-card'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate('/erp/approvals')}
            preventDoubleClick={false}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--orange" aria-hidden>
              <ClipboardCheck size={ERP_QUICK_ICON_SIZE} strokeWidth={1.75} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">{t('erp:ErpQuickActionsPanel.t_492092db')}</span>
            <span className="mg-v2-ad-b0kla__admin-desc">{t('erp:ErpQuickActionsPanel.t_c06444e2')}</span>
          </MGButton>
        )}
        {hasBudgetManage && (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: 'mg-v2-ad-b0kla__admin-card'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate('/erp/budget')}
            preventDoubleClick={false}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--gray" aria-hidden>
              <Wallet size={ERP_QUICK_ICON_SIZE} strokeWidth={1.75} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">{t('erp:ErpQuickActionsPanel.t_caa5739a')}</span>
            <span className="mg-v2-ad-b0kla__admin-desc">{t('erp:ErpQuickActionsPanel.t_d82748f6')}</span>
          </MGButton>
        )}
        {hasSalaryManage && hasTaxManage && (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: 'mg-v2-ad-b0kla__admin-card'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate('/erp/salary')}
            preventDoubleClick={false}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--green" aria-hidden>
              <Calculator size={ERP_QUICK_ICON_SIZE} strokeWidth={1.75} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">{t('erp:ErpQuickActionsPanel.t_b2b665ae')}</span>
            <span className="mg-v2-ad-b0kla__admin-desc">{t('erp:ErpQuickActionsPanel.t_b0639a72')}</span>
          </MGButton>
        )}
        {hasSalaryManage && !hasTaxManage && (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: 'mg-v2-ad-b0kla__admin-card'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate('/erp/salary')}
            preventDoubleClick={false}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--green" aria-hidden>
              <Calculator size={ERP_QUICK_ICON_SIZE} strokeWidth={1.75} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">{t('erp:ErpQuickActionsPanel.t_5abac593')}</span>
            <span className="mg-v2-ad-b0kla__admin-desc">{t('erp:ErpQuickActionsPanel.t_9d302085')}</span>
          </MGButton>
        )}
        {!hasSalaryManage && hasTaxManage && (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: 'mg-v2-ad-b0kla__admin-card'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate('/erp/tax')}
            preventDoubleClick={false}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--orange" aria-hidden>
              <Calculator size={ERP_QUICK_ICON_SIZE} strokeWidth={1.75} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">{t('erp:ErpQuickActionsPanel.t_780e38c6')}</span>
            <span className="mg-v2-ad-b0kla__admin-desc">{t('erp:ErpQuickActionsPanel.t_525a8466')}</span>
          </MGButton>
        )}
        {hasIntegratedFinanceView && (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: 'mg-v2-ad-b0kla__admin-card'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate('/admin/erp/financial')}
            preventDoubleClick={false}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--blue" aria-hidden>
              <LineChart size={ERP_QUICK_ICON_SIZE} strokeWidth={1.75} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">{t('erp:ErpQuickActionsPanel.t_73da76eb')}</span>
            <span className="mg-v2-ad-b0kla__admin-desc">{t('erp:ErpQuickActionsPanel.t_291d851a')}</span>
          </MGButton>
        )}
        {hasRefundManage && (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: 'mg-v2-ad-b0kla__admin-card'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate('/erp/refund-management')}
            preventDoubleClick={false}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--orange" aria-hidden>
              <RotateCcw size={ERP_QUICK_ICON_SIZE} strokeWidth={1.75} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">{t('erp:ErpQuickActionsPanel.t_ce897476')}</span>
            <span className="mg-v2-ad-b0kla__admin-desc">{t('erp:ErpQuickActionsPanel.t_6534bc2e')}</span>
          </MGButton>
        )}
      </div>
    </div>
  );
};

export default ErpQuickActionsPanel;
