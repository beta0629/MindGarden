/**
 * 신규 매칭 POST body — 웹 MappingCreationModal SSOT
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { format } from 'date-fns';
import { ADMIN_MAPPING_DEFAULTS } from '@/constants/adminMappingCopy';

export type AdminMappingPaymentFormInput = {
  readonly totalSessions: number;
  readonly packageName: string;
  readonly packagePrice: number;
  readonly paymentMethod: string;
  readonly paymentReference: string;
  readonly responsibility: string;
  readonly specialConsiderations?: string;
  readonly notes?: string;
};

export type AdminMappingCreateFormInput = {
  readonly consultantId: number;
  readonly clientId: number;
  readonly payment: AdminMappingPaymentFormInput;
};

export type AdminMappingCreateRequestBody = {
  readonly consultantId: number;
  readonly clientId: number;
  readonly startDate: string;
  readonly status: 'PENDING_PAYMENT';
  readonly notes: string;
  readonly responsibility: string;
  readonly specialConsiderations: string;
  readonly paymentStatus: 'PENDING';
  readonly totalSessions: number;
  readonly remainingSessions: number;
  readonly packageName: string;
  readonly packagePrice: number;
  readonly paymentAmount: number;
  readonly paymentMethod: string;
  readonly paymentReference: string;
  readonly mappingType: 'NEW';
};

/** 웹 MappingCreationModal.generateReferenceNumber */
export function generateMappingPaymentReference(
  method: string = ADMIN_MAPPING_DEFAULTS.PAYMENT_METHOD,
): string {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${y}${mo}${d}_${h}${mi}${s}`;
  if (method === 'CASH') {
    return `CASH_${timestamp}`;
  }
  if (method === 'CARD') {
    return `CARD_${timestamp}`;
  }
  if (method === 'BANK_TRANSFER') {
    return `BANK_${timestamp}`;
  }
  return `${method}_${timestamp}`;
}

export function buildAdminMappingCreateRequestBody(
  input: AdminMappingCreateFormInput,
): AdminMappingCreateRequestBody {
  const startDate = format(new Date(), 'yyyy-MM-dd');
  const { payment } = input;
  const totalSessions = Math.max(1, Math.floor(payment.totalSessions));
  const packagePrice = Math.max(0, Math.floor(payment.packagePrice));
  return {
    consultantId: input.consultantId,
    clientId: input.clientId,
    startDate,
    status: 'PENDING_PAYMENT',
    notes: payment.notes?.trim() ?? '',
    responsibility: payment.responsibility.trim(),
    specialConsiderations: payment.specialConsiderations?.trim() ?? '',
    paymentStatus: 'PENDING',
    totalSessions,
    remainingSessions: totalSessions,
    packageName: payment.packageName.trim(),
    packagePrice,
    paymentAmount: packagePrice,
    paymentMethod: payment.paymentMethod.trim(),
    paymentReference: payment.paymentReference.trim(),
    mappingType: 'NEW',
  };
}
