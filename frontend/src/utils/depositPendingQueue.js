import {
  isClientPaymentHistoryRefundedOrCancelled,
  resolveClientPaymentHistoryAmount,
  resolveClientPaymentHistoryStatus,
  resolveClientPaymentHistoryTitle
} from './clientPaymentHistoryDisplay';

export const DEPOSIT_SOURCE_TYPES = Object.freeze({
  MAPPING_DEPOSIT: 'MAPPING_DEPOSIT',
  SESSION_EXTENSION: 'SESSION_EXTENSION'
});

export const DEPOSIT_QUEUE_REFRESH_EVENT = 'deposit-queue-mappings-refreshed';

const normalizeCreatedAt = (value) => value || null;

/**
 * 입금 대기 큐에 포함할지 (환불·취소 제외).
 *
 * @param {object|null|undefined} mapping
 * @returns {boolean}
 */
export function shouldIncludeInDepositPendingQueue(mapping) {
  return !isClientPaymentHistoryRefundedOrCancelled(mapping);
}

export const normalizeMappingDeposit = (mapping) => {
  const resolvedAmount = resolveClientPaymentHistoryAmount(mapping);
  const amount = resolvedAmount > 0
    ? resolvedAmount
    : (mapping?.packagePrice ?? mapping?.paymentAmount ?? null);
  const productTitle = resolveClientPaymentHistoryTitle(mapping, '');
  return {
    ...mapping,
    id: `${DEPOSIT_SOURCE_TYPES.MAPPING_DEPOSIT}-${mapping.id}`,
    sourceType: DEPOSIT_SOURCE_TYPES.MAPPING_DEPOSIT,
    sourceId: mapping.id,
    mappingId: mapping.id,
    clientName: mapping.clientName,
    consultantName: mapping.consultantName,
    productTitle: productTitle || mapping.productTitle || null,
    packageName: productTitle || mapping.packageName || null,
    amount,
    additionalSessions: null,
    status: resolveClientPaymentHistoryStatus(mapping)
      ?? mapping.paymentStatus
      ?? mapping.status
      ?? 'PENDING_PAYMENT',
    createdAt: normalizeCreatedAt(mapping.createdAt)
  };
};

export const normalizeSessionExtension = (request) => ({
  ...request,
  id: `${DEPOSIT_SOURCE_TYPES.SESSION_EXTENSION}-${request.id}`,
  sourceType: DEPOSIT_SOURCE_TYPES.SESSION_EXTENSION,
  sourceId: request.id,
  mappingId: request.mappingId ?? request.mapping?.id ?? null,
  clientName: request.mapping?.clientName,
  consultantName: request.mapping?.consultantName,
  amount: request.packagePrice ?? null,
  additionalSessions: request.additionalSessions ?? null,
  status: request.status ?? 'PENDING',
  createdAt: normalizeCreatedAt(request.createdAt)
});

export const buildDepositPendingQueue = (mappings = [], sessionExtensions = []) => [
  ...mappings
    .filter(shouldIncludeInDepositPendingQueue)
    .map(normalizeMappingDeposit),
  ...sessionExtensions.map(normalizeSessionExtension)
].sort((left, right) => {
  const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
  const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
  return leftTime - rightTime;
});
