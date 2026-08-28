/**
 * TaxDisclosureSection — 세무사용 자료 (접이식) + statement 탭
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import { useState, useCallback, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import MGButton from '../../../common/MGButton';
import UnifiedLoading from '../../../common/UnifiedLoading';
import {
  FM_TAX_DISCLOSURE,
  FM_TAX_STATEMENT_TABS,
  FM_LOADING
} from '../../../../constants/financialManagementStrings';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../common/erpMgButtonProps';

const TaxStatementsPanel = lazy(() =>
  import('../statements/TaxStatementsPanel')
);

/**
 * @param {object} [props]
 * @param {string} [props.initialTaxTab]
 */
const TaxDisclosureSection = ({ initialTaxTab = 'income-statement' }) => {
  const [open, setOpen] = useState(false);
  const [activeTaxTab, setActiveTaxTab] = useState(initialTaxTab);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  return (
    <section className="operator-ledger-tax" data-testid="operator-ledger-tax-disclosure">
      <button
        type="button"
        className="operator-ledger-tax__toggle"
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls="operator-ledger-tax-panel"
        id="operator-ledger-tax-toggle"
      >
        <span className="operator-ledger-tax__chevron" aria-hidden>
          {open ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </span>
        <span>
          <p className="operator-ledger-tax__title">{FM_TAX_DISCLOSURE.TITLE}</p>
          <p className="operator-ledger-tax__caption">{FM_TAX_DISCLOSURE.CAPTION}</p>
        </span>
      </button>
      {open ? (
        <div
          id="operator-ledger-tax-panel"
          className="operator-ledger-tax__body"
          role="region"
          aria-labelledby="operator-ledger-tax-toggle"
        >
          <div
            className="operator-ledger-tax__tabs"
            role="tablist"
            aria-label={FM_TAX_DISCLOSURE.TITLE}
          >
            {FM_TAX_STATEMENT_TABS.map((tab) => (
              <MGButton
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTaxTab === tab.key}
                variant={activeTaxTab === tab.key ? 'primary' : 'outline'}
                size="small"
                className={buildErpMgButtonClassName({
                  variant: activeTaxTab === tab.key ? 'primary' : 'outline',
                  size: 'sm',
                  loading: false
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => setActiveTaxTab(tab.key)}
                preventDoubleClick={false}
              >
                {tab.label}
              </MGButton>
            ))}
          </div>
          <div className="operator-ledger-tax__panel" role="tabpanel">
            <Suspense fallback={<UnifiedLoading type="inline" text={FM_LOADING.INLINE} />}>
              <TaxStatementsPanel activeTab={activeTaxTab} />
            </Suspense>
          </div>
        </div>
      ) : null}
    </section>
  );
};

TaxDisclosureSection.propTypes = {
  initialTaxTab: PropTypes.string
};

export default TaxDisclosureSection;
