/**
 * 어드민 메시지 발신자 표시 — 웹 `AdminMessageListBlock` senderType SYSTEM 패리티
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { ADMIN_MOBILE_MESSAGES_COPY } from '@/constants/adminMobileScreensCopy';
import { toDisplayString } from '@/utils/safeDisplay';

export type AdminMessageSenderResolveInput = {
  senderType: string;
  senderName: string;
};

/**
 * API 행에서 발신자 표시 라벨을 결정한다. SYSTEM → 「시스템」, 그 외 API senderName 유지.
 */
export function resolveAdminMessageSenderLabel(
  row: AdminMessageSenderResolveInput,
): string {
  if (row.senderType.trim().toUpperCase() === 'SYSTEM') {
    return ADMIN_MOBILE_MESSAGES_COPY.SYSTEM_SENDER;
  }
  const name = row.senderName.trim();
  if (name.length === 0) {
    return '발신자';
  }
  return name;
}

export type AdminMessageNormalizeInput = Record<string, unknown>;

/**
 * 어드민 전체 메시지 API 행 정규화용 senderType·표시용 senderName
 */
export function normalizeAdminMessageSenderFields(raw: AdminMessageNormalizeInput): {
  senderType: string;
  senderName: string;
} {
  const senderType = toDisplayString(raw.senderType, '');
  const apiSenderName = toDisplayString(raw.senderName, '');
  const senderName = resolveAdminMessageSenderLabel({ senderType, senderName: apiSenderName });
  return { senderType, senderName };
}
