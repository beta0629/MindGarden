/**
 * MoneyRecordModal — 들어온 돈 / 나간 돈 통합 등록 (FinancialTransactionForm 재사용)
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import FinancialTransactionForm from '../../FinancialTransactionForm';
import { FM_MONEY_RECORD } from '../../../../constants/financialManagementStrings';

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {() => void} [props.onSuccess]
 * @param {'INCOME'|'EXPENSE'} [props.defaultType]
 * @param {string|null} [props.initialDate] YYYY-MM-DD create 프리필
 */
const MoneyRecordModal = ({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'INCOME',
  initialDate = null
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <FinancialTransactionForm
      mode="create"
      modalTitle={FM_MONEY_RECORD.TITLE}
      defaultTransactionType={defaultType}
      defaultTransactionDate={initialDate || undefined}
      clinicTypeLabels
      onClose={onClose}
      onSuccess={() => {
        onSuccess?.();
        onClose?.();
      }}
    />
  );
};

MoneyRecordModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  defaultType: PropTypes.oneOf(['INCOME', 'EXPENSE']),
  initialDate: PropTypes.string
};

export default MoneyRecordModal;
