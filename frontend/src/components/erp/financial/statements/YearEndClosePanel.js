/**
 * YearEndClosePanel — primary year-end tabs + secondary accountant fold
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import { useState, useCallback, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import MGButton from '../../../common/MGButton';
import UnifiedLoading from '../../../common/UnifiedLoading';
import YearEndIncomePanel from './YearEndIncomePanel';
import YearEndBalancePanel from './YearEndBalancePanel';
import {
  FM_TAX_DISCLOSURE,
  FM_TAX_YEAR_END_TABS,
  FM_TAX_ACCOUNTANT_TABS,
  FM_LOADING
} from '../../../../constants/financialManagementStrings';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../common/erpMgButtonProps';

const TaxStatementsPanel = lazy(() => import('./TaxStatementsPanel'));

/**
 * @param {object} [props]
 * @param {string} [props.initialTab]
 */
const YearEndClosePanel = ({ initialTab = 'income-statement' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [accountantOpen, setAccountantOpen] = useState(false);
  const [accountantTab, setAccountantTab] = useState(FM_TAX_ACCOUNTANT_TABS[0]?.key ?? 'cash-flow');

  const handleAccountantToggle = useCallback(() => {
    setAccountantOpen((prev) => !prev);
  }, []);

  return (
    <div className="operator-ledger-year-end-close" data-testid="year-end-close-panel">
      <div
        className="operator-ledger-tax__tabs"
        role="tablist"
        aria-label={FM_TAX_DISCLOSURE.TITLE}
      >
        {FM_TAX_YEAR_END_TABS.map((tab) => (
          <MGButton
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            variant={activeTab === tab.key ? 'primary' : 'outline'}
            size="small"
            className={buildErpMgButtonClassName({
              variant: activeTab === tab.key ? 'primary' : 'outline',
              size: 'sm',
              loading: false
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => setActiveTab(tab.key)}
            preventDoubleClick={false}
          >
            {tab.label}
          </MGButton>
        ))}
      </div>

      <div className="operator-ledger-tax__panel" role="tabpanel">
        {activeTab === 'income-statement' ? <YearEndIncomePanel /> : null}
        {activeTab === 'balance-sheet' ? <YearEndBalancePanel /> : null}
      </div>

      <section
        className="operator-ledger-year-end-accountant"
        data-testid="year-end-accountant-fold"
      >
        <button
          type="button"
          className="operator-ledger-year-end-accountant__toggle"
          onClick={handleAccountantToggle}
          aria-expanded={accountantOpen}
          aria-controls="operator-ledger-accountant-panel"
        >
          <span className="operator-ledger-tax__chevron" aria-hidden>
            {accountantOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </span>
          <span>
            <p className="operator-ledger-year-end-accountant__title">
              {FM_TAX_DISCLOSURE.ACCOUNTANT_FOLD_TITLE}
            </p>
            <p className="operator-ledger-year-end-accountant__caption">
              {FM_TAX_DISCLOSURE.ACCOUNTANT_FOLD_CAPTION}
            </p>
          </span>
        </button>

        {accountantOpen ? (
          <div
            id="operator-ledger-accountant-panel"
            className="operator-ledger-year-end-accountant__body"
            role="region"
          >
            <div
              className="operator-ledger-tax__tabs"
              role="tablist"
              aria-label={FM_TAX_DISCLOSURE.ACCOUNTANT_FOLD_TITLE}
            >
              {FM_TAX_ACCOUNTANT_TABS.map((tab) => (
                <MGButton
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={accountantTab === tab.key}
                  variant={accountantTab === tab.key ? 'primary' : 'outline'}
                  size="small"
                  className={buildErpMgButtonClassName({
                    variant: accountantTab === tab.key ? 'primary' : 'outline',
                    size: 'sm',
                    loading: false
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => setAccountantTab(tab.key)}
                  preventDoubleClick={false}
                >
                  {tab.label}
                </MGButton>
              ))}
            </div>
            <div className="operator-ledger-tax__panel" role="tabpanel">
              <Suspense fallback={<UnifiedLoading type="inline" text={FM_LOADING.INLINE} />}>
                <TaxStatementsPanel activeTab={accountantTab} />
              </Suspense>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};

YearEndClosePanel.propTypes = {
  initialTab: PropTypes.string
};

export default YearEndClosePanel;
