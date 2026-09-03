/**
 * 인증 직후 홈 경로 — `app/index.tsx` Redirect 순서와 동일
 *
 * 운영 역량(hasOperatorCapability) → admin 홈 우선, 그다음 상담 역량.
 *
 * @author MindGarden
 * @since 2026-05-17
 */
import type { AppAuthRole, User } from '@/stores/useAuthStore';
import { isAdminMobileShellRole } from '@/utils/adminRole';
import {
  hasCounselorCapability,
  hasOperatorCapability,
  type RoleCapabilityUserLike,
} from '@/utils/roleCapability';

export const POST_AUTH_HOME_ADMIN = '/(admin)/(home)' as const;
export const POST_AUTH_HOME_CONSULTANT = '/(consultant)/(home)' as const;
export const POST_AUTH_HOME_CLIENT = '/(client)/(home)' as const;

export type PostAuthHomeHref =
  | typeof POST_AUTH_HOME_ADMIN
  | typeof POST_AUTH_HOME_CONSULTANT
  | typeof POST_AUTH_HOME_CLIENT;

export type PostAuthLandingInput = AppAuthRole | RoleCapabilityUserLike | User | null | undefined;

function resolvePostAuthHomeHrefByStoreRole(
  role: AppAuthRole | null | undefined,
): PostAuthHomeHref {
  if (isAdminMobileShellRole(role)) {
    return POST_AUTH_HOME_ADMIN;
  }
  if (role === 'consultant') {
    return POST_AUTH_HOME_CONSULTANT;
  }
  return POST_AUTH_HOME_CLIENT;
}

function isStoreRole(value: unknown): value is AppAuthRole {
  return (
    value === 'admin' ||
    value === 'staff' ||
    value === 'consultant' ||
    value === 'client'
  );
}

/**
 * 역량 필드 우선 랜딩 — BE capability 미포함 시 스토어 role 로 하위 호환.
 */
export function resolvePostAuthHomeHref(input: PostAuthLandingInput): PostAuthHomeHref {
  if (input == null) {
    return POST_AUTH_HOME_CLIENT;
  }

  if (isStoreRole(input)) {
    return resolvePostAuthHomeHrefByStoreRole(input);
  }

  const user = input as RoleCapabilityUserLike;
  if (hasOperatorCapability(user)) {
    return POST_AUTH_HOME_ADMIN;
  }
  if (hasCounselorCapability(user)) {
    return POST_AUTH_HOME_CONSULTANT;
  }
  const role = user.role;
  if (isStoreRole(role)) {
    return resolvePostAuthHomeHrefByStoreRole(role);
  }
  return POST_AUTH_HOME_CLIENT;
}
