/**
 * 어드민 TanStack Query `enabled` SSOT — JWT sub로 userId 보완 가능, store user.id 미필수
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useApiQueryReady, type UseApiQueryReadyOptions } from '@/hooks/useApiQueryReady';

export function useAdminApiQueryReady(
  options?: Omit<UseApiQueryReadyOptions, 'requireUserId'>,
): ReturnType<typeof useApiQueryReady> {
  return useApiQueryReady({ ...options, requireUserId: false });
}
