import React from 'react';
import UnifiedLoading from '../../common/UnifiedLoading';
import MGCard from '../../common/MGCard';
import MGButton from '../../common/MGButton';
import { 
  ACCOUNT_CSS_CLASSES 
} from '../../../constants/css';
import { 
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_PRIMARY_LABELS,
  ACCOUNT_BUTTON_TEXT,
  ACCOUNT_TABLE_COLUMNS
} from '../../../constants/account';
import './AccountTable.css';

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

  return (
    <div className={ACCOUNT_CSS_CLASSES.ACCOUNT_LIST}>
      <div className="mg-v2-account-cards-grid">
        {accounts.map(account => (
          <MGCard key={account.id} variant="default" className="account-card">
            {/* 카드 헤더 */}
            <div className="account-card__header">
              <h3 className="account-card__title">
                {account.bankName}
              </h3>
              {account.isPrimary && (
                <span className="primary-badge">
                  {ACCOUNT_PRIMARY_LABELS.TRUE}
                </span>
              )}
            </div>
            
            {/* 카드 본문 */}
            <div className="account-card__content">
              <div className="account-card__field">
                <span className="account-card__label">
                  {ACCOUNT_TABLE_COLUMNS.ACCOUNT_NUMBER}
                </span>
                <span className="account-card__value">
                  {account.accountNumber}
                </span>
              </div>
              
              <div className="account-card__field">
                <span className="account-card__label">
                  {ACCOUNT_TABLE_COLUMNS.ACCOUNT_HOLDER}
                </span>
                <span className="account-card__value">
                  {account.accountHolder}
                </span>
              </div>
              
              {account.branchId && (
                <div className="account-card__field">
                  <span className="account-card__label">
                    {ACCOUNT_TABLE_COLUMNS.BRANCH_ID}
                  </span>
                  <span className="account-card__value">
                    {account.branchId}
                  </span>
                </div>
              )}
              
              <div className="account-card__field">
                <span className="account-card__label">
                  {ACCOUNT_TABLE_COLUMNS.STATUS}
                </span>
                <span className={`account-card__status ${account.isActive ? 'active' : 'inactive'}`}>
                  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                  {account.isActive ? ACCOUNT_STATUS_LABELS.ACTIVE : ACCOUNT_STATUS_LABELS.INACTIVE}
                </span>
              </div>
              
              <div className="account-card__field">
                <span className="account-card__label">
                  {ACCOUNT_TABLE_COLUMNS.CREATED_AT}
                </span>
                <span className="account-card__value account-card__value--secondary">
                  {new Date(account.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {/* 카드 액션 (버튼 가로 배치) */}
            <div className="account-card__actions">
              <MGButton
                variant="secondary"
                size="small"
                onClick={() => onEdit(account)}
                preventDoubleClick
              >
                {ACCOUNT_BUTTON_TEXT.EDIT}
              </MGButton>
              <MGButton
                variant="warning"
                size="small"
                onClick={() => onToggleStatus(account.id)}
                preventDoubleClick
              >
                {account.isActive ? ACCOUNT_BUTTON_TEXT.DEACTIVATE : ACCOUNT_BUTTON_TEXT.ACTIVATE}
              </MGButton>
              {!account.isPrimary && (
                <MGButton
                  variant="info"
                  size="small"
                  onClick={() => onSetPrimary(account.id)}
                  preventDoubleClick
                >
                  {ACCOUNT_BUTTON_TEXT.SET_PRIMARY}
                </MGButton>
              )}
              <MGButton
                variant="danger"
                size="small"
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
