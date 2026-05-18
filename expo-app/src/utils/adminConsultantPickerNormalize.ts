/**
 * 어드민 상담일지 — 상담사 선택 목록 API 응답 정규화
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import {
  normalizeAdminManagedUserList,
  type AdminManagedUserListItem,
} from '@/utils/adminUserManagementNormalize';
import { toDisplayString, toSafeNumber } from '@/utils/safeDisplay';

export type AdminConsultantPickerItem = {
  readonly id: number;
  readonly name: string;
  readonly email: string;
};

function toConsultantPickerItem(user: AdminManagedUserListItem): AdminConsultantPickerItem | null {
  const id = toSafeNumber(user.id, Number.NaN);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  const name = toDisplayString(user.name, '').trim();
  const emailRaw = toDisplayString(user.email, '').trim();
  const email = emailRaw === '—' ? '' : emailRaw;
  return {
    id,
    name: name || `상담사 #${id}`,
    email,
  };
}

/** AdminUserController `{ success, data: [] }` — users 화면과 동일 파서 */
export function parseAdminConsultantPickerResponse(raw: unknown): AdminConsultantPickerItem[] {
  if (raw != null && typeof raw === 'object') {
    const root = raw as Record<string, unknown>;
    if (root.success === false) {
      const msg = root.message;
      throw new Error(typeof msg === 'string' ? msg : '요청이 실패했습니다.');
    }
  }
  return normalizeAdminManagedUserList(raw)
    .filter((u) => u.isActive)
    .map((u) => toConsultantPickerItem(u))
    .filter((item): item is AdminConsultantPickerItem => item != null)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}
