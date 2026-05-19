/**
 * ShopCategoryTabs — PLP 카테고리 탭
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React from 'react';
import { SHOP_CATEGORY_TABS } from '../../../constants/clientShopConstants';

/**
 * @param {{ activeKey: string, onChange: (key: string) => void }} props
 */
const ShopCategoryTabs = ({ activeKey, onChange }) => (
  <div className="client-shop__tabs" role="tablist" aria-label="상품 카테고리">
    {SHOP_CATEGORY_TABS.map((tab) => (
      <button
        key={tab.key}
        type="button"
        role="tab"
        aria-selected={activeKey === tab.key}
        className={`client-shop__tab${activeKey === tab.key ? ' client-shop__tab--active' : ''}`}
        onClick={() => onChange(tab.key)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default ShopCategoryTabs;
