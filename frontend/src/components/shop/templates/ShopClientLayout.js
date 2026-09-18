/**
 * ShopClientLayout — 내담자 쇼핑 템플릿
 * Clinic-OS: client-shop--clinic-os (ink/slate, no page max-width)
 * Top chrome: shared ClientWebTopChrome (CLIENT_WEB_NAV + logout) — no LNB · no 5-tab shop header
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useMemo } from 'react';
import { useSession } from '../../../contexts/SessionContext';
import { useBranding } from '../../../hooks/useBranding';
import { useClientWebLogoutConfirm } from '../../../hooks/useClientWebLogoutConfirm';
import { resolveClientWebBrandLabels } from '../../../utils/clientWebBrandLabels';
import ClientWebTopChrome from '../../client/ClientWebTopChrome';
import ConfirmModal from '../../common/ConfirmModal';
import '../../../styles/shop/ClientShop.css';

/**
 * @param {{ title: string, children: import('react').ReactNode, testId?: string }} props
 */
const ShopClientLayout = ({ title, children, testId = 'client-shop' }) => {
  const { user } = useSession();
  const { brandingInfo } = useBranding({ autoLoad: Boolean(user) });
  const { brandWord, brandCenter } = useMemo(
    () => resolveClientWebBrandLabels(user, brandingInfo),
    [user, brandingInfo]
  );
  const {
    logoutLabel,
    openConfirm,
    confirmProps
  } = useClientWebLogoutConfirm();

  return (
    <div
      className="client-shop client-shop--clinic-os"
      data-testid={testId}
      data-design-shot="clinic-os-client-cart"
    >
      <ClientWebTopChrome
        brandWord={brandWord}
        brandCenter={brandCenter}
        userName={user?.name}
        activeNavId="shop"
        onLogout={openConfirm}
        logoutLabel={logoutLabel}
      />
      <header className="client-shop__header">
        <h1 className="client-shop__page-title">{title}</h1>
      </header>
      <div className="client-shop__stage">{children}</div>
      <ConfirmModal {...confirmProps} />
    </div>
  );
};

export default ShopClientLayout;
