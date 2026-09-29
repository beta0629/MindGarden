/**
 * 결제창 취소 후 도착 화면(장바구니·상품 상세)의 amber 안내 표시 상태.
 * router state 로 한 번만 받고, 새로고침·뒤로가기로 다시 뜨지 않게 state 를 비운다.
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CLIENT_MALL_TIMING } from '../constants/clientMallConstants';
import { hasShopPaymentCancelNotice } from '../utils/shopPaymentCancel';

/**
 * @returns {{ visible: boolean, dismiss: () => void }}
 */
const useShopPaymentCancelNotice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(() => hasShopPaymentCancelNotice(location.state));

  useEffect(() => {
    if (!hasShopPaymentCancelNotice(location.state)) {
      return;
    }
    setVisible(true);
    navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: null });
  }, [location.state, location.pathname, location.search, location.hash, navigate]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }
    const timer = setTimeout(() => setVisible(false), CLIENT_MALL_TIMING.PAY_CANCEL_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  const dismiss = useCallback(() => setVisible(false), []);

  return { visible, dismiss };
};

export default useShopPaymentCancelNotice;
