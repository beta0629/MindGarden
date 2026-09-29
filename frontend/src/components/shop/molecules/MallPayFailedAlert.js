/**
 * MallPayFailedAlert — 카드 거절 등 결제 실패 시 결제 화면 상단 빨간 「결제가 완료되지 않았어요」+ 사유.
 * 좁은 화면에서는 결제 패널이 본문 아래에 있으므로 본문 첫머리에 두고, 표시 시 페이지 맨 위로 올린다
 * (sticky 상단 바에 가리지 않도록 요소 scrollIntoView 대신 페이지 top).
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import { CLIENT_MALL_CHECKOUT_COPY, CLIENT_MALL_TEST_IDS } from '../../../constants/clientMallConstants';

/**
 * @param {{ reason: string }} props
 */
const MallPayFailedAlert = ({ reason }) => {
  useEffect(() => {
    if (reason && typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [reason]);

  if (!reason) {
    return null;
  }
  return (
    <div
      className="client-mall-alert client-mall-alert--error client-mall-pay-failed"
      role="alert"
      data-testid={CLIENT_MALL_TEST_IDS.CHECKOUT_PAY_FAILED}
    >
      <p className="client-mall-alert__title">{CLIENT_MALL_CHECKOUT_COPY.PAY_FAILED_TITLE}</p>
      <p className="client-mall-alert__body"><SafeText>{reason}</SafeText></p>
    </div>
  );
};

MallPayFailedAlert.propTypes = {
  reason: PropTypes.string
};

export default MallPayFailedAlert;
