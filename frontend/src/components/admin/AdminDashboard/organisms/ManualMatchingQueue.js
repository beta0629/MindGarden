/**
 * ManualMatchingQueue — 미배정 내담자 매칭 대기열 (ListTableView, G1-02)
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
import './ManualMatchingQueue.css';

const MATCHING_COLUMNS = [
  { key: 'clientName', label: '내담자' },
  { key: 'clientMeta', label: '정보', hideOnMobile: true }
];

const ManualMatchingQueue = ({ items = [], viewAllHref = '', loading = false }) => {
  const displayItems = useMemo(
    () => items.slice(0, DASHBOARD_PENDING_LIST_MAX_ROWS),
    [items]
  );

  const renderCell = (columnKey, item) => {
    if (columnKey === 'clientName') {
      return <SafeText tag="span">{toDisplayString(item.clientName, '—')}</SafeText>;
    }
    if (columnKey === 'clientMeta') {
      return <SafeText tag="span">{toDisplayString(item.clientMeta, '—')}</SafeText>;
    }
    return <SafeText tag="span">—</SafeText>;
  };

  return (
    <section
      className="manual-matching-queue mg-v2-ad-b0kla__section"
      aria-labelledby="manual-matching-queue-title"
    >
      <header className="manual-matching-queue__header">
        <h3 id="manual-matching-queue-title" className="manual-matching-queue__title">
          미배정 내담자 매칭 대기열
        </h3>
        <span className="manual-matching-queue__count">
          {toSafeNumber(items.length, 0)}건
        </span>
      </header>

      {loading ? (
        <p className="manual-matching-queue__empty">로딩 중...</p>
      ) : displayItems.length > 0 ? (
        <ListTableView
          columns={MATCHING_COLUMNS}
          data={displayItems}
          renderCell={renderCell}
          className="manual-matching-queue__table mg-v2-ad-b0kla__data-table--comfortable"
          rowKeyField="id"
        />
      ) : (
        <p className="manual-matching-queue__empty">대기 중인 내담자가 없습니다</p>
      )}

      {viewAllHref ? (
        <footer className="manual-matching-queue__footer">
          <Link to={viewAllHref} className="manual-matching-queue__view-all">
            {DASHBOARD_PENDING_LIST_VIEW_ALL_LABEL}
          </Link>
        </footer>
      ) : null}
    </section>
  );
};

ManualMatchingQueue.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  viewAllHref: PropTypes.string,
  loading: PropTypes.bool
};

ManualMatchingQueue.defaultProps = {
  items: [],
  viewAllHref: '',
  loading: false
};

export default ManualMatchingQueue;
