/**
 * ShopTenantBanner — 테넌트 배너 placeholder
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React from 'react';
import { SHOP_BANNER_PLACEHOLDER_COPY } from '../../../constants/clientShopConstants';

/**
 * @param {{ tenantLabel?: string|null }} props
 */
const ShopTenantBanner = ({ tenantLabel }) => (
  <header className="client-shop__banner" aria-label="테넌트 안내">
    <h2 className="client-shop__banner-title">
      {tenantLabel ? `${tenantLabel} 온라인 몰` : 'MindGarden 온라인 몰'}
    </h2>
    <p className="client-shop__banner-sub">{SHOP_BANNER_PLACEHOLDER_COPY}</p>
  </header>
);

export default ShopTenantBanner;
