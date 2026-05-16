/**
 * 커뮤니티 TanStack Query + MMKV 지속 스토어 병합
 *
 * **§11.1 게이트(API 행) 정합 — 커뮤니티**
 * - Phase 3에서는 `GET /api/v1/community`가 없거나 실패해도 동작하도록 **샘플 + 로컬(MMKV) 폴백**이 허용 범위다.
 * - 성공 시: 응답을 정규화한 뒤 `useCommunityStore`와 병합(원격 우선, 로컬 전용 글은 뒤에 유지).
 * - API 미사용·에러·파싱 실패: 화면은 `useCommunityStore`의 게시물을 쓴다(시드·이전 상태는 `communityData`의 샘플 + MMKV persist). 원격이 빈 배열이어도 HTTP·파싱 성공이면 `dataSource`는 `api`다.
 * - `useCommunityFeed().dataSource`: `'api'` = `GET /api/v1/community`가 **HTTP 성공·본문 파싱 성공**(빈 목록 포함), `'demo-mmkv'` = 미결/실패/쿼리 비활성 등 폴백.
 *
 * SSOT: `docs/project-management/EXPO_NATIVE_APP_PLAN.md` §11.1, Phase 3-C, §13(커뮤니티 API 목표)
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCommunityStore } from '@/stores/useCommunityStore';
import type { CommunityPost, CommunityTab } from '@/constants/communityData';
import { fetchRemoteCommunityFeed } from '@/services/communityApi';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import {
  isCommunityLocalOnlyPost,
  isCommunityPendingModerationPost,
  mergeRemoteCommunityWithStore,
} from '@/utils/communityFeedMerge';

/** 원격 피드 권위 여부(§11.1 API 행 — 샘플/MMKV 폴백 구분용). */
export type CommunityDataSource =
  /** `GET /api/v1/community` HTTP 성공 + 본문 파싱 성공(빈 배열 포함) */
  | 'api'
  /** API 미결·HTTP 실패·파싱 실패·쿼리 비활성 — 스토어 시드·MMKV 기반 */
  | 'demo-mmkv';

const COMMUNITY_QUERY_KEYS = {
  all: ['community'] as const,
  feed: (feedTab?: CommunityTab) =>
    [...COMMUNITY_QUERY_KEYS.all, 'feed', feedTab ?? 'all'] as const,
};

export type UseCommunityFeedOptions = {
  /** Spring `tab` 쿼리: `reviews` | `columns` — `all`이면 생략 */
  feedTab?: CommunityTab;
};

/**
 * 커뮤니티 피드 훅. API와 MMKV 백 스토어를 이어 §11.1의 샘플/폴백 허용 범위를 만족한다.
 *
 * @returns `posts`는 항상 스토어 기준(병합 결과). `dataSource`로 원격 vs 폴백 표시.
 */
export function useCommunityFeed(options?: UseCommunityFeedOptions) {
  const feedTab = options?.feedTab;
  const { ready, tenantId, userId } = useApiQueryReady();

  const query = useQuery<CommunityPost[]>({
    queryKey: [...COMMUNITY_QUERY_KEYS.feed(feedTab), tenantId, String(userId ?? '')] as const,
    queryFn: () => fetchRemoteCommunityFeed(feedTab),
    enabled: ready,
    staleTime: 1000 * 60,
    retry: 1,
    refetchOnMount: 'always',
  });

  const remotePostIds = useMemo(() => {
    if (!query.isSuccess) {
      return new Set<number>();
    }
    return new Set((query.data ?? []).map((p) => p.id));
  }, [query.isSuccess, query.data]);

  useEffect(() => {
    if (!query.isSuccess) {
      return;
    }
    const remote = query.data ?? [];
    const prev = useCommunityStore.getState().posts;
    const next = mergeRemoteCommunityWithStore(remote, prev);
    useCommunityStore.setState({ posts: next });
  }, [query.isSuccess, query.data, query.dataUpdatedAt]);

  useEffect(() => {
    if (!__DEV__ || !query.isError) {
      return;
    }
    const err = query.error;
    const message = err instanceof Error ? err.message : String(err);
    const tabLabel = feedTab ?? 'all';
    // eslint-disable-next-line no-console -- 개발용 커뮤니티 API 실패 추적
    console.warn(`[community-feed] tab=${tabLabel} tenant=${tenantId} message=${message}`);
  }, [query.isError, query.error, feedTab, tenantId]);

  const posts = useCommunityStore((s) => s.posts);

  /** HTTP 200 + 파싱 성공이면 원격 연동으로 간주(빈 피드 포함). */
  const dataSource: CommunityDataSource =
    query.isSuccess && !query.isError ? 'api' : 'demo-mmkv';

  const isPostLocalOnly = useMemo(
    () => (postId: number) => isCommunityLocalOnlyPost(postId, dataSource, remotePostIds),
    [dataSource, remotePostIds],
  );

  const isPostPendingModeration = useMemo(
    () => (postId: number) => {
      const post = posts.find((p) => p.id === postId);
      if (!post) {
        return false;
      }
      return isCommunityPendingModerationPost(post, dataSource, remotePostIds);
    },
    [dataSource, remotePostIds, posts],
  );

  const hasLocalOnlyPosts = useMemo(
    () => dataSource === 'api' && posts.some((p) => isPostLocalOnly(p.id)),
    [dataSource, posts, isPostLocalOnly],
  );

  return {
    posts,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    isFetching: query.isFetching,
    dataSource,
    lastFetchedAt: query.dataUpdatedAt,
    isPostLocalOnly,
    isPostPendingModeration,
    hasLocalOnlyPosts,
    remotePostIds,
  };
}

export function useCommunityPostById(postId: number): CommunityPost | undefined {
  const posts = useCommunityStore((s) => s.posts);
  return useMemo(() => posts.find((p) => p.id === postId), [posts, postId]);
}

export function useCommunityFeedControls() {
  const queryClient = useQueryClient();
  return {
    invalidateCommunityFeed: () =>
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.all }),
  };
}

export { COMMUNITY_QUERY_KEYS };

export {
  createRemoteCommunityComment,
  createRemoteCommunityLike,
  createRemoteCommunityPost,
  createRemoteCommunityReport,
  deleteRemoteCommunityComment,
  deleteRemoteCommunityLike,
  deleteRemoteCommunityPost,
  fetchRemoteCommunityFeed,
  fetchRemoteCommunityPost,
  updateRemoteCommunityPost,
} from '@/services/communityApi';

export type {
  CommunityCommentCreateRequestDto,
  CommunityPostCreateRequestDto,
  CommunityPostKindDto,
  CommunityPostUpdateRequestDto,
  CommunityReportCreateRequestDto,
  CommunityReportReasonCodeDto,
} from '@/services/communityApi';
