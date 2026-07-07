/**
 * AccountTable — ListTableView + EntityRowActions (G2-07 Phase 1-C)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Building2 } from 'lucide-react';
import UnifiedLoading from '../../common/UnifiedLoading';
import {
  ListTableView,
  StatusBadge,
  EntityRowActions,
  ENTITY_ROW_ACTIONS_LAYOUT
} from '../../common';
import SafeText from '../../common/SafeText';
import { ACCOUNT_CSS_CLASSES } from '../../../constants/css';
import {
  ACCOUNT_ARIA,
  ACCOUNT_BUTTON_TEXT,
  ACCOUNT_EMPTY_STATE,
  ACCOUNT_MASK,
  ACCOUNT_PRIMARY_LABELS,
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_TABLE_COLUMNS
} from '../../../constants/account';
import { maskEncryptedDisplay } from '../../../utils/codeHelper';
import { toDisplayString } from '../../../utils/safeDisplay';
import './AccountTable.css';

const TABLE_COLUMNS = [
  { key: 'isPrimary', label: ACCOUNT_TABLE_COLUMNS.PRIMARY },
  { key: 'bankName', label: ACCOUNT_TABLE_COLUMNS.BANK },
  { key: 'accountNumber', label: ACCOUNT_TABLE_COLUMNS.ACCOUNT_NUMBER },
  { key: 'accountHolder', label: ACCOUNT_TABLE_COLUMNS.ACCOUNT_HOLDER },
  { key: 'description', label: ACCOUNT_TABLE_COLUMNS.DESCRIPTION, hideOnMobile: true },
  { key: 'isActive', label: ACCOUNT_TABLE_COLUMNS.STATUS },
  { key: '_actions', label: ACCOUNT_TABLE_COLUMNS.ACTIONS }
];

/**
 * EntityRowActions primary·overflow 구성 (G2-07 SSOT)
 * @param {object} account
 * @param {object} handlers
 * @returns {{ primaryAction: object, items: object[] }}
 */
export const buildAccountRowActions = (account, { onEdit, onDelete, onToggleStatus, onSetPrimary }) => {
  const items = [
    {
      id: 'set-primary',
      label: ACCOUNT_BUTTON_TEXT.SET_PRIMARY,
      onClick: () => onSetPrimary(account.id),
      hidden: Boolean(account.isPrimary)
    },
    {
      id: 'toggle-status',
      label: ACCOUNT_BUTTON_TEXT.TOGGLE_STATUS,
      onClick: () => onToggleStatus(account.id)
    },
    {
      id: 'delete',
      label: ACCOUNT_BUTTON_TEXT.DELETE,
      onClick: () => onDelete(account.id),
      variant: 'destructive'
    }
  ];

  return {
    primaryAction: {
      label: ACCOUNT_BUTTON_TEXT.EDIT,
      onClick: () => onEdit(account)
    },
    items
  };
};

const AccountTable = ({
  accounts,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  onSetPrimary
}) => {
  const renderAccountActions = useCallback((account) => {
    const config = buildAccountRowActions(account, {
      onEdit,
      onDelete,
      onToggleStatus,
      onSetPrimary
    });
    return (
      <EntityRowActions
        layout={ENTITY_ROW_ACTIONS_LAYOUT.TABLE}
        ariaLabel={ACCOUNT_ARIA.ROW_ACTIONS}
        {...config}
      />
    );
  }, [onEdit, onDelete, onToggleStatus, onSetPrimary]);

  const renderCell = useCallback((columnKey, account) => {
    if (columnKey === '_actions') {
      return renderAccountActions(account);
    }
    if (columnKey === 'isPrimary') {
      return account.isPrimary ? (
        <StatusBadge variant="info">{ACCOUNT_PRIMARY_LABELS.TRUE}</StatusBadge>
      ) : (
        <SafeText tag="span">—</SafeText>
      );
    }
    if (columnKey === 'bankName') {
      const bankLabel = toDisplayString(account.bankName);
      const iconSrc = toDisplayString(account.bankIcon || account.icon, '');
      return (
        <span className="mg-v2-account-table__bank">
          {iconSrc ? (
            <img
              src={iconSrc}
              alt=""
              className="mg-v2-account-table__bank-icon"
              aria-hidden="true"
            />
          ) : (
            <Building2 size={16} className="mg-v2-account-table__bank-icon-fallback" aria-hidden="true" />
          )}
          <SafeText tag="span">{bankLabel}</SafeText>
        </span>
      );
    }
    if (columnKey === 'accountNumber') {
      return (
        <SafeText tag="span">
          {maskEncryptedDisplay(
            toDisplayString(account.accountNumber, ''),
            ACCOUNT_MASK.NUMBER
          )}
        </SafeText>
      );
    }
    if (columnKey === 'accountHolder') {
      return (
        <SafeText tag="span">
          {maskEncryptedDisplay(
            toDisplayString(account.accountHolder, ''),
            ACCOUNT_MASK.HOLDER
          )}
        </SafeText>
      );
    }
    if (columnKey === 'description') {
      return <SafeText tag="span">{toDisplayString(account.description, '—')}</SafeText>;
    }
    if (columnKey === 'isActive') {
      return (
        <StatusBadge variant={account.isActive ? 'success' : 'neutral'}>
          {account.isActive ? ACCOUNT_STATUS_LABELS.ACTIVE : ACCOUNT_STATUS_LABELS.INACTIVE}
        </StatusBadge>
      );
    }
    const value = account[columnKey];
    return <SafeText tag="span">{toDisplayString(value, '—')}</SafeText>;
  }, [renderAccountActions]);

  const tableData = useMemo(() => accounts, [accounts]);

  if (loading) {
    return (
      <div className={ACCOUNT_CSS_CLASSES.ACCOUNT_LIST}>
        <UnifiedLoading
          type="inline"
          text={ACCOUNT_BUTTON_TEXT.PROCESSING}
          variant="pulse"
        />
      </div>
    );
  }

  if (!accounts.length) {
    return (
      <div className={ACCOUNT_CSS_CLASSES.ACCOUNT_LIST}>
        <div className="mg-v2-account-list-empty" role="status">
          <p className="mg-v2-account-list-empty__title">{ACCOUNT_EMPTY_STATE.TITLE}</p>
          <p className="mg-v2-account-list-empty__desc">{ACCOUNT_EMPTY_STATE.DESCRIPTION}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={ACCOUNT_CSS_CLASSES.ACCOUNT_LIST}>
      <ListTableView
        className="mg-v2-account-table"
        columns={TABLE_COLUMNS}
        data={tableData}
        renderCell={renderCell}
      />
    </div>
  );
};

AccountTable.propTypes = {
  accounts: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  onSetPrimary: PropTypes.func.isRequired
};

AccountTable.defaultProps = {
  loading: false
};

export default AccountTable;
