/**
 * YearEndClosePanel — operator-visible year-end tabs (손익 + 연말 자산·부채)
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import TabChipRow from '../../../common/TabChipRow';
import YearEndIncomePanel from './YearEndIncomePanel';
import YearEndBalancePanel from './YearEndBalancePanel';
import {
  FM_TAX_DISCLOSURE,
  FM_TAX_YEAR_END_TABS
} from '../../../../constants/financialManagementStrings';

/**
 * @param {object} [props]
 * @param {string} [props.initialTab]
 */
const YearEndClosePanel = ({ initialTab = 'income-statement' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="operator-ledger-year-end-close" data-testid="year-end-close-panel">
      <TabChipRow
        items={FM_TAX_YEAR_END_TABS}
        activeKey={activeTab}
        onChange={setActiveTab}
        ariaLabel={FM_TAX_DISCLOSURE.TITLE}
      />

      <div className="operator-ledger-tax__panel" role="tabpanel">
        {activeTab === 'income-statement' ? <YearEndIncomePanel /> : null}
        {activeTab === 'balance-sheet' ? <YearEndBalancePanel /> : null}
      </div>
    </div>
  );
};

YearEndClosePanel.propTypes = {
  initialTab: PropTypes.string
};

export default YearEndClosePanel;
