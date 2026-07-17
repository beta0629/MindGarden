export const DEPOSIT_SOURCE_TYPES = Object.freeze({
  MAPPING_DEPOSIT: 'MAPPING_DEPOSIT',
  SESSION_EXTENSION: 'SESSION_EXTENSION'
});

export const DEPOSIT_QUEUE_REFRESH_EVENT = 'deposit-queue-mappings-refreshed';

const normalizeCreatedAt = (value) => value || null;

export const normalizeMappingDeposit = (mapping) => ({
  ...mapping,
  id: `${DEPOSIT_SOURCE_TYPES.MAPPING_DEPOSIT}-${mapping.id}`,
  sourceType: DEPOSIT_SOURCE_TYPES.MAPPING_DEPOSIT,
  sourceId: mapping.id,
  mappingId: mapping.id,
  clientName: mapping.clientName,
  consultantName: mapping.consultantName,
  amount: mapping.packagePrice ?? mapping.paymentAmount ?? null,
  additionalSessions: null,
  status: mapping.paymentStatus ?? mapping.status ?? 'PENDING_PAYMENT',
  createdAt: normalizeCreatedAt(mapping.createdAt)
});

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
  ...mappings.map(normalizeMappingDeposit),
  ...sessionExtensions.map(normalizeSessionExtension)
].sort((left, right) => {
  const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
  const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
  return leftTime - rightTime;
});
