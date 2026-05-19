/**
 * TenantComponent 플래그 가드 — 어드민 쇼핑몰 라우트
 *
 * @author CoreSolution
 * @since 2026-05-19
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import { ContentArea } from '../../dashboard-v2/content';
import SafeText from '../../common/SafeText';
import {
  ADMIN_SHOP_CATALOG_UNAVAILABLE_COPY,
  ADMIN_SHOP_GATE_BACK_TO_DASHBOARD_LABEL,
  ADMIN_SHOP_GATE_LAYOUT_TITLE
} from '../../../constants/adminShopCopy';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes';
import { PLATFORM_COMPONENT_CODES } from '../../../constants/tenantComponentApi';
import { useTenantComponentFlags } from '../../../hooks/useTenantComponentFlags';
import '../../../styles/unified-design-tokens.css';
import '../../../styles/shop/AdminShopGate.css';

/**
 * @param {{ componentCode: string, children: import('react').ReactNode, layoutTitle?: string }} props
 */
const AdminTenantComponentGate = ({ componentCode, children, layoutTitle }) => {
  const { loading, adminShopCatalogEnabled } = useTenantComponentFlags();

  const enabled = useMemo(() => {
    if (componentCode === PLATFORM_COMPONENT_CODES.ADMIN_SHOP_CATALOG) {
      return adminShopCatalogEnabled;
    }
    return true;
  }, [componentCode, adminShopCatalogEnabled]);

  if (loading || enabled === undefined || enabled) {
    return children;
  }

  const resolvedLayoutTitle = layoutTitle || ADMIN_SHOP_GATE_LAYOUT_TITLE;

  return (
    <AdminCommonLayout title={resolvedLayoutTitle}>
      <ContentArea>
        <AdminShopComponentUnavailablePage
          title={ADMIN_SHOP_CATALOG_UNAVAILABLE_COPY.TITLE}
          description={ADMIN_SHOP_CATALOG_UNAVAILABLE_COPY.DESCRIPTION}
          testId={`admin-tenant-component-gate--${componentCode}`}
        />
      </ContentArea>
    </AdminCommonLayout>
  );
};

function AdminShopComponentUnavailablePage({ title, description, testId }) {
  return (
    <section
      className="admin-shop-gate admin-shop-gate__unavailable"
      data-testid={testId}
      aria-labelledby="admin-shop-gate-title"
    >
      <h1 id="admin-shop-gate-title" className="admin-shop-gate__title">
        <SafeText tag="span">{title}</SafeText>
      </h1>
      <p className="admin-shop-gate__message">
        <SafeText tag="span">{description}</SafeText>
      </p>
      <Link
        to={ADMIN_ROUTES.DASHBOARD}
        className="admin-shop-gate__nav-link"
      >
        {ADMIN_SHOP_GATE_BACK_TO_DASHBOARD_LABEL}
      </Link>
    </section>
  );
}

AdminTenantComponentGate.propTypes = {
  componentCode: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  layoutTitle: PropTypes.string
};

export default AdminTenantComponentGate;
