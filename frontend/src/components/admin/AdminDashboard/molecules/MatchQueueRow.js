import React from 'react';
import { ArrowRight } from 'lucide-react';
import CustomSelect from '../../../common/CustomSelect';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../../utils/safeDisplay';
import './MatchQueueRow.css';

/**
 * 매칭 대기열 행 (Atomic: molecule)
 * 내담자 정보 + 상담사 선택 + 확인 버튼
 *
 * @param {Object} props
 * @param {string} props.clientName - 내담자 이름
 * @param {string} [props.clientMeta] - 내담자 부가 정보
 * @param {Array<{value:string,label:string}>} props.consultantOptions - 상담사 옵션
 * @param {string} props.selectedConsultant - 선택된 상담사 ID
 * @param {Function} props.onSelectConsultant - 상담사 선택 핸들러
 * @param {Function} props.onConfirm - 확인 버튼 핸들러
 * @param {boolean} [props.loading] - 로딩 상태
 * @author Core Solution
 * @since 2025-02-21
 */
const MatchQueueRow = ({
  clientName,
  clientMeta,
  consultantOptions = [],
  selectedConsultant,
  onSelectConsultant,
  onConfirm,
  loading = false
}) => {
  const isConfirmDisabled = !selectedConsultant || loading;

  return (
    <div className="match-queue-row">
      <div className="match-queue-row__client">
        <div className="match-queue-row__client-name">
          {toDisplayString(clientName, '—')}
        </div>
        {clientMeta != null && clientMeta !== '' && (
          <div className="match-queue-row__client-meta">
            {toDisplayString(clientMeta, '')}
          </div>
        )}
      </div>
      <div className="match-queue-row__arrow" aria-hidden>
        <ArrowRight size={18} />
      </div>
      <div className="match-queue-row__actions">
        <div className="match-queue-row__select">
          <CustomSelect
            options={consultantOptions}
            value={selectedConsultant}
            onChange={onSelectConsultant}
            placeholder="상담사 선택"
            disabled={loading}
            loading={loading}
          />
        </div>
        <MGButton
          variant="primary"
          size="small"
          onClick={onConfirm}
          loading={loading}
          disabled={isConfirmDisabled}
          className={buildErpMgButtonClassName({
            variant: 'primary',
            size: 'sm',
            loading: loading,
            className: 'match-queue-row__assign-btn'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        >
          배정
        </MGButton>
      </div>
    </div>
  );
};

export default MatchQueueRow;
