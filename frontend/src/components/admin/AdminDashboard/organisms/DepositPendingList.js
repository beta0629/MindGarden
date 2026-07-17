/**
 * DepositPendingList — 입금 확인 대기 (ListTableView, G1-02)
 *
 * @author Core Solution
 * @since 2025-02-21
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  ActionButton,
  CardActionGroup,
  ListTableView,
  StatusBadge
} from '../../../common';
import SafeText from '../../../common/SafeText';
import { toDisplayString, toSafeNumber } from '../../../../utils/safeDisplay';
import { DEPOSIT_SOURCE_TYPES } from '../../../../utils/depositPendingQueue';
import {
  DASHBOARD_PENDING_LIST_MAX_ROWS,
  DASHBOARD_PENDING_LIST_VIEW_ALL_LABEL
} from '../../../../constants/adminDashboardWidgetConstants';
import './DepositPendingList.css';

const DEPOSIT_COLUMNS = [
  { key: 'parties', label: '내담자 / 상담사' },
  { key: 'payment', label: '입금 정보' },
  { key: 'action', label: '처리' }
];

const DepositPendingList = ({
  items = [],
  viewAllHref = '',
  onItemAction,
  processingItemId
}) => {
  const displayItems = useMemo(
    () => items.slice(0, DASHBOARD_PENDING_LIST_MAX_ROWS),
    [items]
  );

  const renderCell = (columnKey, item) => {
    if (columnKey === 'parties') {
      const isExtension = item.sourceType === DEPOSIT_SOURCE_TYPES.SESSION_EXTENSION;
      return (
        <span className="deposit-pending-list__parties">
          <span className="deposit-pending-list__client">
            <SafeText tag="span">{toDisplayString(item.clientName, '—')}</SafeText>
            <StatusBadge status={item.status} variant={isExtension ? 'info' : 'warning'}>
              {isExtension ? '회기 추가' : '최초 결제'}
            </StatusBadge>
          </span>
          <SafeText tag="span" className="deposit-pending-list__consultant">
            {toDisplayString(item.consultantName, '—')}
          </SafeText>
        </span>
      );
    }
    if (columnKey === 'payment') {
      const amount = toSafeNumber(item.amount, null);
      const additionalSessions = toSafeNumber(item.additionalSessions, null);
      return (
        <span className="deposit-pending-list__payment">
          {additionalSessions != null ? (
            <strong>{`+${additionalSessions}회기`}</strong>
          ) : null}
          <SafeText tag="span">
            {amount == null ? '—' : `${amount.toLocaleString()}원`}
          </SafeText>
        </span>
      );
    }
    if (columnKey === 'action') {
      const isProcessing = processingItemId === item.id;
      return (
        <CardActionGroup>
          <ActionButton
            size="small"
            variant="primary"
            onClick={() => onItemAction?.(item)}
            loading={isProcessing}
            disabled={Boolean(processingItemId)}
            aria-label={`${toDisplayString(item.clientName, '내담자')} 입금 확인`}
          >
            확인하기
          </ActionButton>
        </CardActionGroup>
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
  viewAllHref: PropTypes.string,
  onItemAction: PropTypes.func,
  processingItemId: PropTypes.string
};

DepositPendingList.defaultProps = {
  items: [],
  viewAllHref: '',
  onItemAction: undefined,
  processingItemId: ''
};

export default DepositPendingList;
