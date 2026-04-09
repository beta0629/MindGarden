/** ERP 승인 허브 단일 경로 (쿼리 mode=admin|super) */
export const ERP_APPROVALS_HUB_PATH = '/erp/approvals';

export const APPROVAL_HUB_MODE_ADMIN = 'admin';
export const APPROVAL_HUB_MODE_SUPER = 'super';

/**
 * 승인 허브 URL 생성 (mode 기본·정규화)
 *
 * @param {typeof APPROVAL_HUB_MODE_ADMIN | typeof APPROVAL_HUB_MODE_SUPER} mode
 * @returns {string}
 */
export function buildErpApprovalHubPath(mode) {
  const normalized =
    mode === APPROVAL_HUB_MODE_SUPER ? APPROVAL_HUB_MODE_SUPER : APPROVAL_HUB_MODE_ADMIN;
  return `${ERP_APPROVALS_HUB_PATH}?mode=${normalized}`;
}
