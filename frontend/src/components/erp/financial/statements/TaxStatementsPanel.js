/**
 * TaxStatementsPanel — IntegratedFinanceDashboard statement views (embedded)
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import IntegratedFinanceDashboard from '../../IntegratedFinanceDashboard';

/**
 * @param {object} props
 * @param {string} props.activeTab
 */
const TaxStatementsPanel = ({ activeTab = 'income-statement' }) => (
  <IntegratedFinanceDashboard
    embedded
    hideChrome
    forcedTab={activeTab}
  />
);

TaxStatementsPanel.propTypes = {
  activeTab: PropTypes.string
};

export default TaxStatementsPanel;
