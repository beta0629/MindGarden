/**
 * DepositPendingList — 입금 확인 대기 (ListTableView, G1-02)
 *
 * @author Core Solution
 * @since 2025-02-21
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ListTableView } from '../../../common';
import SafeText from '../../../common/SafeText';
import { toDisplayString, toSafeNumber } from '../../../../utils/safeDisplay';
import {
  DASHBOARD_PENDING_LIST_MAX_ROWS,
  DASHBOARD_PENDING_LIST_VIEW_ALL_LABEL
} from '../../../../constants/adminDashboardWidgetConstants';
import './DepositPendingList.css';

const DEPOSIT_COLUMNS = [
  { key: 'clientName', label: '내담자' },
  { key: 'amount', label: '금액', hideOnMobile: true }
];

const DepositPendingList = ({ items = [], viewAllHref = '' }) => {
  const displayItems = useMemo(
    () => items.slice(0, DASHBOARD_PENDING_LIST_MAX_ROWS),
    [items]
  );

  const renderCell = (columnKey, item) => {
    if (columnKey === 'clientName') {
      return <SafeText tag="span">{toDisplayString(item.clientName, '—')}</SafeText>;
    }
    if (columnKey === 'amount') {
      const amount = toSafeNumber(item.amount, null);
      if (amount == null) {
        return <SafeText tag="span">—</SafeText>;
      }
      return (
        <SafeText tag="span">
          {`${amount.toLocaleString()}원`}
        </SafeText>
      );
    }
    return <SafeText tag="span">—</SafeText>;
  };

  return (
    <section className="deposit-pending-list" aria-labelledby="deposit-pending-list-title">
      <header className="deposit-pending-list__header">
        <h3 id="deposit-pending-list-title" className="deposit-pending-list__title">
          입금 확인 대기
        </h3>
        <span className="deposit-pending-list__count">
          {toSafeNumber(items.length, 0)}건
        </span>
      </header>

      {displayItems.length > 0 ? (
        <ListTableView
          columns={DEPOSIT_COLUMNS}
          data={displayItems}
          renderCell={renderCell}
          className="deposit-pending-list__table mg-v2-ad-b0kla__data-table--comfortable"
          rowKeyField="id"
        />
      ) : (
        <p className="deposit-pending-list__empty">처리 대기 항목이 없습니다.</p>
      )}

      {viewAllHref ? (
        <footer className="deposit-pending-list__footer">
          <Link to={viewAllHref} className="deposit-pending-list__view-all">
            {DASHBOARD_PENDING_LIST_VIEW_ALL_LABEL}
          </Link>
        </footer>
      ) : null}
    </section>
  );
};

DepositPendingList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  viewAllHref: PropTypes.string
};

DepositPendingList.defaultProps = {
  items: [],
  viewAllHref: ''
};

export default DepositPendingList;
