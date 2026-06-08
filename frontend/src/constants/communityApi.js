/**
 * Apple T2 (1.2 UGC) — 커뮤니티 안전장치 API 엔드포인트 상수.
 *
 * <p>백엔드 컨트롤러:
 * <ul>
 *   <li>{@code CommunityController} — 게시·댓글·신고 (사용자)</li>
 *   <li>{@code CommunityUserBlockController} — 차단 / 해제 / 목록</li>
 *   <li>{@code AdminCommunityModerationController} — 어드민 검수 큐 / 신고 큐 / hide / unhide</li>
 * </ul>
 *
 * <p>모든 호출은 {@code utils/standardizedApi.js} 의 {@code StandardizedApi} 를 거쳐
 * tenantId 헤더와 세션 갱신을 자동 적용한다.
 *
 * @author MindGarden
 * @since 2026-06-07
 */

export const COMMUNITY_API = {
  POSTS: '/api/v1/community',
  postDetail: (postId) => `/api/v1/community/${postId}`,
  postReports: (postId) => `/api/v1/community/${postId}/reports`,
  USERS_BLOCK: (userId) => `/api/v1/community/users/${userId}/block`,
  USERS_BLOCKED: '/api/v1/community/users/blocked'
};

export const ADMIN_COMMUNITY_API = {
  REPORTS: '/api/v1/admin/community/reports',
  reportPatch: (reportId) => `/api/v1/admin/community/reports/${reportId}`,
  postHide: (postId) => `/api/v1/admin/community/posts/${postId}/hide`,
  postUnhide: (postId) => `/api/v1/admin/community/posts/${postId}/unhide`,
  commentHide: (commentId) => `/api/v1/admin/community/comments/${commentId}/hide`,
  commentUnhide: (commentId) => `/api/v1/admin/community/comments/${commentId}/unhide`
};

export const COMMUNITY_REPORT_REASONS = [
  { code: 'SPAM', label: '스팸·광고' },
  { code: 'HARASSMENT', label: '괴롭힘·혐오' },
  { code: 'ABUSIVE_LANGUAGE', label: '욕설·폭력적 언어' },
  { code: 'OBSCENE', label: '음란·외설' },
  { code: 'VIOLENCE', label: '폭력·위협' },
  { code: 'MISINFORMATION', label: '허위 정보' },
  { code: 'COPYRIGHT', label: '저작권 침해' },
  { code: 'OTHER', label: '기타' }
];

export const COMMUNITY_REPORT_STATUS_OPTIONS = [
  { value: 'OPEN', label: '신규' },
  { value: 'UNDER_REVIEW', label: '검토 중' },
  { value: 'RESOLVED', label: '처리 완료' },
  { value: 'REJECTED', label: '기각' }
];

export const COMMUNITY_REPORT_RESOLUTION_ACTIONS = [
  { value: 'HIDE_CONTENT', label: '콘텐츠 숨김' },
  { value: 'DELETE_CONTENT', label: '콘텐츠 삭제' },
  { value: 'SUSPEND_USER', label: '사용자 일시정지' },
  { value: 'BAN_USER', label: '사용자 영구추방' }
];

/** SLA 임계치 — 분 단위. 디자이너 §8.3 */
export const COMMUNITY_SLA_THRESHOLDS = {
  WARN_MINUTES: 12 * 60,
  DANGER_MINUTES: 18 * 60,
  BREACH_MINUTES: 24 * 60
};
