/**
 * PG 설정 저장 시 API/Secret 공란 허용 정책.
 * 수정(edit) + 저장된 시크릿이 있으면 공란은 「변경 없음」으로 취급한다.
 *
 * @author CoreSolution
 * @since 2026-10-16
 */

/**
 * 수정 저장에서 API 시크릿 공란을 허용할지.
 *
 * @param {object} params
 * @param {'create'|'edit'|string} params.mode
 * @param {boolean|null|undefined} params.apiSecretConfigured 응답 플래그 (우선)
 * @returns {boolean}
 */
export function canOmitApiSecretOnEdit({ mode, apiSecretConfigured } = {}) {
  if (mode !== 'edit') {
    return false;
  }
  if (apiSecretConfigured === true) {
    return true;
  }
  if (apiSecretConfigured === false) {
    return false;
  }
  // 플래그 미제공: create 는 항상 시크릿 필수이므로 edit 이면 저장본 존재로 간주
  return true;
}

/**
 * IAMPORT(PortOne V2) 저장 시 secretKey 필수 여부.
 * testMode ON → 선택. OFF 이면 create 필수, edit 는 저장본 있을 때 공란 허용.
 *
 * @param {object} params
 * @param {'create'|'edit'|string} params.mode
 * @param {boolean} params.testMode
 * @param {boolean|null|undefined} params.apiSecretConfigured
 * @returns {boolean} true 이면 공란 시 검증 오류
 */
export function isIamportApiSecretRequired({ mode, testMode, apiSecretConfigured } = {}) {
  if (testMode) {
    return false;
  }
  if (canOmitApiSecretOnEdit({ mode, apiSecretConfigured })) {
    return false;
  }
  return true;
}

/**
 * KICC·기타 제공자 — create 는 apiKey/secretKey 필수, edit+저장본 있으면 공란 허용.
 *
 * @param {object} params
 * @param {'create'|'edit'|string} params.mode
 * @param {boolean|null|undefined} params.apiSecretConfigured
 * @returns {boolean} true 이면 공란 시 검증 오류
 */
export function areProviderSecretsRequiredOnSave({ mode, apiSecretConfigured } = {}) {
  if (canOmitApiSecretOnEdit({ mode, apiSecretConfigured })) {
    return false;
  }
  return true;
}
