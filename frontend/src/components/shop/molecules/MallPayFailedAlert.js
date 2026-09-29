/**
 * MallPayFailedAlert — 카드 거절 등 결제 실패 시 결제 화면 상단 빨간 「결제가 완료되지 않았어요」+ 사유.
 * 좁은 화면에서는 결제 패널이 본문 아래에 있으므로 본문 첫머리에 두고, 표시 시 페이지 맨 위로 올린다
 * (sticky 상단 바에 가리지 않도록 페이지 top 으로만 이동, 다음 프레임에도 화면 밖이면 top 재시도).
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import { CLIENT_MALL_CHECKOUT_COPY, CLIENT_MALL_TEST_IDS } from '../../../constants/clientMallConstants';

/**
 * 전역 html { scroll-behavior: smooth } 에서는 'auto' 도 smooth 로 동작하므로 'instant' 로 고정.
 * scrollIntoView(block:'start') 는 알림을 top 0 에 붙여 sticky 상단 바(좁은 화면은 높이 auto) 밑에 깔리므로 쓰지 않는다.
 */
const PAY_FAILED_SCROLL_BEHAVIOR = 'instant';

const scrollPageTop = () => {
  if (typeof window.scrollTo === 'function') {
    window.scrollTo({ top: 0, behavior: PAY_FAILED_SCROLL_BEHAVIOR });
  }
};

const isAlertInViewport = (el) => {
  const rect = el.getBoundingClientRect();
  return rect.top >= 0 && rect.top < window.innerHeight;
};

/**
 * @param {{ reason: string }} props
 */
const MallPayFailedAlert = ({ reason }) => {
  const alertRef = useRef(null);

  useEffect(() => {
    if (!reason || typeof window === 'undefined') {
      return undefined;
    }
    scrollPageTop();
    if (typeof window.requestAnimationFrame !== 'function') {
      return undefined;
    }
    const frameId = window.requestAnimationFrame(() => {
      const el = alertRef.current;
      if (!el || isAlertInViewport(el)) {
        return;
      }
      scrollPageTop();
    });
    return () => {
      if (typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [reason]);

  if (!reason) {
    return null;
  }
  return (
    <div
      ref={alertRef}
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
