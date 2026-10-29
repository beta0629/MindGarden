/**
 * Clinic-OS 커버+챕터 홈 조립 — `/client/dashboard`
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ConfirmModal from '../../../common/ConfirmModal';
import { useSession } from '../../../../contexts/SessionContext';
import { useBranding } from '../../../../hooks/useBranding';
import { useClientWebLogoutConfirm } from '../../../../hooks/useClientWebLogoutConfirm';
import { toDisplayString, toSafeNumber } from '../../../../utils/safeDisplay';
import { MAPPING_STATUS } from '../../../../constants/mapping';
import {
  CLIENT_COVER_ARIA_LABEL,
  CLIENT_COVER_CHAPTER_TEST_ID,
  CLIENT_COVER_LOADING,
  CLIENT_COVER_MENU_ARIA,
  CLIENT_COVER_SHEET_MODE,
  CLIENT_COVER_SUB_HAS,
  CLIENT_COVER_SUB_PENDING,
  CLIENT_COVER_SUB_QUIET,
  CLIENT_COVER_SUB_UNASSIGNED,
  CLIENT_COVER_SUB_ZERO,
  CLIENT_DASHBOARD_MAIN_ID,
  CLIENT_LOBBY_HERO_PRIORITY,
  CLIENT_LOBBY_LOAD_ERROR,
  CLIENT_LOBBY_PACKAGE_FALLBACK,
  CLIENT_LOBBY_RETRY
} from '../constants';
import {
  countPendingPaymentMappings,
  resolveClientWebBrandLabels,
  resolveCoverSheetMode
} from '../lobbyViewModel';
import ClientWebTopChrome from '../../ClientWebTopChrome';
import CoverPanel from './CoverPanel';
import NextSheet from './NextSheet';
import SessionChapter from './SessionChapter';
import GuideChapter from './GuideChapter';
import ClientMinimalDock from './ClientMinimalDock';
import CoverMenuDrawer from './CoverMenuDrawer';
import {
  COVER_CLINIC_SVG_VARIANT_LANDSCAPE,
  COVER_CLINIC_SVG_VARIANT_PORTRAIT
} from './CoverClinicSvg';
/* parent CSS @import + 번들 엔트리 side-effect — CoverGuideDenseRow SSOT */
import '../../../common/coverChapter/CoverGuideDenseRow.css';
import './ClientCoverChapter.css';

/** 상담사 COVER_CHAPTER_TABLET_SPLIT_MQ 와 동일 — ≥1024(64rem) split */
const CLIENT_COVER_SPLIT_MQ = '(min-width: 64rem)';

/**
 * @returns {boolean}
 */
const getIsSplitLayout = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(CLIENT_COVER_SPLIT_MQ).matches;
};

/**
 * @param {string} heroPriority
 * @param {string} sheetMode
 * @returns {string}
 */
function resolveCoverSub(heroPriority, sheetMode) {
  if (sheetMode === CLIENT_COVER_SHEET_MODE.HAS) {
    return CLIENT_COVER_SUB_HAS;
  }
  if (sheetMode === CLIENT_COVER_SHEET_MODE.ZERO) {
    if (heroPriority === CLIENT_LOBBY_HERO_PRIORITY.PENDING_PAYMENT) {
      return CLIENT_COVER_SUB_PENDING;
    }
    return CLIENT_COVER_SUB_ZERO;
  }
  if (heroPriority === CLIENT_LOBBY_HERO_PRIORITY.CONSULTANT_UNASSIGNED) {
    return CLIENT_COVER_SUB_UNASSIGNED;
  }
  return CLIENT_COVER_SUB_QUIET;
}

/**
 * @param {object} props
 * @param {object|null} props.user
 * @param {string} props.heroPriority
 * @param {object|null} props.nextSchedule
 * @param {number} props.remainingSessions
 * @param {object} props.sessionMeta
 * @param {object} props.paymentSummary
 * @param {Array} props.mappings
 * @param {object} props.consultationData
 * @param {boolean} props.isLoading
 * @param {boolean} props.hasError
 * @param {() => void} props.onRetry
 */
const ClientCoverChapterHome = ({
  user,
  heroPriority,
  nextSchedule,
  remainingSessions,
  sessionMeta,
  paymentSummary,
  mappings,
  consultationData,
  isLoading,
  hasError,
  onRetry
}) => {
  const { user: sessionUser, isLoggedIn } = useSession();
  const effectiveUser = user || sessionUser;
  const effectiveLoggedIn = Boolean(effectiveUser) && isLoggedIn !== false;
  const { brandingInfo } = useBranding({ autoLoad: Boolean(effectiveUser) });
  const { brandWord, brandCenter } = useMemo(
    () => resolveClientWebBrandLabels(effectiveUser, brandingInfo),
    [effectiveUser, brandingInfo]
  );
  const brandLabel = brandCenter || brandWord || '';
  const {
    logoutLabel,
    openConfirm,
    confirmProps
  } = useClientWebLogoutConfirm();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isSplitLayout, setIsSplitLayout] = useState(getIsSplitLayout);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const splitMql = window.matchMedia(CLIENT_COVER_SPLIT_MQ);
    const onChange = () => {
      setIsSplitLayout(getIsSplitLayout());
    };
    setIsSplitLayout(getIsSplitLayout());
    if (typeof splitMql.addEventListener === 'function') {
      splitMql.addEventListener('change', onChange);
      return () => splitMql.removeEventListener('change', onChange);
    }
    splitMql.addListener(onChange);
    return () => splitMql.removeListener(onChange);
  }, []);

  const sheetMode = useMemo(
    () => resolveCoverSheetMode(heroPriority),
    [heroPriority]
  );

  const pendingPaymentCount = useMemo(
    () => countPendingPaymentMappings(mappings),
    [mappings]
  );

  const packageLabel = useMemo(() => {
    const rows = sessionMeta?.rows || [];
    const first = rows.find((r) => r.id !== 'single-sessions') || rows[0];
    return toDisplayString(first?.name, CLIENT_LOBBY_PACKAGE_FALLBACK);
  }, [sessionMeta]);

  const pendingLabel = useMemo(() => {
    const list = Array.isArray(mappings) ? mappings : [];
    const pending = list.find(
      (m) => m?.status === MAPPING_STATUS.PENDING_PAYMENT || m?.paymentStatus === 'PENDING'
    );
    if (!pending) {
      return null;
    }
    return toDisplayString(pending.packageName, CLIENT_LOBBY_PACKAGE_FALLBACK);
  }, [mappings]);

  const recentPaymentLabel = paymentSummary?.recentDateLabel || null;
  const coverSub = resolveCoverSub(heroPriority, sheetMode);
  const userName = toDisplayString(
    effectiveUser?.name || effectiveUser?.nickname,
    ''
  );

  return (
    <div
      className="client-cover"
      data-testid={CLIENT_COVER_CHAPTER_TEST_ID}
      data-sheet-mode={sheetMode}
      data-layout={isSplitLayout ? 'split' : 'stack'}
    >
      <div className="client-cover__chrome">
        <ClientWebTopChrome
          brandWord={brandWord}
          brandCenter={brandCenter}
          nav={null}
          onMenuClick={openMenu}
          menuAriaLabel={CLIENT_COVER_MENU_ARIA}
          className="client-cover__topchrome"
          isLoggedIn={effectiveLoggedIn}
          userName={effectiveLoggedIn ? userName || undefined : undefined}
          onLogout={effectiveLoggedIn ? openConfirm : undefined}
          logoutLabel={logoutLabel}
          loginHref={!effectiveLoggedIn ? '/login' : undefined}
        />
      </div>
      <div className="client-cover__stage">
      <CoverPanel
        brandLabel={brandLabel}
        userName={userName}
        coverSub={coverSub}
        svgVariant={
          isSplitLayout
            ? COVER_CLINIC_SVG_VARIANT_PORTRAIT
            : COVER_CLINIC_SVG_VARIANT_LANDSCAPE
        }
      />
      <div className="client-cover__body">
        {!isLoading && !hasError ? (
          <NextSheet
            sheetMode={sheetMode}
            nextSchedule={nextSchedule}
            remainingSessions={remainingSessions}
            pendingPaymentCount={pendingPaymentCount}
          />
        ) : null}
        <main
          id={CLIENT_DASHBOARD_MAIN_ID}
          className="client-cover__scroll"
          aria-label={CLIENT_COVER_ARIA_LABEL}
        >
          {isLoading ? (
            <p className="client-cover__status" role="status">{CLIENT_COVER_LOADING}</p>
          ) : null}
          {!isLoading && hasError ? (
            <div className="client-cover__error" role="alert">
              <p>{CLIENT_LOBBY_LOAD_ERROR}</p>
              <button
                type="button"
                className="client-cover__error-retry"
                onClick={onRetry}
              >
                {CLIENT_LOBBY_RETRY}
              </button>
            </div>
          ) : null}
          {!isLoading && !hasError ? (
            <div className="client-cover__chapters">
              <SessionChapter
                sheetMode={sheetMode}
                remainingSessions={remainingSessions}
                packageLabel={packageLabel}
                pendingPaymentCount={pendingPaymentCount}
                pendingLabel={pendingLabel}
                recentPaymentLabel={recentPaymentLabel}
                thisMonthCompleted={toSafeNumber(consultationData?.thisMonthScheduleCount)}
                completedCount={toSafeNumber(consultationData?.completedCount)}
              />
              <GuideChapter sheetMode={sheetMode} />
            </div>
          ) : null}
        </main>
        <ClientMinimalDock activeId="home" />
      </div>
      </div>
      <CoverMenuDrawer
        isOpen={menuOpen}
        onClose={closeMenu}
        onLogout={openConfirm}
        logoutLabel={logoutLabel}
      />
      <ConfirmModal {...confirmProps} />
    </div>
  );
};

ClientCoverChapterHome.propTypes = {
  user: PropTypes.object,
  heroPriority: PropTypes.string.isRequired,
  nextSchedule: PropTypes.object,
  remainingSessions: PropTypes.number,
  sessionMeta: PropTypes.object,
  paymentSummary: PropTypes.object,
  mappings: PropTypes.array,
  consultationData: PropTypes.object,
  isLoading: PropTypes.bool,
  hasError: PropTypes.bool,
  onRetry: PropTypes.func
};

export default ClientCoverChapterHome;
