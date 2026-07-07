/**
 * SchedulePendingList — 스케줄 등록 대기 (ListTableView, G1-02)
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
import './SchedulePendingList.css';

const SCHEDULE_COLUMNS = [
  { key: 'clientName', label: '내담자' },
  { key: 'consultantName', label: '상담사', hideOnMobile: true }
];

const SchedulePendingList = ({ items = [], viewAllHref = '' }) => {
  const displayItems = useMemo(
    () => items.slice(0, DASHBOARD_PENDING_LIST_MAX_ROWS),
    [items]
  );

  const renderCell = (columnKey, item) => {
    if (columnKey === 'clientName') {
      return <SafeText tag="span">{toDisplayString(item.clientName, '—')}</SafeText>;
    }
    if (columnKey === 'consultantName') {
      return <SafeText tag="span">{toDisplayString(item.consultantName, '—')}</SafeText>;
    }
    return <SafeText tag="span">—</SafeText>;
  };

  return (
    <section className="schedule-pending-list" aria-labelledby="schedule-pending-list-title">
      <header className="schedule-pending-list__header">
        <h3 id="schedule-pending-list-title" className="schedule-pending-list__title">
          스케줄 등록 대기
        </h3>
        <span className="schedule-pending-list__count">
          {toSafeNumber(items.length, 0)}건
        </span>
      </header>

      {displayItems.length > 0 ? (
        <ListTableView
          columns={SCHEDULE_COLUMNS}
          data={displayItems}
          renderCell={renderCell}
          className="schedule-pending-list__table mg-v2-ad-b0kla__data-table--comfortable"
          rowKeyField="id"
        />
      ) : (
        <p className="schedule-pending-list__empty">처리 대기 항목이 없습니다.</p>
      )}

      {viewAllHref ? (
        <footer className="schedule-pending-list__footer">
          <Link to={viewAllHref} className="schedule-pending-list__view-all">
            {DASHBOARD_PENDING_LIST_VIEW_ALL_LABEL}
          </Link>
        </footer>
      ) : null}
    </section>
  );
};

SchedulePendingList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  viewAllHref: PropTypes.string
};

SchedulePendingList.defaultProps = {
  items: [],
  viewAllHref: ''
};

export default SchedulePendingList;
