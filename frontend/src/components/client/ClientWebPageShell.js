/**
 * ClientWebPageShell — shared client web page shell (header SSOT, no LNB)
 * Stage DNA: max-width 920 · pad 36/56/56 · optional main+aside grid
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
import { CLIENT_WEB_SUITE_TEST_IDS } from '../../constants/clientWebSuiteConstants';
import ConfirmModal from '../common/ConfirmModal';
import SafeText from '../common/SafeText';
import ClientWebTopChrome from './ClientWebTopChrome';
import './ClientWebPageShell.css';

/**
 * @param {object} props
 * @param {string} [props.activeNavId] - CLIENT_WEB_NAV id (home|schedule|sessions|shop|payment)
 * @param {import('react').ReactNode} [props.children] - main slot when `main` omitted
 * @param {import('react').ReactNode} [props.main]
 * @param {import('react').ReactNode} [props.aside] - omit/null → single-column stage
 * @param {import('react').ReactNode} [props.beforeStage] - e.g. lobby photo strip
 * @param {string} [props.title]
 * @param {string} [props.eyebrow]
 * @param {import('react').ReactNode} [props.meta]
 * @param {string} [props.titleId]
 * @param {boolean} [props.wrapStage=true]
 * @param {string} [props.testId]
 * @param {string} [props.className]
 * @param {string} [props.stageClassName]
 * @param {string} [props.loginHref] - guest header login path
 * @param {number|null|undefined} [props.cartBadgeQty]
 * @param {string} [props.cartHref]
 * @param {string} [props.designShot]
 */
const ClientWebPageShell = ({
  activeNavId,
  children,
  main,
  aside = null,
  beforeStage = null,
  title,
  eyebrow,
  meta = null,
  titleId,
  wrapStage = true,
  testId = CLIENT_WEB_PAGE_SHELL_TEST_ID,
  className = '',
  stageClassName = '',
  loginHref,
  cartBadgeQty = null,
  cartHref,
  designShot
}) => {
  const { user, isLoggedIn } = useSession();
  const effectiveLoggedIn = Boolean(user) && isLoggedIn !== false;
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

  const showAside = aside != null && aside !== false;
  const mainContent = main != null ? main : children;
  const hasPageHead = Boolean(title || eyebrow || meta);
  const gridClass = [
    'client-web-page-shell__grid',
    showAside ? '' : 'client-web-page-shell__grid--single'
  ].filter(Boolean).join(' ');

  const stageInner = (
    <>
      {hasPageHead ? (
        <header
          className="client-web-page-shell__page-head"
          data-testid={CLIENT_WEB_SUITE_TEST_IDS.PAGE_HEAD}
        >
          {eyebrow ? (
            <p className="client-web-page-shell__eyebrow">
              <SafeText>{eyebrow}</SafeText>
            </p>
          ) : null}
          {title ? (
            <h1
              className="client-web-page-shell__title"
              id={titleId || undefined}
            >
              <SafeText>{title}</SafeText>
            </h1>
          ) : null}
          {meta}
        </header>
      ) : null}
      <div
        className={gridClass}
        data-testid={CLIENT_WEB_SUITE_TEST_IDS.GRID}
      >
        <div
          className="client-web-page-shell__main"
          data-testid={CLIENT_WEB_SUITE_TEST_IDS.MAIN}
        >
          {mainContent}
        </div>
        {showAside ? (
          <aside
            className="client-web-page-shell__aside"
            data-testid={CLIENT_WEB_SUITE_TEST_IDS.ASIDE}
          >
            {aside}
          </aside>
        ) : null}
      </div>
    </>
  );

  return (
    <div
      className={rootClass}
      data-testid={testId}
      data-design-shot={designShot || undefined}
    >
      <ClientWebTopChrome
        brandWord={brandWord}
        brandCenter={brandCenter}
        userName={effectiveLoggedIn ? user?.name : undefined}
        activeNavId={activeNavId}
        onLogout={effectiveLoggedIn ? openConfirm : undefined}
        logoutLabel={logoutLabel}
        loginHref={!effectiveLoggedIn ? loginHref : undefined}
        cartBadgeQty={cartBadgeQty}
        cartHref={cartHref}
      />
      <div className="client-web-page-shell__body">
        {beforeStage}
        {wrapStage ? (
          <div
            className={[
              'client-web-page-shell__stage',
              stageClassName
            ].filter(Boolean).join(' ')}
            data-testid={CLIENT_WEB_SUITE_TEST_IDS.STAGE}
          >
            {stageInner}
          </div>
        ) : (
          children
        )}
      </div>
      <ConfirmModal {...confirmProps} />
    </div>
  );
};

ClientWebPageShell.propTypes = {
  activeNavId: PropTypes.string,
  children: PropTypes.node,
  main: PropTypes.node,
  aside: PropTypes.node,
  beforeStage: PropTypes.node,
  title: PropTypes.string,
  eyebrow: PropTypes.string,
  meta: PropTypes.node,
  titleId: PropTypes.string,
  wrapStage: PropTypes.bool,
  testId: PropTypes.string,
  className: PropTypes.string,
  stageClassName: PropTypes.string,
  loginHref: PropTypes.string,
  cartBadgeQty: PropTypes.number,
  cartHref: PropTypes.string,
  designShot: PropTypes.string
};

export default ClientWebPageShell;
