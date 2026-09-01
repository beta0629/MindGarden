/**
 * TaxDisclosureSection — 세무사용 자료 (접이식) + year-end close panel
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import { useState, useCallback, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import UnifiedLoading from '../../../common/UnifiedLoading';
import {
  FM_TAX_DISCLOSURE,
  FM_LOADING
} from '../../../../constants/financialManagementStrings';

const YearEndClosePanel = lazy(() => import('../statements/YearEndClosePanel'));

/**
 * @param {object} [props]
 * @param {string} [props.initialTaxTab]
 */
const TaxDisclosureSection = ({ initialTaxTab = 'income-statement' }) => {
  const [open, setOpen] = useState(false);

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
          <Suspense fallback={<UnifiedLoading type="inline" text={FM_LOADING.INLINE} />}>
            <YearEndClosePanel initialTab={initialTaxTab} />
          </Suspense>
        </div>
      ) : null}
    </section>
  );
};

TaxDisclosureSection.propTypes = {
  initialTaxTab: PropTypes.string
};

export default TaxDisclosureSection;
