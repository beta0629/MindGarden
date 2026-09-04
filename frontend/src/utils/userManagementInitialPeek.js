/**
 * 사용자 관리 deep link → Side Peek 초기 오픈용 헬퍼.
 *
 * 일정 상세 요약 모달 「사용자 관리에서 열기」에서
 * `/admin/user-management?type=…&id=…` 로 진입 시 목록 로드 후
 * 해당 엔티티 Side Peek를 1회 오픈한다.
 *
 * @author MindGarden
 * @since 2026-09-04
 */

export const USER_MANAGEMENT_TYPE_CONSULTANT = 'consultant';
export const USER_MANAGEMENT_TYPE_CLIENT = 'client';
export const USER_MANAGEMENT_TYPE_STAFF = 'staff';
export const USER_MANAGEMENT_TYPE_PENDING_DELETION = 'pending-deletion';

/**
 * URL `?type=` → 사용자 관리 탭 타입. 없거나 알 수 없으면 client.
 *
 * @param {URLSearchParams} searchParams
 * @returns {string}
 */
export function getUserManagementTypeFromParams(searchParams) {
  const t = searchParams?.get?.('type');
  if (t === USER_MANAGEMENT_TYPE_CONSULTANT) return USER_MANAGEMENT_TYPE_CONSULTANT;
  if (t === USER_MANAGEMENT_TYPE_STAFF) return USER_MANAGEMENT_TYPE_STAFF;
  if (t === USER_MANAGEMENT_TYPE_PENDING_DELETION) return USER_MANAGEMENT_TYPE_PENDING_DELETION;
  return USER_MANAGEMENT_TYPE_CLIENT;
}

/**
 * deep link `?id=` 값. 없거나 빈 문자열이면 null.
 *
 * @param {URLSearchParams} searchParams
 * @returns {string|null}
 */
export function getUserManagementIdFromParams(searchParams) {
  const id = searchParams?.get?.('id');
  if (id == null || id === '') {
    return null;
  }
  return id;
}

/**
 * 목록에서 id로 엔티티 조회 (string/number 불일치 허용).
 * 잘못된·없는 id는 null (silent fallthrough).
 *
 * @param {Array<{id?: *}>|null|undefined} entities
 * @param {string|number|null|undefined} id
 * @returns {object|null}
 */
export function findEntityByIdForInitialPeek(entities, id) {
  if (id == null || id === '') {
    return null;
  }
  if (!Array.isArray(entities) || entities.length === 0) {
    return null;
  }
  const target = String(id);
  const found = entities.find((item) => item != null && String(item.id) === target);
  return found ?? null;
}

/**
 * deep link initial Side Peek 결정.
 * latch(= alreadyOpened)는 action이 open 또는 give_up일 때만 호출측에서 설정한다.
 * hydrated + empty 목록에서는 wait를 반환해 이후 목록 도착 시 재시도한다.
 *
 * @param {object} params
 * @param {boolean} params.alreadyOpened
 * @param {string|number|null|undefined} params.id
 * @param {boolean} params.listHydrated
 * @param {Array|null|undefined} params.entities
 * @returns {{ action: 'skip'|'wait'|'open'|'give_up', entity?: object|null }}
 */
export function resolveInitialPeekAction({ alreadyOpened, id, listHydrated, entities }) {
  if (alreadyOpened) {
    return { action: 'skip' };
  }
  if (id == null || id === '') {
    return { action: 'skip' };
  }
  if (!listHydrated) {
    return { action: 'wait' };
  }

  const match = findEntityByIdForInitialPeek(entities, id);
  if (match) {
    return { action: 'open', entity: match };
  }

  // 로딩 중 empty / 비배열에 latch 금지 — 이후 목록 도착 시 재시도
  if (!Array.isArray(entities) || entities.length === 0) {
    return { action: 'wait' };
  }

  // hydrated + non-empty + id 없음 확정 → silent fallthrough 1회
  return { action: 'give_up' };
}
