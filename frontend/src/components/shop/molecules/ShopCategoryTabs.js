/**
 * ShopCategoryTabs — PLP 카테고리 탭 (MGButton SSOT SegmentedTabs 흡수)
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React from 'react';
import { SHOP_CATEGORY_TABS } from '../../../constants/clientShopConstants';
import SegmentedTabs from '../../common/SegmentedTabs';

/**
 * @param {{ activeKey: string, onChange: (key: string) => void }} props
 */
const ShopCategoryTabs = ({ activeKey, onChange }) => (
  <SegmentedTabs
    ariaLabel="상품 카테고리"
    items={SHOP_CATEGORY_TABS.map((tab) => ({ value: tab.key, label: tab.label }))}
    activeValue={activeKey}
    onChange={onChange}
    size="sm"
    className="client-shop__tabs"
  />
);

export default ShopCategoryTabs;
