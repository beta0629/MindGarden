/**
 * 커뮤니티 TanStack Query + 스토어 병합
 * `GET /api/v1/community` 시도·정규화 (`communityNormalize`), 실패 시 샘플 스토어 유지
 *
 * SSOT: `docs/project-management/EXPO_NATIVE_APP_PLAN.md` Phase 3-C·§13
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import { COMMUNITY_API } from '@/api/endpoints';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import { useCommunityStore } from '@/stores/useCommunityStore';
import { normalizeCommunityPosts } from '@/utils/communityNormalize';
import type { CommunityPost } from '@/constants/communityData';

export type CommunityDataSource = 'api' | 'local-sample';

const COMMUNITY_QUERY_KEYS = {
  all: ['community'] as const,
  feed: () => [...COMMUNITY_QUERY_KEYS.all, 'feed'] as const,
};

function mergeRemoteWithStore(
  remote: CommunityPost[],
  local: CommunityPost[],
): CommunityPost[] {
  if (remote.length === 0) {
    return local;
  }
  const remoteIds = new Set(remote.map((p) => p.id));
  const extras = local.filter((p) => !remoteIds.has(p.id));
  return [...remote, ...extras];
}

async function fetchCommunityFeed(): Promise<CommunityPost[]> {
  const raw = await apiGet<unknown>(COMMUNITY_API.LIST);
  const normalized = normalizeCommunityPosts(unwrapApiResponse(raw) ?? raw);
  if (normalized === null) {
    throw new Error('COMMUNITY_PARSE_FAILED');
  }
  return normalized;
}

export function useCommunityFeed() {
  const query = useQuery<CommunityPost[]>({
    queryKey: COMMUNITY_QUERY_KEYS.feed(),
    queryFn: fetchCommunityFeed,
    staleTime: 1000 * 60,
    retry: 1,
  });

  useEffect(() => {
    if (!query.isSuccess || query.data.length === 0) {
      return;
    }
    const prev = useCommunityStore.getState().posts;
    const next = mergeRemoteWithStore(query.data, prev);
    useCommunityStore.setState({ posts: next });
  }, [query.isSuccess, query.data, query.dataUpdatedAt]);

  const posts = useCommunityStore((s) => s.posts);

  const dataSource: CommunityDataSource =
    query.isSuccess && !query.isError && query.data.length > 0 ? 'api' : 'local-sample';

  return {
    posts,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    isFetching: query.isFetching,
    dataSource,
    lastFetchedAt: query.dataUpdatedAt,
  };
}

export function useCommunityPostById(postId: number): CommunityPost | undefined {
  const posts = useCommunityStore((s) => s.posts);
  return useMemo(
    () => posts.find((p) => p.id === postId),
    [posts, postId],
  );
}

export function useCommunityFeedControls() {
  const queryClient = useQueryClient();
  return {
    invalidateCommunityFeed: () =>
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.feed() }),
  };
}

export { COMMUNITY_QUERY_KEYS };
