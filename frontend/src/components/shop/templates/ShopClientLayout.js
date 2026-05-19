/**
 * ShopClientLayout — 내담자 쇼핑 템플릿 (ClientAppShell 내부)
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { CLIENT_SHOP_ROUTES } from '../../../constants/clientShopConstants';
import { useTenantComponentFlags } from '../../../hooks/useTenantComponentFlags';
import '../../../styles/shop/ClientShop.css';

const ALL_NAV_ITEMS = [
  { to: CLIENT_SHOP_ROUTES.CATALOG, label: '상품' },
  { to: CLIENT_SHOP_ROUTES.CART, label: '장바구니' },
  { to: CLIENT_SHOP_ROUTES.CHECKOUT, label: '결제' },
  { to: CLIENT_SHOP_ROUTES.ORDERS, label: '내 구매' },
  { to: CLIENT_SHOP_ROUTES.POINTS, label: '내 포인트', requiresReward: true }
];

/**
 * @param {{ title: string, children: import('react').ReactNode, testId?: string }} props
 */
const ShopClientLayout = ({ title, children, testId = 'client-shop' }) => {
  const { clientRewardEnabled } = useTenantComponentFlags();

  const navItems = useMemo(
    () => ALL_NAV_ITEMS.filter(
      (item) => !item.requiresReward || clientRewardEnabled !== false
    ),
    [clientRewardEnabled]
  );

  return (
    <div className="client-shop" data-testid={testId}>
      <h1 className="client-shop__page-title">{title}</h1>
      <nav className="client-shop__nav" aria-label="쇼핑 메뉴">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `client-shop__nav-link${isActive ? ' client-shop__nav-link--active' : ''}`
            }
            end={item.to === CLIENT_SHOP_ROUTES.CATALOG}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      {children}
    </div>
  );
};

export default ShopClientLayout;
