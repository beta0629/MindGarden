/**
 * MoneyQuietHeader — 제목 + 기간 세그먼트 + 보조 링크(≤3)
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import BadgeSelect from '../../../common/BadgeSelect';
import {
  OFD_LINKS,
  OFD_PAGE_TITLE,
  OFD_PAGE_TITLE_ID,
  OFD_PERIOD_ARIA_LABEL,
  OFD_PERIOD_OPTIONS
} from '../../../../constants/operatorFinanceDashboardStrings';

const LINK_ITEMS = [OFD_LINKS.FINANCIAL, OFD_LINKS.SALARY, OFD_LINKS.PURCHASE];

/**
 * @param {object} props
 * @param {string} props.period
 * @param {(next: string) => void} props.onPeriodChange
 */
const MoneyQuietHeader = ({ period, onPeriodChange }) => {
  const navigate = useNavigate();

  return (
    <header className="money-quiet-header" aria-label={OFD_PAGE_TITLE}>
      <h1 id={OFD_PAGE_TITLE_ID} className="money-quiet-header__title">
        {OFD_PAGE_TITLE}
      </h1>
      <div className="money-quiet-header__controls">
        <BadgeSelect
          options={OFD_PERIOD_OPTIONS}
          value={period}
          onChange={onPeriodChange}
          size="small"
          aria-label={OFD_PERIOD_ARIA_LABEL}
          className="money-quiet-header__period"
        />
        <nav className="money-quiet-header__links" aria-label="바로가기">
          {LINK_ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              className="money-quiet-header__link"
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

MoneyQuietHeader.propTypes = {
  period: PropTypes.string.isRequired,
  onPeriodChange: PropTypes.func.isRequired
};

export default MoneyQuietHeader;
