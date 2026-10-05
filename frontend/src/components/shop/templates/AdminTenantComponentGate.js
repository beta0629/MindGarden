/**
 * TenantComponent 플래그 가드 — 어드민 쇼핑몰 라우트
 *
 * @author CoreSolution
 * @since 2026-05-19
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import { ContentArea } from '../../dashboard-v2/content';
import SafeText from '../../common/SafeText';
import FeatureUnavailable from '../../common/molecules/FeatureUnavailable';
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
      <ContentArea className="admin-shop-gate-page" ariaLabel={resolvedLayoutTitle}>
        <AdminShopComponentUnavailablePage
          title={ADMIN_SHOP_CATALOG_UNAVAILABLE_COPY.TITLE}
          description={ADMIN_SHOP_CATALOG_UNAVAILABLE_COPY.DESCRIPTION}
          breadcrumb={resolvedLayoutTitle}
          testId={`admin-tenant-component-gate--${componentCode}`}
        />
      </ContentArea>
    </AdminCommonLayout>
  );
};

function AdminShopComponentUnavailablePage({ title, description, breadcrumb, testId }) {
  return (
    <>
      <nav className="admin-shop-gate__breadcrumb" aria-label="breadcrumb">
        <SafeText>{breadcrumb}</SafeText>
      </nav>
      <div
        className="admin-shop-gate admin-shop-gate__unavailable"
        data-testid={testId}
      >
        <FeatureUnavailable
          title={title}
          description={description}
          actionLabel={ADMIN_SHOP_GATE_BACK_TO_DASHBOARD_LABEL}
          actionHref={ADMIN_ROUTES.DASHBOARD}
        />
      </div>
    </>
  );
}

AdminTenantComponentGate.propTypes = {
  componentCode: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  layoutTitle: PropTypes.string
};

export default AdminTenantComponentGate;
