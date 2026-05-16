/**
 * 커뮤니티 원격 피드 ↔ MMKV 스토어 병합 정책
 *
 * - API 성공(빈 배열 포함): 서버 APPROVED 행 + 로컬 전용(id≥100) + 검수 대기 서버 글 유지
 * - 변경 없는 데모 시드(id < 100)는 API 권위 모드에서 제외
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import type { CommunityPost } from '@/constants/communityData';
import { INITIAL_COMMUNITY_POSTS } from '@/constants/communityData';
import { COMMUNITY_LOCAL_POST_ID_MIN } from '@/constants/communityFeedCopy';

const DEMO_SEED_BY_ID = new Map(INITIAL_COMMUNITY_POSTS.map((p) => [p.id, p] as const));

/** id가 시드와 같아도 prependRemotePost로 바뀐 글은 데모가 아님 */
function isUnchangedCommunityDemoSeedPost(post: CommunityPost): boolean {
  const seed = DEMO_SEED_BY_ID.get(post.id);
  if (!seed) {
    return false;
  }
  return (
    seed.title === post.title &&
    seed.body === post.body &&
    seed.author === post.author &&
    seed.tab === post.tab
  );
}

function shouldKeepLocalPostOnMerge(
  post: CommunityPost,
  remoteIds: ReadonlySet<number>,
): boolean {
  if (remoteIds.has(post.id)) {
    return false;
  }
  if (post.id >= COMMUNITY_LOCAL_POST_ID_MIN) {
    return true;
  }
  if (isUnchangedCommunityDemoSeedPost(post)) {
    return false;
  }
  return true;
}

export function mergeRemoteCommunityWithStore(
  remote: CommunityPost[],
  local: CommunityPost[],
): CommunityPost[] {
  const remoteIds = new Set(remote.map((p) => p.id));
  const localExtras = local.filter((p) => shouldKeepLocalPostOnMerge(p, remoteIds));
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

/**
 * 서버에 저장됐으나 GET 피드(APPROVED만)에 아직 없는 글 — 검수 대기 배지용
 */
export function isCommunityPendingModerationPost(
  post: CommunityPost,
  dataSource: 'api' | 'demo-mmkv',
  remotePostIds: ReadonlySet<number>,
): boolean {
  if (dataSource !== 'api') {
    return false;
  }
  if (post.id >= COMMUNITY_LOCAL_POST_ID_MIN) {
    return false;
  }
  if (isUnchangedCommunityDemoSeedPost(post)) {
    return false;
  }
  return !remotePostIds.has(post.id);
}
