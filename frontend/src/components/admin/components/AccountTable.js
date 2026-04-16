import UnifiedLoading from '../../common/UnifiedLoading';
import MGCard from '../../common/MGCard';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { ACCOUNT_CSS_CLASSES } from '../../../constants/css';
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_PRIMARY_LABELS,
  ACCOUNT_BUTTON_TEXT,
  ACCOUNT_TABLE_COLUMNS,
  ACCOUNT_EMPTY_STATE
} from '../../../constants/account';
import { toDisplayString } from '../../../utils/safeDisplay';
import './AccountTable.css';

const formatCreatedAt = (createdAt) => {
  if (createdAt == null || createdAt === '') {
    return '—';
  }
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return d.toLocaleDateString('ko-KR');
};

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
      <div className="mg-v2-account-cards-grid">
        {accounts.map((account) => (
          <MGCard key={account.id} variant="default" className="account-card">
            <div className="account-card__header">
              <h3 className="account-card__title">{toDisplayString(account.bankName)}</h3>
              {account.isPrimary && (
                <span className="primary-badge">{ACCOUNT_PRIMARY_LABELS.TRUE}</span>
              )}
            </div>

            <div className="account-card__content">
              <div className="account-card__field">
                <span className="account-card__label">{ACCOUNT_TABLE_COLUMNS.ACCOUNT_NUMBER}</span>
                <span className="account-card__value">
                  {toDisplayString(account.accountNumber)}
                </span>
              </div>

              <div className="account-card__field">
                <span className="account-card__label">{ACCOUNT_TABLE_COLUMNS.ACCOUNT_HOLDER}</span>
                <span className="account-card__value">
                  {toDisplayString(account.accountHolder)}
                </span>
              </div>

              {account.branchId ? (
                <div className="account-card__field">
                  <span className="account-card__label">{ACCOUNT_TABLE_COLUMNS.BRANCH_ID}</span>
                  <span className="account-card__value">{account.branchId}</span>
                </div>
              ) : null}

              <div className="account-card__field">
                <span className="account-card__label">{ACCOUNT_TABLE_COLUMNS.STATUS}</span>
                <span
                  className={`account-card__status ${account.isActive ? 'active' : 'inactive'}`}
                >
                  {account.isActive ? ACCOUNT_STATUS_LABELS.ACTIVE : ACCOUNT_STATUS_LABELS.INACTIVE}
                </span>
              </div>

              <div className="account-card__field">
                <span className="account-card__label">{ACCOUNT_TABLE_COLUMNS.CREATED_AT}</span>
                <span className="account-card__value account-card__value--secondary">
                  {formatCreatedAt(account.createdAt)}
                </span>
              </div>
            </div>

            <div className="account-card__actions">
              <MGButton
                variant="secondary"
                size="small"
                className={buildErpMgButtonClassName({
                  variant: 'secondary',
                  size: 'sm',
                  loading: false
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => onEdit(account)}
                preventDoubleClick
              >
                {ACCOUNT_BUTTON_TEXT.EDIT}
              </MGButton>
              <MGButton
                variant="warning"
                size="small"
                className={buildErpMgButtonClassName({
                  variant: 'warning',
                  size: 'sm',
                  loading: false
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => onToggleStatus(account.id)}
                preventDoubleClick
              >
                {account.isActive ? ACCOUNT_BUTTON_TEXT.DEACTIVATE : ACCOUNT_BUTTON_TEXT.ACTIVATE}
              </MGButton>
              {!account.isPrimary && (
                <MGButton
                  variant="info"
                  size="small"
                  className={buildErpMgButtonClassName({
                    variant: 'info',
                    size: 'sm',
                    loading: false
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => onSetPrimary(account.id)}
                  preventDoubleClick
                >
                  {ACCOUNT_BUTTON_TEXT.SET_PRIMARY}
                </MGButton>
              )}
              <MGButton
                variant="danger"
                size="small"
                className={buildErpMgButtonClassName({
                  variant: 'danger',
                  size: 'sm',
                  loading: false
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => onDelete(account.id)}
                preventDoubleClick
              >
                {ACCOUNT_BUTTON_TEXT.DELETE}
              </MGButton>
            </div>
          </MGCard>
        ))}
      </div>
    </div>
  );
};

export default AccountTable;
