/**
 * 커뮤니티 피드 UI 문구 (하드코딩 금지 — 화면은 이 상수만 참조)
 *
 * @author MindGarden
 * @since 2026-05-16
 */

/** MMKV 로컬 전용 글 id 하한 (`useCommunityStore.nextPostId` 초기값과 동일) */
export const COMMUNITY_LOCAL_POST_ID_MIN = 100;

export const COMMUNITY_FEED_DATA_SOURCE_API =
  '서버와 동기화된 글 · 이 기기에만 있는 글';
export const COMMUNITY_FEED_DATA_SOURCE_DEMO =
  '이 기기에 저장된 글';

export const COMMUNITY_FEED_SYNC_HINT =
  '서버와 동기화된 목록입니다. «이 기기 전용» 배지 글은 아직 서버에 없습니다.';

export const COMMUNITY_FEED_SYNC_OK = '서버와 동기화된 목록입니다.';

export const COMMUNITY_FEED_DEMO_HINT =
  '글·댓글·좋아요는 우선 이 기기에 저장됩니다. 로그인·동기화 후 서버 기준으로 표시됩니다.';

export const COMMUNITY_FEED_DEMO_HINT_CONSULTANT =
  '칼럼·후기는 우선 이 기기에 저장됩니다. 로그인·동기화 후 서버 기준으로 표시됩니다.';

export const COMMUNITY_FEED_FETCH_ERROR =
  '피드를 불러오지 못했습니다. 아래에 이 기기에 저장된 글을 보여 드립니다. 동기화로 다시 시도할 수 있습니다.';

export const COMMUNITY_POST_LOCAL_ONLY_BADGE = '이 기기 전용';

export const COMMUNITY_POST_PENDING_MODERATION_BADGE = '검수 대기';

export const COMMUNITY_FEED_DEV_DATA_SOURCE_PREFIX = 'dataSource:';

/** 상세 — 로컬(이 기기) 모드 안내 */
export const COMMUNITY_DETAIL_LOCAL_MODE_BANNER =
  '지금은 이 기기에만 반영됩니다. 댓글·좋아요는 이 기기에 저장되며, 동기화 후 서버 기준으로 표시됩니다.';

/** 상세 — 서버 피드 로드 후 로컬 상호작용 안내 */
export const COMMUNITY_DETAIL_API_LOCAL_NOTE =
  '서버 피드를 불러온 상태입니다. 댓글·좋아요는 아직 이 기기에만 저장됩니다.';

/** 내담자 글쓰기 성공 알림 */
export const COMMUNITY_CREATE_CLIENT_LOCAL_ALERT =
  '글이 이 기기에만 등록되었습니다. 동기화 후 검수·공개 흐름이 적용됩니다.';

/** 상담사 칼럼 글쓰기 성공 알림 */
export const COMMUNITY_CREATE_CONSULTANT_LOCAL_ALERT =
  '칼럼이 이 기기에만 등록되었습니다. 동기화 후 프로필명·검수 흐름이 적용됩니다.';

export const COMMUNITY_CREATE_LOCAL_ALERT_TITLE = '기기에 저장됨';
