/**
 * silent checkSession 의 SET_USER 가 같은 세션 사용자를 새 객체로 바꾸지 않게 한다.
 * user 객체 전체를 의존성으로 둔 화면 로드 effect 가 5분·45초 ping 마다 다시 돌지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

const OPTIONAL_EMPTY_LIST_KEYS = ['permissionGroupCodes', 'availableRoles'];

/**
 * @param {object|null|undefined} user
 * @returns {string|null}
 */
export function resolveSessionUserId(user) {
  if (user == null || typeof user !== 'object') {
    return null;
  }
  const raw = user.id != null && user.id !== '' ? user.id : user.userId;
  if (raw == null || raw === '') {
    return null;
  }
  return String(raw);
}

/**
 * @param {unknown} value
 * @returns {string|undefined} undefined 이면 비교에서 생략 (null·undefined)
 */
function stableSerialize(value) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'function') {
    return undefined;
  }
  if (Array.isArray(value)) {
    const parts = [];
    value.forEach((item) => {
      const serialized = stableSerialize(item);
      if (serialized !== undefined) {
        parts.push(serialized);
      }
    });
    const primitive = value.every((item) => (
      item == null || typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
    ));
    if (primitive) {
      parts.sort();
    }
    return `[${parts.join(',')}]`;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    const fields = [];
    keys.forEach((key) => {
      const serialized = stableSerialize(value[key]);
      if (serialized !== undefined) {
        fields.push(`${JSON.stringify(key)}:${serialized}`);
      }
    });
    return `{${fields.join(',')}}`;
  }
  return JSON.stringify(String(value));
}

/**
 * @param {object} user
 * @returns {object}
 */
function normalizeUserForCompare(user) {
  const view = { ...user };
  const id = resolveSessionUserId(user);
  if (id != null) {
    view.id = id;
  }
  if (view.userId != null && view.userId !== '') {
    view.userId = String(view.userId);
  }
  OPTIONAL_EMPTY_LIST_KEYS.forEach((key) => {
    if (!Array.isArray(view[key]) || view[key].length === 0) {
      delete view[key];
    }
  });
  return view;
}

/**
 * 같은 참조이거나, 세션 페이로드(id 문자열 포함)가 같으면 true.
 * 이름·권한·휴대폰처럼 실제 필드가 바뀌면 false — 그 경우에만 새 객체를 쓴다.
 *
 * @param {object|null|undefined} previous
 * @param {object|null|undefined} next
 * @returns {boolean}
 */
export function isEquivalentSessionUser(previous, next) {
  if (previous === next) {
    return true;
  }
  if (previous == null || next == null) {
    return previous == null && next == null;
  }
  if (typeof previous !== 'object' || typeof next !== 'object') {
    return false;
  }
  return stableSerialize(normalizeUserForCompare(previous))
    === stableSerialize(normalizeUserForCompare(next));
}

export default {
  resolveSessionUserId,
  isEquivalentSessionUser
};
