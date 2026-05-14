/**
 * 커뮤니티 TanStack Query + MMKV 지속 스토어 병합
 *
 * **§11.1 게이트(API 행) 정합 — 커뮤니티**
 * - Phase 3에서는 `GET /api/v1/community`가 없거나 실패해도 동작하도록 **샘플 + 로컬(MMKV) 폴백**이 허용 범위다.
 * - 성공 시: 응답을 정규화한 뒤 `useCommunityStore`와 병합(원격 우선, 로컬 전용 글은 뒤에 유지).
 * - API 미사용·빈 목록·에러·파싱 실패: 화면은 `useCommunityStore`의 게시물을 쓴다(시드·이전 상태는 `communityData`의 샘플 + MMKV persist).
 * - `useCommunityFeed().dataSource`: `'api'` = 원격 피드가 유효, `'demo-mmkv'` = 위 폴백 경로(기획서 표현과 동일하게 라벨만 부여; 실제 저장은 스토어 persist).
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

/** 원격 피드 권위 여부(§11.1 API 행 — 샘플/MMKV 폴백 구분용). */
export type CommunityDataSource =
  /** `GET /api/v1/community` 정상·비어 있지 않음 */
  | 'api'
  /** API 미결/실패/빈 응답 또는 스토어 시드·MMKV 기반 데모 상태 */
  | 'demo-mmkv';

const COMMUNITY_QUERY_KEYS = {
  all: ['community'] as const,
  feed: (feedTab?: CommunityTab) =>
    [...COMMUNITY_QUERY_KEYS.all, 'feed', feedTab ?? 'all'] as const,
};

function mergeRemoteWithStore(remote: CommunityPost[], local: CommunityPost[]): CommunityPost[] {
  if (remote.length === 0) {
    return local;
  }
  const remoteIds = new Set(remote.map((p) => p.id));
  const extras = local.filter((p) => !remoteIds.has(p.id));
  return [...remote, ...extras];
}

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
  const query = useQuery<CommunityPost[]>({
    queryKey: COMMUNITY_QUERY_KEYS.feed(feedTab),
    queryFn: () => fetchRemoteCommunityFeed(feedTab),
    staleTime: 1000 * 60,
    retry: 1,
  });

  useEffect(() => {
    if (!query.isSuccess) {
      return;
    }
    const remote = query.data;
    if (!remote?.length) {
      return;
    }
    const prev = useCommunityStore.getState().posts;
    const next = mergeRemoteWithStore(remote, prev);
    useCommunityStore.setState({ posts: next });
  }, [query.isSuccess, query.data, query.dataUpdatedAt]);

  const posts = useCommunityStore((s) => s.posts);

  const remoteLen = query.isSuccess ? (query.data?.length ?? 0) : 0;
  const dataSource: CommunityDataSource =
    query.isSuccess && !query.isError && remoteLen > 0 ? 'api' : 'demo-mmkv';

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
