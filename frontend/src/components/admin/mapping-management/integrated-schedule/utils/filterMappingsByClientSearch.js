/**
 * 통합 스케줄 사이드바 내담자 검색 — 매핑 목록 필터.
 *
 * 이름·전화·이메일 includes (대소문자 무시).
 * `clientDirectory` 가 있으면 mapping.clientId 로 phone/email/name 을 보강한다
 * (`/api/v1/admin/clients/with-mapping-info` 옵션과 동일 소스).
 *
 * @author CoreSolution
 * @since 2026-09-11
 */

/**
 * @param {unknown} raw
 * @returns {string}
 */
export const normalizeClientSearchToken = (raw) => String(raw ?? '').trim().toLowerCase();

/**
 * @param {Array<{id?: string|number, name?: string, phone?: string, email?: string}>} [clientDirectory]
 * @returns {Map<string, {name: string, phone: string, email: string}>}
 */
export const buildClientDirectoryIndex = (clientDirectory) => {
  const index = new Map();
  if (!Array.isArray(clientDirectory)) {
    return index;
  }
  clientDirectory.forEach((client) => {
    if (!client || client.id == null) {
      return;
    }
    index.set(String(client.id), {
      name: typeof client.name === 'string' ? client.name : '',
      phone: typeof client.phone === 'string' ? client.phone : '',
      email: typeof client.email === 'string' ? client.email : ''
    });
  });
  return index;
};

/**
 * @param {object} mapping
 * @param {Map<string, {name: string, phone: string, email: string}>} directoryIndex
 * @returns {{name: string, phone: string, email: string, consultantName: string}}
 */
const resolveSearchableFields = (mapping, directoryIndex) => {
  const fromDir =
    mapping?.clientId != null ? directoryIndex.get(String(mapping.clientId)) : null;
  return {
    name: String(
      mapping?.clientName ?? mapping?.client?.name ?? fromDir?.name ?? ''
    ).toLowerCase(),
    phone: String(
      mapping?.clientPhone
        ?? mapping?.phone
        ?? mapping?.client?.phone
        ?? fromDir?.phone
        ?? ''
    ).toLowerCase(),
    email: String(
      mapping?.clientEmail
        ?? mapping?.email
        ?? mapping?.client?.email
        ?? fromDir?.email
        ?? ''
    ).toLowerCase(),
    consultantName: String(mapping?.consultantName ?? mapping?.consultant?.name ?? '').toLowerCase()
  };
};

/**
 * @param {Array<object>} mappings
 * @param {string} rawQuery
 * @param {Array<object>} [clientDirectory]
 * @returns {Array<object>}
 */
export const filterMappingsByClientSearch = (
  mappings,
  rawQuery,
  clientDirectory = []
) => {
  if (!Array.isArray(mappings)) {
    return [];
  }
  const token = normalizeClientSearchToken(rawQuery);
  if (!token) {
    return mappings;
  }
  const directoryIndex = buildClientDirectoryIndex(clientDirectory);
  return mappings.filter((mapping) => {
    const fields = resolveSearchableFields(mapping, directoryIndex);
    return (
      fields.name.includes(token)
      || fields.phone.includes(token)
      || fields.email.includes(token)
      || fields.consultantName.includes(token)
    );
  });
};
