/**
 * 어드민 커뮤니티 검수 큐 — GET 목록 + PATCH 승인·반려
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminApiTenantSync } from '@/hooks/useAdminApiTenantSync';
import { useAdminApiQueryReady } from '@/hooks/useAdminApiQueryReady';
import { useAuthStore } from '@/stores/useAuthStore';
import { canAccessCommunityModeration } from '@/utils/adminRole';
import { toDisplayString } from '@/utils/safeDisplay';
import {
  buildCommunityModerationPatchBody,
  normalizeCommunityModerationQueueList,
  type CommunityModerationDecision,
  type CommunityModerationQueueItem,
} from '@/utils/adminCommunityModerationNormalize';
import { apiGet, apiPatch } from '../client';
import { ADMIN_COMMUNITY_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';

const QUERY_BASE = ['adminCommunityModeration'] as const;

type ApiReject = { status?: number; message?: string };

function isForbiddenError(error: unknown): boolean {
  return (
    error != null &&
    typeof error === 'object' &&
    'status' in error &&
    (error as ApiReject).status === 403
  );
}

export const ADMIN_COMMUNITY_MODERATION_QUERY_KEYS = {
  all: QUERY_BASE,
  queue: (tenantId: string) => [...QUERY_BASE, 'queue', tenantId] as const,
};

function parseQueueResponse(raw: unknown): CommunityModerationQueueItem[] {
  const unwrapped = unwrapApiResponse<unknown>(raw) ?? raw;
  return normalizeCommunityModerationQueueList(unwrapped);
}

function getMutationErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return toDisplayString(error.message, fallback);
  }
  if (error != null && typeof error === 'object' && 'message' in error) {
    return toDisplayString((error as { message: unknown }).message, fallback);
  }
  return fallback;
}

export function useAdminCommunityModerationQueue() {
  const { ready, tenantId } = useAdminApiQueryReady();
  const role = useAuthStore((s) => s.role);
  const allowed = canAccessCommunityModeration(role);
  useAdminApiTenantSync();

  const query = useQuery({
    queryKey: ADMIN_COMMUNITY_MODERATION_QUERY_KEYS.queue(tenantId),
    queryFn: async () => {
      const raw = await apiGet(ADMIN_COMMUNITY_API.MODERATION_QUEUE, {
        page: 0,
        size: 100,
      });
      if (raw != null && typeof raw === 'object') {
        const root = raw as Record<string, unknown>;
        if (root.success === false) {
          throw new Error(toDisplayString(root.message, '검수 목록을 불러오지 못했습니다.'));
        }
      }
      return parseQueueResponse(raw);
    },
    enabled: ready && allowed,
    staleTime: 1000 * 30,
    refetchOnMount: 'always',
    retry: (failureCount, error) => !isForbiddenError(error) && failureCount < 1,
  });

  return { ...query, ready };
}

export type ModerateCommunityPostInput = {
  readonly postId: number;
  readonly decision: CommunityModerationDecision;
  readonly note?: string;
};

export function useModerateCommunityPost() {
  const queryClient = useQueryClient();
  const { tenantId } = useAdminApiQueryReady();

  return useMutation({
    mutationFn: async ({ postId, decision, note }: ModerateCommunityPostInput) => {
      const body = buildCommunityModerationPatchBody(decision, note);
      const raw = await apiPatch(ADMIN_COMMUNITY_API.moderation(postId), body);
      if (raw != null && typeof raw === 'object') {
        const root = raw as Record<string, unknown>;
        if (root.success === false) {
          throw new Error(toDisplayString(root.message, '검수 처리에 실패했습니다.'));
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_COMMUNITY_MODERATION_QUERY_KEYS.queue(tenantId),
      });
    },
  });
}

export { getMutationErrorMessage };
