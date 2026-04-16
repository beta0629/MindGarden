import React from 'react';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../../utils/safeDisplay';
import './DepositPendingList.css';

/**
 * 입금 확인 대기 목록 (Atomic: organism)
 *
 * @param {Object} props
 * @param {Array<{id:string,clientName?:string,amount?:number,mappingId?:string}>} props.items - 대기 항목
 * @param {Function} props.onDepositConfirm - 입금 확인 핸들러 (itemId) => void
 * @author Core Solution
 * @since 2025-02-21
 */
const DepositPendingList = ({ items = [], onDepositConfirm }) => {
  if (items.length === 0) return null;

  return (
    <section className="deposit-pending-list">
      <header className="deposit-pending-list__header">
        <h3 className="deposit-pending-list__title">입금 확인 대기</h3>
      </header>
      <ul className="deposit-pending-list__items">
        {items.map((item) => (
          <li key={item.id} className="deposit-pending-list__item">
            <div className="deposit-pending-list__info">
              <span className="deposit-pending-list__name">
                {toDisplayString(item.clientName, '-')}
              </span>
              {item.amount != null && (
                <span className="deposit-pending-list__amount">
                  {item.amount.toLocaleString()}원
                </span>
              )}
            </div>
            <MGButton
              variant="primary"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'sm',
                loading: false
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => onDepositConfirm && onDepositConfirm(item)}
            >
              확인
            </MGButton>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default DepositPendingList;
