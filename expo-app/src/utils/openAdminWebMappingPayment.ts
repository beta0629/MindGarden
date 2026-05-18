/**
 * 어드민 모바일 — 매칭 결제·입금 승인 웹 브릿지 (Secondary fallback)
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { Alert, Linking } from 'react-native';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import {
  adminIntegratedScheduleWebUrl,
  adminMappingManagementPendingPaymentUrl,
} from '@/constants/adminMobileScreensCopy';
import { ADMIN_MAPPING_COPY } from '@/constants/adminMappingCopy';
import { toSafeNumber } from '@/utils/safeDisplay';

export type AdminMappingPaymentWebTarget = 'integratedSchedule' | 'mappingManagementPending';

export {
  canScheduleAdminMapping,
  getScheduleBlockedPaymentHint,
  getWebPaymentCtaLabel,
  isScheduleBlockedByPaymentStatus,
  shouldShowWebPaymentCta,
} from '@/utils/adminMappingSettlement';

export function resolveAdminMappingPaymentWebUrl(
  target: AdminMappingPaymentWebTarget = 'integratedSchedule',
): string {
  if (target === 'mappingManagementPending') {
    return adminMappingManagementPendingPaymentUrl();
  }
  return adminIntegratedScheduleWebUrl();
}

/** `POST /api/v1/admin/mappings` 응답에서 생성 매칭 id 추출 */
export function extractCreatedMappingId(raw: unknown): number | null {
  const inner =
    unwrapApiResponse<Record<string, unknown>>(raw) ??
    (raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : null);
  if (inner == null) {
    return null;
  }
  const id = toSafeNumber(inner.id, Number.NaN);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function openAdminWebIntegratedSchedule(): Promise<boolean> {
  return openAdminWebMappingPayment('integratedSchedule');
}

export async function openAdminWebMappingPayment(
  target: AdminMappingPaymentWebTarget = 'integratedSchedule',
): Promise<boolean> {
  const url = resolveAdminMappingPaymentWebUrl(target);
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(
        ADMIN_MAPPING_COPY.OPEN_WEB_PAYMENT_FAILED_TITLE,
        ADMIN_MAPPING_COPY.OPEN_WEB_PAYMENT_FAILED_BODY,
      );
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert(
      ADMIN_MAPPING_COPY.OPEN_WEB_PAYMENT_FAILED_TITLE,
      ADMIN_MAPPING_COPY.OPEN_WEB_PAYMENT_FAILED_BODY,
    );
    return false;
  }
}
