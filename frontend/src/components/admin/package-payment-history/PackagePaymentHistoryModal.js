/**
 * PackagePaymentHistoryModal — UnifiedModal 쉘 + PackagePaymentHistoryList
 *
 * @author MindGarden
 * @since 2026-07-28
 */

import React from 'react';
import PropTypes from 'prop-types';
import UnifiedModal from '../../common/modals/UnifiedModal';
import { PACKAGE_PAYMENT_HISTORY_UI } from '../../../constants/packagePaymentHistory';
import PackagePaymentHistoryList from './PackagePaymentHistoryList';

const PackagePaymentHistoryModal = ({
  isOpen,
  onClose,
  clientId
}) => (
  <UnifiedModal
    isOpen={isOpen}
    onClose={onClose}
    title={PACKAGE_PAYMENT_HISTORY_UI.MODAL_TITLE}
    size="medium"
    variant="detail"
  >
    {isOpen && clientId != null ? (
      <PackagePaymentHistoryList clientId={clientId} showAdminDetails />
    ) : null}
  </UnifiedModal>
);

PackagePaymentHistoryModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  clientId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

PackagePaymentHistoryModal.defaultProps = {
  isOpen: false,
  clientId: null
};

export default PackagePaymentHistoryModal;
