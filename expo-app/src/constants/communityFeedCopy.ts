/**
 * 커뮤니티 피드 UI 문구 (하드코딩 금지 — 화면은 이 상수만 참조)
 *
 * @author MindGarden
 * @since 2026-05-16
 */

/** MMKV 로컬 전용 글 id 하한 (`useCommunityStore.nextPostId` 초기값과 동일) */
export const COMMUNITY_LOCAL_POST_ID_MIN = 100;

export const COMMUNITY_FEED_DATA_SOURCE_API =
  '서버(/api/v1/community) + 이 기기에만 있는 글';
export const COMMUNITY_FEED_DATA_SOURCE_DEMO =
  '데모 샘플 + MMKV(이 기기)';

export const COMMUNITY_FEED_SYNC_HINT =
  '서버와 동기화된 목록입니다. «이 기기 전용» 배지 글은 아직 서버에 없습니다.';

export const COMMUNITY_FEED_SYNC_OK = '서버와 동기화된 목록입니다.';

export const COMMUNITY_FEED_DEMO_HINT =
  '글·댓글·좋아요는 우선 이 기기(MMKV)에 저장됩니다. 로그인·동기화 후 서버 기준으로 표시됩니다.';

export const COMMUNITY_FEED_DEMO_HINT_CONSULTANT =
  '칼럼·후기는 우선 이 기기(MMKV)에 저장됩니다. 로그인·동기화 후 서버 기준으로 표시됩니다.';

export const COMMUNITY_FEED_FETCH_ERROR =
  '서버 피드(/api/v1/community)를 불러오지 못했습니다. 아래는 데모 샘플과 이 기기에 저장된 글입니다. 동기화로 다시 시도할 수 있습니다.';

export const COMMUNITY_POST_LOCAL_ONLY_BADGE = '이 기기 전용';

export const COMMUNITY_POST_PENDING_MODERATION_BADGE = '검수 대기';

export const COMMUNITY_FEED_DEV_DATA_SOURCE_PREFIX = 'dataSource:';
