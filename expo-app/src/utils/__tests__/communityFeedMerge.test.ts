import type { CommunityPost } from '@/constants/communityData';
import { INITIAL_COMMUNITY_POSTS } from '@/constants/communityData';
import { COMMUNITY_LOCAL_POST_ID_MIN } from '@/constants/communityFeedCopy';
import {
  isCommunityLocalOnlyPost,
  isCommunityPendingModerationPost,
  mergeRemoteCommunityWithStore,
} from '@/utils/communityFeedMerge';

const sample = (id: number, overrides?: Partial<CommunityPost>): CommunityPost => ({
  id,
  tab: 'reviews',
  author: 'a',
  specialty: '',
  title: `t${id}`,
  body: 'b',
  likes: 0,
  comments: [],
  time: '1시간 전',
  isConsultant: false,
  isAnonymous: true,
  ...overrides,
});

describe('mergeRemoteCommunityWithStore', () => {
  it('keeps local-only posts when remote is empty', () => {
    const demoSeed = INITIAL_COMMUNITY_POSTS[0]!;
    const local = [demoSeed, sample(COMMUNITY_LOCAL_POST_ID_MIN)];
    const merged = mergeRemoteCommunityWithStore([], local);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe(COMMUNITY_LOCAL_POST_ID_MIN);
  });

  it('keeps server-written post id 6 when remote is empty (pending moderation)', () => {
    const serverPost = sample(6, {
      title: '내가 쓴 글',
      body: '검수 전',
      author: '나',
    });
    const local = [INITIAL_COMMUNITY_POSTS[0]!, INITIAL_COMMUNITY_POSTS[1]!, serverPost];
    const merged = mergeRemoteCommunityWithStore([], local);
    expect(merged.map((p) => p.id)).toEqual([6]);
  });

  it('merges remote with local extras not on server', () => {
    const remote = [sample(5)];
    const local = [sample(5), sample(COMMUNITY_LOCAL_POST_ID_MIN)];
    const merged = mergeRemoteCommunityWithStore(remote, local);
    expect(merged.map((p) => p.id)).toEqual([5, COMMUNITY_LOCAL_POST_ID_MIN]);
  });

  it('keeps pending moderation post when remote has other approved posts', () => {
    const remote = [sample(3)];
    const pending = sample(7, { title: '대기 글', body: '본문' });
    const merged = mergeRemoteCommunityWithStore(remote, [
      INITIAL_COMMUNITY_POSTS[0]!,
      pending,
    ]);
    expect(merged.map((p) => p.id)).toEqual([3, 7]);
  });
});

describe('isCommunityLocalOnlyPost', () => {
  it('flags local id when api mode and not in remote set', () => {
    const remote = new Set([1]);
    expect(isCommunityLocalOnlyPost(COMMUNITY_LOCAL_POST_ID_MIN, 'api', remote)).toBe(true);
    expect(isCommunityLocalOnlyPost(1, 'api', remote)).toBe(false);
  });

  it('never flags in demo-mmkv mode', () => {
    expect(isCommunityLocalOnlyPost(COMMUNITY_LOCAL_POST_ID_MIN, 'demo-mmkv', new Set())).toBe(
      false,
    );
  });
});

describe('isCommunityPendingModerationPost', () => {
  it('flags server post not in remote when api mode', () => {
    const post = sample(7, { title: '대기', body: 'x' });
    expect(isCommunityPendingModerationPost(post, 'api', new Set())).toBe(true);
    expect(isCommunityPendingModerationPost(post, 'api', new Set([7]))).toBe(false);
  });

  it('never flags unchanged demo seed', () => {
    const seed = INITIAL_COMMUNITY_POSTS[0]!;
    expect(isCommunityPendingModerationPost(seed, 'api', new Set())).toBe(false);
  });

  it('never flags in demo-mmkv mode', () => {
    const post = sample(7);
    expect(isCommunityPendingModerationPost(post, 'demo-mmkv', new Set())).toBe(false);
  });
});
