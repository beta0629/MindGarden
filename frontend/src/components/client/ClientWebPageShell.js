/**
 * ClientWebPageShell — shared client web page shell (header SSOT, no LNB)
 * Used by schedule · sessions · payment (and optionally shop later).
 *
 * @author CoreSolution
 * @since 2026-09-18
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSession } from '../../contexts/SessionContext';
import { useBranding } from '../../hooks/useBranding';
import { useClientWebLogoutConfirm } from '../../hooks/useClientWebLogoutConfirm';
import { resolveClientWebBrandLabels } from '../../utils/clientWebBrandLabels';
import {
  CLIENT_WEB_PAGE_SHELL_CLASS,
  CLIENT_WEB_PAGE_SHELL_TEST_ID
} from '../../constants/clientWebChromeConstants';
import ConfirmModal from '../common/ConfirmModal';
import ClientWebTopChrome from './ClientWebTopChrome';
import './ClientWebPageShell.css';

/**
 * @param {object} props
 * @param {string} props.activeNavId - CLIENT_WEB_NAV id (schedule|sessions|payment|…)
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.testId]
 * @param {string} [props.className]
 */
const ClientWebPageShell = ({
  activeNavId,
  children,
  testId = CLIENT_WEB_PAGE_SHELL_TEST_ID,
  className = ''
}) => {
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

  const rootClass = [
    CLIENT_WEB_PAGE_SHELL_CLASS,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      data-testid={testId}
    >
      <ClientWebTopChrome
        brandWord={brandWord}
        brandCenter={brandCenter}
        userName={user?.name}
        activeNavId={activeNavId}
        onLogout={openConfirm}
        logoutLabel={logoutLabel}
      />
      <div className="client-web-page-shell__body">
        {children}
      </div>
      <ConfirmModal {...confirmProps} />
    </div>
  );
};

ClientWebPageShell.propTypes = {
  activeNavId: PropTypes.string.isRequired,
  children: PropTypes.node,
  testId: PropTypes.string,
  className: PropTypes.string
};

export default ClientWebPageShell;
