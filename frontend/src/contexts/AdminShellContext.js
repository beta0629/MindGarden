/**
 * Operator Admin 영속 셸 Context
 * - AdminCommonLayout이 셸을 한 번만 마운트하고, 중첩 페이지의 AdminCommonLayout은 passthrough
 * - setShellMeta로 title/loading 등만 상위 셸에 전달
 *
 * @author Core Solution
 * @since 2026-09-08
 */

import { createContext, useContext } from 'react';

/**
 * @typedef {Object} AdminShellMeta
 * @property {string} [title]
 * @property {boolean} [loading]
 * @property {string} [loadingText]
 * @property {string} [className]
 * @property {string} [searchValue]
 * @property {Function} [onSearchChange]
 * @property {Function} [onBellClick]
 * @property {Function} [onLogout]
 */

/**
 * @typedef {Object} AdminShellContextValue
 * @property {true} isInsideAdminShell
 * @property {(meta: AdminShellMeta) => void} setShellMeta
 */

/** @type {import('react').Context<AdminShellContextValue | null>} */
export const AdminShellContext = createContext(null);

/**
 * Admin 영속 셸 내부 여부·메타 API
 * @returns {AdminShellContextValue | null}
 */
export function useAdminShell() {
  return useContext(AdminShellContext);
}

/**
 * @returns {boolean}
 */
export function useIsInsideAdminShell() {
  const shell = useAdminShell();
  return Boolean(shell?.isInsideAdminShell);
}
