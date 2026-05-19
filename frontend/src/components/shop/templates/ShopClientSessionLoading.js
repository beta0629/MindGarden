/**
 * ShopClientSessionLoading — 세션 확인·로그인 리다이렉트 대기 UI
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React from 'react';
import ShopClientLayout from './ShopClientLayout';
import {
  CLIENT_SHOP_SESSION_LOADING_COPY,
  CLIENT_SHOP_TEST_IDS
} from '../../../constants/clientShopConstants';

/**
 * @param {{ title: string }} props
 */
const ShopClientSessionLoading = ({ title }) => (
  <ShopClientLayout title={title} testId={CLIENT_SHOP_TEST_IDS.SESSION_LOADING}>
    <p className="client-shop__message">{CLIENT_SHOP_SESSION_LOADING_COPY}</p>
  </ShopClientLayout>
);

export default ShopClientSessionLoading;
