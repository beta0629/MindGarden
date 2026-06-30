import { isClientMappingPaymentSettled } from '../constants/mapping';

export const PREVIOUS_PACKAGE_SOURCE = Object.freeze({
  SAME_PAIR: 'same_pair',
  CLIENT_ONLY: 'client_only'
});

export const PREVIOUS_PACKAGE_STATUS = Object.freeze({
  MATCHED: 'matched',
  DISCONTINUED: 'discontinued',
  NONE: 'none'
});

const toId = (value) => (value == null ? null : String(value));

const parseTimestamp = (value) => {
  if (!value) return 0;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : ts;
};

/**
 * 매칭 스냅샷에서 clientId / consultantId 를 정규화한다.
 * @param {object} mapping
 * @returns {{ clientId: string|null, consultantId: string|null }}
 */
export const normalizeMappingIds = (mapping) => ({
  clientId: toId(mapping?.clientId ?? mapping?.client?.id),
  consultantId: toId(mapping?.consultantId ?? mapping?.consultant?.id)
});

/**
 * settled 매칭 중 최근 순 정렬용 타임스탬프 (createdAt → paymentDate → startDate)
 * @param {object} mapping
 * @returns {number}
 */
export const getMappingRecencyTimestamp = (mapping) => Math.max(
  parseTimestamp(mapping?.createdAt),
  parseTimestamp(mapping?.paymentDate),
  parseTimestamp(mapping?.startDate)
);

/**
 * @param {object} mapping
 * @param {Array<{ value: string, label: string, sessions: number, price: number }>} packageOptions
 * @returns {object|null}
 */
export const matchPackageOption = (mapping, packageOptions) => {
  if (!mapping || !Array.isArray(packageOptions) || packageOptions.length === 0) {
    return null;
  }

  const historicalName = (mapping.packageName || '').trim();
  const historicalSessions = Number(mapping.totalSessions);
  const historicalPrice = Number(mapping.packagePrice);

  if (historicalName) {
    const byLabel = packageOptions.find((pkg) => pkg.label === historicalName);
    if (byLabel) return byLabel;

    const byCodeValue = packageOptions.find((pkg) => pkg.value === historicalName);
    if (byCodeValue) return byCodeValue;
  }

  if (Number.isFinite(historicalSessions) && historicalSessions > 0
      && Number.isFinite(historicalPrice) && historicalPrice > 0) {
    const bySessionsPrice = packageOptions.find(
      (pkg) => pkg.sessions === historicalSessions && pkg.price === historicalPrice
    );
    if (bySessionsPrice) return bySessionsPrice;
  }

  return null;
};

/**
 * @param {object[]} mappings
 * @param {string|number} clientId
 * @param {string|number|null|undefined} consultantId
 * @returns {object[]}
 */
export const filterSettledMappingsForClient = (mappings, clientId, consultantId) => {
  const normalizedClientId = toId(clientId);
  const normalizedConsultantId = consultantId == null ? null : toId(consultantId);

  if (!normalizedClientId || !Array.isArray(mappings)) {
    return [];
  }

  return mappings.filter((mapping) => {
    const ids = normalizeMappingIds(mapping);
    if (ids.clientId !== normalizedClientId) return false;
    if (normalizedConsultantId != null && ids.consultantId !== normalizedConsultantId) return false;
    if (!isClientMappingPaymentSettled(mapping.paymentStatus)) return false;
    if (!mapping.packageName && mapping.totalSessions == null && mapping.packagePrice == null) {
      return false;
    }
    return true;
  });
};

/**
 * @param {object[]} mappings
 * @returns {object|null}
 */
export const findMostRecentMapping = (mappings) => {
  if (!Array.isArray(mappings) || mappings.length === 0) {
    return null;
  }

  return mappings.reduce((latest, current) => {
    if (!latest) return current;
    return getMappingRecencyTimestamp(current) >= getMappingRecencyTimestamp(latest)
      ? current
      : latest;
  }, null);
};

/**
 * 동일 상담사+내담자 settled 최근 패키지 → 없으면 내담자 전체 settled 최근 패키지를 packageOptions 에 매칭한다.
 *
 * @param {{
 *   clientId: string|number,
 *   consultantId: string|number,
 *   mappings?: object[],
 *   packageOptions?: Array<{ value: string, label: string, sessions: number, price: number }>
 * }} params
 * @returns {{
 *   status: 'matched'|'discontinued'|'none',
 *   packageOption: object|null,
 *   source: 'same_pair'|'client_only'|null,
 *   historicalPackageName: string|null,
 *   mappingId: string|number|null
 * }}
 */
export const resolvePreviousPackage = ({
  clientId,
  consultantId,
  mappings = [],
  packageOptions = []
}) => {
  const emptyResult = {
    status: PREVIOUS_PACKAGE_STATUS.NONE,
    packageOption: null,
    source: null,
    historicalPackageName: null,
    mappingId: null
  };

  if (clientId == null || consultantId == null) {
    return emptyResult;
  }

  const samePairMappings = filterSettledMappingsForClient(mappings, clientId, consultantId);
  let source = PREVIOUS_PACKAGE_SOURCE.SAME_PAIR;
  let candidate = findMostRecentMapping(samePairMappings);

  if (!candidate) {
    const clientMappings = filterSettledMappingsForClient(mappings, clientId);
    candidate = findMostRecentMapping(clientMappings);
    source = PREVIOUS_PACKAGE_SOURCE.CLIENT_ONLY;
  }

  if (!candidate) {
    return emptyResult;
  }

  const historicalPackageName = candidate.packageName || null;
  const packageOption = matchPackageOption(candidate, packageOptions);

  if (!packageOption) {
    return {
      status: PREVIOUS_PACKAGE_STATUS.DISCONTINUED,
      packageOption: null,
      source,
      historicalPackageName,
      mappingId: candidate.id ?? null
    };
  }

  return {
    status: PREVIOUS_PACKAGE_STATUS.MATCHED,
    packageOption,
    source,
    historicalPackageName,
    mappingId: candidate.id ?? null
  };
};
