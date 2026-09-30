/**
 * MallPaymentCancelNotice — 「결제를 취소했어요. 다시 결제할 수 있어요.」 상단 amber 한 줄 (닫기·자동 닫힘은 훅)
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import { CLIENT_MALL_PAY_CANCEL_COPY, CLIENT_MALL_TEST_IDS } from '../../../constants/clientMallConstants';
import { ICONS, ICON_SIZES } from '../../../constants/icons';

const CloseIcon = ICONS.X;

/**
 * @param {{ visible: boolean, onClose: () => void }} props
 */
const MallPaymentCancelNotice = ({ visible, onClose }) => {
  if (!visible) {
    return null;
  }
  return (
    <div
      className="client-mall-alert client-mall-alert--warn client-mall-alert--notice"
      role="status"
      aria-live="polite"
      data-testid={CLIENT_MALL_TEST_IDS.PAY_CANCEL_NOTICE}
    >
      <p className="client-mall-alert__title">{CLIENT_MALL_PAY_CANCEL_COPY.NOTICE}</p>
      <button
        type="button"
        className="client-mall-alert__close"
        aria-label={CLIENT_MALL_PAY_CANCEL_COPY.CLOSE}
        onClick={onClose}
        data-testid={CLIENT_MALL_TEST_IDS.PAY_CANCEL_NOTICE_CLOSE}
      >
        {CloseIcon ? <CloseIcon size={ICON_SIZES.SM} aria-hidden /> : CLIENT_MALL_PAY_CANCEL_COPY.CLOSE}
      </button>
    </div>
  );
};

MallPaymentCancelNotice.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default MallPaymentCancelNotice;
