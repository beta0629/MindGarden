/**
 * 커뮤니티 TanStack Query 훅 자리.
 * 서버 `GET /api/v1/community` 미구현 — 현재는 MMKV·샘플 스토어만 사용한다.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useCommunityStore } from '@/stores/useCommunityStore';

export type CommunityDataSource = 'local-sample';

export function useCommunityFeed() {
  const posts = useCommunityStore((s) => s.posts);
  const isLoading = false;
  const isError = false;

  return {
    posts,
    isLoading,
    isError,
    /** API 연동 전 샘플·로컬 편집 데이터 */
    dataSource: 'local-sample' as CommunityDataSource,
  };
}
