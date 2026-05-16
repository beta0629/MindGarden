import type { CommunityPost } from '@/constants/communityData';
import { COMMUNITY_LOCAL_POST_ID_MIN } from '@/constants/communityFeedCopy';
import {
  isCommunityLocalOnlyPost,
  mergeRemoteCommunityWithStore,
} from '@/utils/communityFeedMerge';

const sample = (id: number): CommunityPost => ({
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
});

describe('mergeRemoteCommunityWithStore', () => {
  it('keeps local-only posts when remote is empty', () => {
    const local = [sample(1), sample(COMMUNITY_LOCAL_POST_ID_MIN)];
    const merged = mergeRemoteCommunityWithStore([], local);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe(COMMUNITY_LOCAL_POST_ID_MIN);
  });

  it('merges remote with local extras not on server', () => {
    const remote = [sample(5)];
    const local = [sample(5), sample(COMMUNITY_LOCAL_POST_ID_MIN)];
    const merged = mergeRemoteCommunityWithStore(remote, local);
    expect(merged.map((p) => p.id)).toEqual([5, COMMUNITY_LOCAL_POST_ID_MIN]);
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
