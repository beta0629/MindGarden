/**
 * Client web logout confirm — ConfirmModal wiring shared by lobby · shop
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import { useCallback, useState } from 'react';
import { useSession } from '../contexts/SessionContext';
import {
  CLIENT_WEB_LOGOUT,
  CLIENT_WEB_LOGOUT_CANCEL,
  CLIENT_WEB_LOGOUT_CONFIRM
} from '../constants/clientWebChromeConstants';

/**
 * @returns {{
 *   logoutLabel: string,
 *   confirmOpen: boolean,
 *   openConfirm: () => void,
 *   closeConfirm: () => void,
 *   confirmLogout: () => Promise<void>,
 *   confirmProps: {
 *     isOpen: boolean,
 *     onClose: () => void,
 *     onConfirm: () => Promise<void>,
 *     title: string,
 *     message: string,
 *     confirmText: string,
 *     cancelText: string,
 *     type: string
 *   }
 * }}
 */
export function useClientWebLogoutConfirm() {
  const { logout } = useSession();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const openConfirm = useCallback(() => {
    setConfirmOpen(true);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  const confirmLogout = useCallback(async() => {
    // sessionManager.logout()가 로그인 리다이렉트를 처리함 — navigate 금지
    await logout();
  }, [logout]);

  return {
    logoutLabel: CLIENT_WEB_LOGOUT,
    confirmOpen,
    openConfirm,
    closeConfirm,
    confirmLogout,
    confirmProps: {
      isOpen: confirmOpen,
      onClose: closeConfirm,
      onConfirm: confirmLogout,
      title: CLIENT_WEB_LOGOUT,
      message: CLIENT_WEB_LOGOUT_CONFIRM,
      confirmText: CLIENT_WEB_LOGOUT,
      cancelText: CLIENT_WEB_LOGOUT_CANCEL,
      type: 'danger'
    }
  };
}

export default useClientWebLogoutConfirm;
