/**
 * TenantComponent 플래그 가드 — 내담자 쇼핑·리워드 라우트
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  CLIENT_REWARD_UNAVAILABLE_COPY,
  CLIENT_SHOP_SESSION_LOADING_COPY,
  CLIENT_SHOP_TEST_IDS,
  CLIENT_SHOP_UNAVAILABLE_COPY
} from '../../../constants/clientShopConstants';
import { PLATFORM_COMPONENT_CODES } from '../../../constants/tenantComponentApi';
import { useSession } from '../../../contexts/SessionContext';
import { useTenantComponentFlags } from '../../../hooks/useTenantComponentFlags';
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
  const { isLoading: sessionLoading, hasCheckedSession } = useSession();
  const sessionAwaiting = !hasCheckedSession || sessionLoading;

  const enabled = useMemo(() => {
    if (componentCode === PLATFORM_COMPONENT_CODES.CLIENT_SHOP) {
      return clientShopEnabled;
    }
    if (componentCode === PLATFORM_COMPONENT_CODES.CLIENT_REWARD) {
      return clientRewardEnabled;
    }
    return true;
  }, [componentCode, clientShopEnabled, clientRewardEnabled]);

  if (flagsLoading || flagsFetchFailed || sessionAwaiting || enabled === undefined) {
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
      <Link to="/client/home" className="client-shop__cta client-shop__cta--secondary">
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
