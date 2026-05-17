/**
 * 인증 직후 홈 경로 — `app/index.tsx` Redirect 순서와 동일
 *
 * @author MindGarden
 * @since 2026-05-17
 */
import type { AppAuthRole } from '@/stores/useAuthStore';
import { isAdminMobileShellRole } from '@/utils/adminRole';

export const POST_AUTH_HOME_ADMIN = '/(admin)/(home)' as const;
export const POST_AUTH_HOME_CONSULTANT = '/(consultant)/(home)' as const;
export const POST_AUTH_HOME_CLIENT = '/(client)/(home)' as const;

export type PostAuthHomeHref =
  | typeof POST_AUTH_HOME_ADMIN
  | typeof POST_AUTH_HOME_CONSULTANT
  | typeof POST_AUTH_HOME_CLIENT;

export function resolvePostAuthHomeHref(
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
