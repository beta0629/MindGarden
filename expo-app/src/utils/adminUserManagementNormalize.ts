/**
 * 어드민 사용자 관리 목록 API 응답 정규화
 * 웹 `StaffManagement.parseUserManagementListPayload` 와 정합
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { toDisplayString, toSafeNumber } from '@/utils/safeDisplay';

export type AdminManagedUserRole =
  | 'ADMIN'
  | 'STAFF'
  | 'CONSULTANT'
  | 'CLIENT'
  | 'PLAY_THERAPIST'
  | 'SPEECH_THERAPIST'
  | string;

export interface AdminManagedUserListItem {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly role: AdminManagedUserRole;
  readonly isActive: boolean;
  readonly profileImageUrl: string | null;
}

/** AdminUserController 목록 응답 → 사용자 배열 */
export function parseUserManagementListPayload(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (response != null && typeof response === 'object') {
    const root = response as Record<string, unknown>;
    if (root.success === false) {
      return [];
    }
    if (Array.isArray(root.data)) {
      return root.data;
    }
    if ('data' in root && root.data != null && typeof root.data === 'object') {
      const inner = root.data as Record<string, unknown>;
      if (Array.isArray(inner.content)) {
        return inner.content;
      }
    }
  }
  return [];
}

function pickRoleCode(raw: unknown): AdminManagedUserRole {
  if (raw == null) {
    return 'CLIENT';
  }
  if (typeof raw === 'string') {
    return raw.trim().toUpperCase() as AdminManagedUserRole;
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const name = obj.name ?? obj.role ?? obj.value ?? obj.code;
    return pickRoleCode(name);
  }
  return String(raw).trim().toUpperCase() as AdminManagedUserRole;
}

function pickIsActive(row: Record<string, unknown>): boolean {
  if (typeof row.isActive === 'boolean') {
    return row.isActive;
  }
  if (typeof row.active === 'boolean') {
    return row.active;
  }
  if (typeof row.deleted === 'boolean') {
    return !row.deleted;
  }
  if (typeof row.isDeleted === 'boolean') {
    return !row.isDeleted;
  }
  return true;
}

export function normalizeAdminManagedUser(row: unknown): AdminManagedUserListItem | null {
  if (row == null || typeof row !== 'object') {
    return null;
  }
  const obj = row as Record<string, unknown>;
  const id = toSafeNumber(obj.id, Number.NaN);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  const profileRaw = obj.profileImageUrl ?? obj.profileImage;
  const profileImageUrl =
    typeof profileRaw === 'string' && profileRaw.trim() !== '' ? profileRaw.trim() : null;

  return {
    id,
    name: toDisplayString(obj.name, '—'),
    email: toDisplayString(obj.email, '—'),
    phone: toDisplayString(obj.phone, ''),
    role: pickRoleCode(obj.role),
    isActive: pickIsActive(obj),
    profileImageUrl,
  };
}

export function normalizeAdminManagedUserList(raw: unknown): AdminManagedUserListItem[] {
  const rows = parseUserManagementListPayload(raw);
  const out: AdminManagedUserListItem[] = [];
  for (const row of rows) {
    const item = normalizeAdminManagedUser(row);
    if (item != null) {
      out.push(item);
    }
  }
  return out;
}

export function filterAdminManagedUsersBySearch(
  users: readonly AdminManagedUserListItem[],
  searchTerm: string,
): AdminManagedUserListItem[] {
  const term = searchTerm.trim().toLowerCase();
  if (term === '') {
    return [...users];
  }
  return users.filter((u) => {
    const name = u.name.toLowerCase();
    const email = u.email.toLowerCase();
    const phone = u.phone.replace(/\s/g, '');
    const termDigits = term.replace(/\D/g, '');
    if (name.includes(term) || email.includes(term)) {
      return true;
    }
    if (termDigits.length > 0 && phone.replace(/\D/g, '').includes(termDigits)) {
      return true;
    }
    return phone.includes(term);
  });
}
