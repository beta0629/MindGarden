/**
 * 커뮤니티 원격 피드 ↔ MMKV 스토어 병합 정책
 *
 * - API 성공(빈 배열 포함): 서버 행 + id≥COMMUNITY_LOCAL_POST_ID_MIN 로컬 전용만 유지
 * - 데모 시드(id < 100)는 API 권위 모드에서 제외
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import type { CommunityPost } from '@/constants/communityData';
import { COMMUNITY_LOCAL_POST_ID_MIN } from '@/constants/communityFeedCopy';

export function mergeRemoteCommunityWithStore(
  remote: CommunityPost[],
  local: CommunityPost[],
): CommunityPost[] {
  const remoteIds = new Set(remote.map((p) => p.id));
  const localExtras = local.filter(
    (p) => p.id >= COMMUNITY_LOCAL_POST_ID_MIN && !remoteIds.has(p.id),
  );
  if (remote.length === 0) {
    return localExtras;
  }
  return [...remote, ...localExtras];
}

export function isCommunityLocalOnlyPost(
  postId: number,
  dataSource: 'api' | 'demo-mmkv',
  remotePostIds: ReadonlySet<number>,
): boolean {
  if (dataSource !== 'api') {
    return false;
  }
  return postId >= COMMUNITY_LOCAL_POST_ID_MIN && !remotePostIds.has(postId);
}
