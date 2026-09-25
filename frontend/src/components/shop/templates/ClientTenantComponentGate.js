/**
 * TenantComponent 플래그 가드 — 내담자 쇼핑·리워드 라우트
 *
 * fetchFailed → unavailable(무한 skeleton 금지).
 * 공개 카탈로그(/client/shop · /client/shop/sku/*) 게스트는 플래그 없이
 * ensurePublicShopTenantContext + PublicShopCatalog 흐름으로 통과.
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import {
  CLIENT_REWARD_UNAVAILABLE_COPY,
  CLIENT_SHOP_SESSION_LOADING_COPY,
  CLIENT_SHOP_TEST_IDS,
  CLIENT_SHOP_UNAVAILABLE_COPY
} from '../../../constants/clientShopConstants';
import { CLIENT_DASHBOARD_ROUTES } from '../../../constants/clientDashboardRoutes';
import { PLATFORM_COMPONENT_CODES } from '../../../constants/tenantComponentApi';
import { useSession } from '../../../contexts/SessionContext';
import { useTenantComponentFlags } from '../../../hooks/useTenantComponentFlags';
import { isPublicClientShopPath } from '../../../utils/publicSpaPaths';
import '../../../styles/shop/ClientShop.css';

/**
 * @param {{ componentCode: string, children: import('react').ReactNode }} props
 */
const ClientTenantComponentGate = ({ componentCode, children }) => {
  const {
    loading: flagsLoading,
    fetchFailed: flagsFetchFailed,
    clientShopEnabled,
    clientRewardEnabled
  } = useTenantComponentFlags();
  const { isLoading: sessionLoading, hasCheckedSession, isLoggedIn } = useSession();
  const { pathname } = useLocation();
  const sessionAwaiting = !hasCheckedSession || sessionLoading;
  const publicCatalogPath = isPublicClientShopPath(pathname);

  const enabled = useMemo(() => {
    if (componentCode === PLATFORM_COMPONENT_CODES.CLIENT_SHOP) {
      return clientShopEnabled;
    }
    if (componentCode === PLATFORM_COMPONENT_CODES.CLIENT_REWARD) {
      return clientRewardEnabled;
    }
    return true;
  }, [componentCode, clientShopEnabled, clientRewardEnabled]);

  if (flagsLoading || sessionAwaiting) {
    return (
      <div className="client-shop client-shop__gate-loading" data-testid={CLIENT_SHOP_TEST_IDS.SESSION_LOADING}>
        <p className="client-shop__message">{CLIENT_SHOP_SESSION_LOADING_COPY}</p>
      </div>
    );
  }

  /** 공개 PLP/PDP — 게스트는 TenantComponent flags 없이 카탈로그 진입 */
  if (!isLoggedIn && publicCatalogPath && componentCode === PLATFORM_COMPONENT_CODES.CLIENT_SHOP) {
    return children;
  }

  if (flagsFetchFailed) {
    const copy =
      componentCode === PLATFORM_COMPONENT_CODES.CLIENT_REWARD
        ? CLIENT_REWARD_UNAVAILABLE_COPY
        : CLIENT_SHOP_UNAVAILABLE_COPY;
    return (
      <ShopComponentUnavailablePage
        title={copy.TITLE}
        description={copy.DESCRIPTION}
        testId={`client-tenant-component-gate-fetch-failed--${componentCode}`}
      />
    );
  }

  if (enabled === undefined) {
    return (
      <div className="client-shop client-shop__gate-loading" data-testid={CLIENT_SHOP_TEST_IDS.SESSION_LOADING}>
        <p className="client-shop__message">{CLIENT_SHOP_SESSION_LOADING_COPY}</p>
      </div>
    );
  }

  if (enabled) {
    return children;
  }

  const copy =
    componentCode === PLATFORM_COMPONENT_CODES.CLIENT_REWARD
      ? CLIENT_REWARD_UNAVAILABLE_COPY
      : CLIENT_SHOP_UNAVAILABLE_COPY;

  return (
    <ShopComponentUnavailablePage
      title={copy.TITLE}
      description={copy.DESCRIPTION}
      testId={`client-tenant-component-gate--${componentCode}`}
    />
  );
};

function ShopComponentUnavailablePage({ title, description, testId }) {
  return (
    <div className="client-shop client-shop__gate-unavailable" data-testid={testId}>
      <h1 className="client-shop__page-title">{title}</h1>
      <p className="client-shop__message">{description}</p>
      <Link to={CLIENT_DASHBOARD_ROUTES.DASHBOARD} className="client-shop__cta client-shop__cta--secondary">
        홈으로 돌아가기
      </Link>
    </div>
  );
}

ClientTenantComponentGate.propTypes = {
  componentCode: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

export default ClientTenantComponentGate;
