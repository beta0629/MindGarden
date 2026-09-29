/**
 * ShopClientLayout — 내담자 쇼핑 템플릿
 * Aligns to ClientWebPageShell stage DNA (920 / 36·56·56) · ClientWebTopChrome
 * Top chrome: CLIENT_WEB_NAV + logout — no LNB · no 5-tab shop header
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ClientWebPageShell from '../../client/ClientWebPageShell';
import { CLIENT_SHOP_ROUTES } from '../../../constants/clientShopConstants';
import { useSession } from '../../../contexts/SessionContext';
import {
  fetchShopCart,
  mergeGuestShopCartIntoServer
} from '../../../services/clientShopService';
import {
  getGuestShopCartLines,
  sumCartLineQuantities
} from '../../../utils/guestShopCart';
import '../../../styles/shop/ClientShop.css';
import '../../../styles/shop/ClientMall.css';

/**
 * @param {{
 *   title: string,
 *   children: import('react').ReactNode,
 *   testId?: string,
 *   aside?: import('react').ReactNode,
 *   activeNavId?: string,
 *   cartQty?: number|null,
 *   cartPulse?: boolean,
 *   className?: string,
 *   eyebrow?: string,
 *   meta?: import('react').ReactNode
 * }} props
 */
const ShopClientLayout = ({
  title,
  children,
  testId = 'client-shop',
  aside = null,
  activeNavId = 'shop',
  cartQty = null,
  cartPulse = false,
  className = '',
  eyebrow,
  meta = null
}) => {
  const { isLoggedIn, isLoading, hasCheckedSession } = useSession();
  const [cartBadgeQty, setCartBadgeQty] = useState(0);
  const sessionReady = hasCheckedSession && !isLoading;
  const pageOwnsCart = cartQty != null;

  useEffect(() => {
    if (!sessionReady || pageOwnsCart) {
      return undefined;
    }
    let cancelled = false;

    const loadCartQty = async() => {
      try {
        if (isLoggedIn) {
          try {
            await mergeGuestShopCartIntoServer();
          } catch {
            // 병합 실패해도 서버 카트 조회는 시도
          }
          const cart = await fetchShopCart();
          if (!cancelled) {
            setCartBadgeQty(sumCartLineQuantities(cart?.lines));
          }
          return;
        }
        if (!cancelled) {
          setCartBadgeQty(sumCartLineQuantities(getGuestShopCartLines()));
        }
      } catch {
        if (!cancelled) {
          setCartBadgeQty(0);
        }
      }
    };

    loadCartQty();
    return () => {
      cancelled = true;
    };
  }, [sessionReady, isLoggedIn, pageOwnsCart]);

  return (
    <ClientWebPageShell
      activeNavId={activeNavId}
      title={title}
      eyebrow={eyebrow}
      meta={meta}
      testId={testId}
      className={['client-shop client-shop--clinic-os client-mall', className].filter(Boolean).join(' ')}
      stageClassName="client-shop__stage"
      designShot="clinic-os-client-cart"
      aside={aside}
      loginHref="/login"
      cartBadgeQty={pageOwnsCart ? cartQty : cartBadgeQty}
      cartBadgePulse={cartPulse}
      cartHref={CLIENT_SHOP_ROUTES.CART}
    >
      {children}
    </ClientWebPageShell>
  );
};

ShopClientLayout.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  testId: PropTypes.string,
  aside: PropTypes.node,
  activeNavId: PropTypes.string,
  cartQty: PropTypes.number,
  cartPulse: PropTypes.bool,
  className: PropTypes.string,
  eyebrow: PropTypes.string,
  meta: PropTypes.node
};

export default ShopClientLayout;
