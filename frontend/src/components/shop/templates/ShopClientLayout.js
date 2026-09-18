/**
 * ShopClientLayout — 내담자 쇼핑 템플릿
 * Aligns to ClientWebPageShell stage DNA (920 / 36·56·56) · ClientWebTopChrome
 * Top chrome: CLIENT_WEB_NAV + logout — no LNB · no 5-tab shop header
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React from 'react';
import PropTypes from 'prop-types';
import ClientWebPageShell from '../../client/ClientWebPageShell';
import '../../../styles/shop/ClientShop.css';

/**
 * @param {{
 *   title: string,
 *   children: import('react').ReactNode,
 *   testId?: string,
 *   aside?: import('react').ReactNode,
 *   activeNavId?: string
 * }} props
 */
const ShopClientLayout = ({
  title,
  children,
  testId = 'client-shop',
  aside = null,
  activeNavId = 'shop'
}) => (
  <ClientWebPageShell
    activeNavId={activeNavId}
    title={title}
    testId={testId}
    className="client-shop client-shop--clinic-os"
    stageClassName="client-shop__stage"
    designShot="clinic-os-client-cart"
    aside={aside}
    loginHref="/login"
  >
    {children}
  </ClientWebPageShell>
);

ShopClientLayout.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  testId: PropTypes.string,
  aside: PropTypes.node,
  activeNavId: PropTypes.string
};

export default ShopClientLayout;
