/**
 * 사업자등록번호 형식·체크섬 검증 (BE BusinessRegistrationNumberValidator 와 동일 규칙).
 * 국세청 진위확인 API 연동은 별도 패턴이 있을 때만 확장.
 */

export const BUSINESS_REGISTRATION_INVALID_MESSAGE =
  '사업자등록번호 형식이 올바르지 않습니다. (예: 000-00-00000)';

/** FE 저장 차단·BE biz-invalid 매핑용 토스트/필드 안내 */
export const BUSINESS_REGISTRATION_SAVE_BLOCKED_MESSAGE =
  '사업자등록번호가 올바르지 않아 저장할 수 없습니다.';

const WEIGHTS = [1, 3, 7, 1, 3, 7, 1, 3, 5];
const DISPLAY_PATTERN = /^\d{3}-\d{2}-\d{5}$/;

/**
 * API/예외 메시지가 사업자등록번호 형식 오류인지 판별.
 * @param {unknown} errOrMessage
 * @returns {boolean}
 */
export function isBusinessRegistrationApiError(errOrMessage) {
  const msg =
    typeof errOrMessage === 'string'
      ? errOrMessage
      : errOrMessage?.response?.data?.message ||
        errOrMessage?.message ||
        '';
  if (!msg || typeof msg !== 'string') return false;
  if (msg.includes('사업자등록번호')) return true;
  if (msg.includes(BUSINESS_REGISTRATION_INVALID_MESSAGE)) return true;
  return false;
}

/**
 * 저장 실패 시 사업자등록번호 오류면 저장 차단 문구, 아니면 null.
 * @param {unknown} err
 * @returns {string|null}
 */
export function resolveBizSaveErrorMessage(err) {
  if (!isBusinessRegistrationApiError(err)) return null;
  return BUSINESS_REGISTRATION_SAVE_BLOCKED_MESSAGE;
}

/**
 * @param {string|null|undefined} raw
 * @returns {string}
 */
export function normalizeBusinessRegistrationDigits(raw) {
  if (raw == null || raw === '') return '';
  return String(raw).replace(/\D/g, '');
}

/**
 * @param {string} digits
 * @returns {boolean}
 */
function isValidDigits(digits) {
  if (!digits || digits.length !== 10 || !/^\d{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(digits[i]) * WEIGHTS[i];
  }
  const ninth = Number(digits[8]);
  sum += Math.floor((ninth * 5) / 10);
  const check = (10 - (sum % 10)) % 10;
  return check === Number(digits[9]);
}

/**
 * @param {string|null|undefined} raw
 * @returns {boolean}
 */
export function isValidBusinessRegistrationNumber(raw) {
  const digits = normalizeBusinessRegistrationDigits(raw);
  if (!digits) return false;
  return isValidDigits(digits);
}

/**
 * 빈 값 허용(선택 필드). 값이 있으면 체크섬 필수.
 * @param {string|null|undefined} raw
 * @returns {boolean}
 */
export function isValidBusinessRegistrationNumberOrEmpty(raw) {
  const digits = normalizeBusinessRegistrationDigits(raw);
  if (!digits) return true;
  return isValidDigits(digits);
}

/**
 * @param {string|null|undefined} raw
 * @returns {string}
 */
export function formatBusinessRegistrationNumber(raw) {
  const digits = normalizeBusinessRegistrationDigits(raw);
  if (digits.length !== 10) {
    return raw == null ? '' : String(raw).trim();
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

/**
 * @param {string|null|undefined} raw
 * @returns {boolean}
 */
export function matchesBusinessRegistrationDisplayPattern(raw) {
  return raw != null && DISPLAY_PATTERN.test(String(raw).trim());
}
