import React from 'react';
import { 
  ACCOUNT_CSS_CLASSES 
} from '../../../constants/css';
import { 
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_PRIMARY_LABELS,
  ACCOUNT_BUTTON_TEXT,
  ACCOUNT_TABLE_COLUMNS
} from '../../../constants/account';

const AccountTable = ({
  accounts,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  onSetPrimary
}) => {
  if (loading) {
    return (
      <div className={ACCOUNT_CSS_CLASSES.ACCOUNT_LIST}>
        <div className="loading">{ACCOUNT_BUTTON_TEXT.PROCESSING}</div>
      </div>
    );
  }

  return (
    <div className={ACCOUNT_CSS_CLASSES.ACCOUNT_LIST}>
      <table className={ACCOUNT_CSS_CLASSES.ACCOUNT_TABLE + ' mg-v2-table'}>
        <thead>
          <tr>
            <th>{ACCOUNT_TABLE_COLUMNS.BANK}</th>
            <th>{ACCOUNT_TABLE_COLUMNS.ACCOUNT_NUMBER}</th>
            <th>{ACCOUNT_TABLE_COLUMNS.ACCOUNT_HOLDER}</th>
            <th>{ACCOUNT_TABLE_COLUMNS.BRANCH_ID}</th>
            <th>{ACCOUNT_TABLE_COLUMNS.STATUS}</th>
            <th>{ACCOUNT_TABLE_COLUMNS.PRIMARY}</th>
            <th>{ACCOUNT_TABLE_COLUMNS.CREATED_AT}</th>
            <th>{ACCOUNT_TABLE_COLUMNS.ACTIONS}</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map(account => (
            <tr key={account.id}>
              <td data-label={ACCOUNT_TABLE_COLUMNS.BANK}>{account.bankName}</td>
              <td data-label={ACCOUNT_TABLE_COLUMNS.ACCOUNT_NUMBER}>{account.accountNumber}</td>
              <td data-label={ACCOUNT_TABLE_COLUMNS.ACCOUNT_HOLDER}>{account.accountHolder}</td>
              <td data-label={ACCOUNT_TABLE_COLUMNS.BRANCH_ID}>{account.branchId || '-'}</td>
              <td data-label={ACCOUNT_TABLE_COLUMNS.STATUS}>
                <span className={`status ${account.isActive ? 'active' : 'inactive'}`}>
                  {account.isActive ? ACCOUNT_STATUS_LABELS.ACTIVE : ACCOUNT_STATUS_LABELS.INACTIVE}
                </span>
              </td>
              <td data-label={ACCOUNT_TABLE_COLUMNS.PRIMARY}>
                {account.isPrimary && <span className="primary-badge">{ACCOUNT_PRIMARY_LABELS.TRUE}</span>}
              </td>
              <td data-label={ACCOUNT_TABLE_COLUMNS.CREATED_AT}>{new Date(account.createdAt).toLocaleDateString()}</td>
              <td data-label={ACCOUNT_TABLE_COLUMNS.ACTIONS}>
                <div className="action-buttons">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => onEdit(account)}
                  >
                    {ACCOUNT_BUTTON_TEXT.EDIT}
                  </button>
                  <button 
                    className="btn btn-sm btn-warning"
                    onClick={() => onToggleStatus(account.id)}
                  >
                    {account.isActive ? ACCOUNT_BUTTON_TEXT.DEACTIVATE : ACCOUNT_BUTTON_TEXT.ACTIVATE}
                  </button>
                  {!account.isPrimary && (
                    <button 
                      className="btn btn-sm btn-info"
                      onClick={() => onSetPrimary(account.id)}
                    >
                      {ACCOUNT_BUTTON_TEXT.SET_PRIMARY}
                    </button>
                  )}
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => onDelete(account.id)}
                  >
                    {ACCOUNT_BUTTON_TEXT.DELETE}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AccountTable;
