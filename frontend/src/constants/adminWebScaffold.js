/**
 * 웹 어드민 본체 스캐폴드 — 콘텐츠·커뮤니티 운영 화면용 API·UI 상수
 * BW-4 커뮤니티 검수 (`AdminCommunityModerationController` 베이스 `/api/v1/admin/community`)
 * - GET `{COMMUNITY_MODERATION_QUEUE}` — 목록, 선택 쿼리 `status`(PENDING|APPROVED|REJECTED)
 * - GET `{COMMUNITY_MODERATION_QUEUE}/{id}` — 큐 단건 상세
 * - PATCH `{COMMUNITY_POSTS_MODERATION_ROOT}/{postId}/moderation` — 본문 `{ status, rejectReason? }`
 * BW-3 콘텐츠 마스터: `AdminPsychoEducationContentController`·`AdminHealingContentCatalogController`
 * — 심리교육 `/api/v1/admin/content/psycho-education`, 힐링 카탈로그 `/api/v1/admin/content/healing-catalog`
 * — 각각 GET 목록·POST·PUT `/{id}`·PATCH `/{id}/visibility` (`isActive`)
 * BW-6 웰니스 관측: `AdminMindWeatherObservabilityController`·`AdminMindGardenObservabilityController`
 * — `/api/v1/admin/wellness/mind-weather/cards|summary`, `/api/v1/admin/wellness/mind-garden/snapshots|summary` (GET 전용)
 * @see docs/project-management/WEB_ADMIN_APP_SCOPE_AND_CHECKOUT_FEATURES.md
 * @author CoreSolution
 * @since 2026-05-14
 */

/** 노출 PATCH 요청 본문 필드명(백엔드 DTO와 동일하게 유지) */
// 백엔드 PublishedPatchRequest({ Boolean published }) 와 일치하는 패치 body 키.
export const ADMIN_CONTENT_VISIBILITY_FIELD = 'published';

/** @type {Readonly<{ COMMUNITY_MODERATION_QUEUE: string, COMMUNITY_POSTS_MODERATION_ROOT: string, ADMIN_CONTENT_PSYCHO_EDUCATION: string, ADMIN_CONTENT_HEALING_CATALOG: string, MIND_WEATHER_CARDS: string, MIND_WEATHER_SUMMARY: string, MIND_GARDEN_SNAPSHOTS: string, MIND_GARDEN_SUMMARY: string }>} */
export const ADMIN_WEB_SCAFFOLD_API = {
  COMMUNITY_MODERATION_QUEUE: '/api/v1/admin/community/moderation-queue',
  COMMUNITY_POSTS_MODERATION_ROOT: '/api/v1/admin/community/posts',
  ADMIN_CONTENT_PSYCHO_EDUCATION: '/api/v1/admin/content/psycho-education',
  ADMIN_CONTENT_HEALING_CATALOG: '/api/v1/admin/content/healing-catalog',
  MIND_WEATHER_CARDS: '/api/v1/admin/wellness/mind-weather/cards',
  MIND_WEATHER_SUMMARY: '/api/v1/admin/wellness/mind-weather/summary',
  MIND_GARDEN_SNAPSHOTS: '/api/v1/admin/wellness/mind-garden/snapshots',
  MIND_GARDEN_SUMMARY: '/api/v1/admin/wellness/mind-garden/summary'
};

/**
 * @param {string|number} contentId
 * @returns {string}
 */
export function buildPsychoEducationContentItemPath(contentId) {
  return `${ADMIN_WEB_SCAFFOLD_API.ADMIN_CONTENT_PSYCHO_EDUCATION}/${encodeURIComponent(String(contentId))}`;
}

/**
 * @param {string|number} contentId
 * @returns {string}
 */
export function buildPsychoEducationContentVisibilityPath(contentId) {
  // 백엔드 AdminPsychoEducationContentController.@PatchMapping("/{id}/published") 와 일치.
  return `${buildPsychoEducationContentItemPath(contentId)}/published`;
}

/**
 * @param {string|number} contentId
 * @returns {string}
 */
export function buildHealingCatalogItemPath(contentId) {
  return `${ADMIN_WEB_SCAFFOLD_API.ADMIN_CONTENT_HEALING_CATALOG}/${encodeURIComponent(String(contentId))}`;
}

/**
 * @param {string|number} contentId
 * @returns {string}
 */
export function buildHealingCatalogVisibilityPath(contentId) {
  // 백엔드 AdminHealingContentCatalogController.@PatchMapping("/{id}/published") 와 일치.
  return `${buildHealingCatalogItemPath(contentId)}/published`;
}

/**
 * 힐링 콘텐츠 노출 PATCH 경로. 별칭 — buildHealingCatalogVisibilityPath 와 동일.
 * @param {string|number} contentId
 * @returns {string}
 */
export function buildHealingCatalogPublishedPath(contentId) {
  return buildHealingCatalogVisibilityPath(contentId);
}

/**
 * @param {boolean} nextActive
 * @returns {Readonly<Record<string, boolean>>}
 */
export function buildAdminContentVisibilityPatchBody(nextActive) {
  return { [ADMIN_CONTENT_VISIBILITY_FIELD]: Boolean(nextActive) };
}

/**
 * 힐링 콘텐츠 노출 PATCH body. PublishedPatchRequest({ Boolean published }) 형태.
 * @param {boolean} nextPublished
 * @returns {Readonly<Record<string, boolean>>}
 */
export function buildHealingCatalogPublishedPatchBody(nextPublished) {
  return { published: Boolean(nextPublished) };
}

/**
 * @param {Object} row
 * @returns {string|number|undefined}
 */
export function pickContentMasterRowId(row) {
  if (!row || typeof row !== 'object') {
    return undefined;
  }
  return row.id ?? row.articleId;
}

/**
 * @param {Object} row
 * @returns {boolean}
 */
export function pickContentMasterRowVisibility(row) {
  if (!row || typeof row !== 'object') {
    return true;
  }
  if (row.isActive === false || row.published === false || row.visible === false) {
    return false;
  }
  if (row.isActive === true || row.published === true || row.visible === true) {
    return true;
  }
  return true;
}

/**
 * 검수 큐 단건 상세(GET) 경로
 * @param {string|number} postId
 * @returns {string}
 */
export function buildCommunityModerationQueueItemPath(postId) {
  const id = postId != null ? String(postId).trim() : '';
  if (id === '') {
    return ADMIN_WEB_SCAFFOLD_API.COMMUNITY_MODERATION_QUEUE;
  }
  return `${ADMIN_WEB_SCAFFOLD_API.COMMUNITY_MODERATION_QUEUE}/${encodeURIComponent(id)}`;
}

/**
 * 게시 검수 상태 PATCH (`@PatchMapping("/posts/{postId}/moderation")`)
 * @param {string|number} postId
 * @returns {string}
 */
export function buildCommunityModerationPatchPath(postId) {
  const id = postId != null ? String(postId).trim() : '';
  if (id === '') {
    return ADMIN_WEB_SCAFFOLD_API.COMMUNITY_POSTS_MODERATION_ROOT;
  }
  return `${ADMIN_WEB_SCAFFOLD_API.COMMUNITY_POSTS_MODERATION_ROOT}/${encodeURIComponent(id)}/moderation`;
}

/** @type {Readonly<{ ALL: string, PENDING: string, APPROVED: string, REJECTED: string }>} */
export const COMMUNITY_MODERATION_STATUS = {
  ALL: 'ALL',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

export const COMMUNITY_MODERATION_STATUS_FILTER_OPTIONS = [
  { value: COMMUNITY_MODERATION_STATUS.ALL, label: '전체' },
  { value: COMMUNITY_MODERATION_STATUS.PENDING, label: '검수 대기' },
  { value: COMMUNITY_MODERATION_STATUS.APPROVED, label: '승인' },
  { value: COMMUNITY_MODERATION_STATUS.REJECTED, label: '반려' }
];

export const ADMIN_WEB_SCAFFOLD_COPY = {
  COMMUNITY_PAGE_TITLE: '커뮤니티 검수 큐',
  COMMUNITY_PAGE_SUBTITLE: '게시 검수 목록을 확인하고 승인·반려 처리합니다.',
  CONTENT_MASTER_TITLE: '심리교육·힐링 콘텐츠 마스터',
  CONTENT_MASTER_SUBTITLE:
    'BW-3 관리자 API(`/api/v1/admin/content/psycho-education`, `/api/v1/admin/content/healing-catalog`)로 목록·등록·수정·노출(PATCH)을 처리합니다.',
  PUSH_MONITOR_TITLE: '푸시 설정 모니터링',
  PUSH_MONITOR_SUBTITLE: 'BW-1 알림·푸시 설정 모니터링 API가 준비되면 이 화면에 지표가 표시됩니다.',
  MIND_WEATHER_OBS_TITLE: '마음 날씨 관측',
  MIND_WEATHER_OBS_SUBTITLE: 'BW-6 읽기 전용 — 테넌트 내 마음 날씨 카드 생성·공유 지표를 확인합니다.',
  MIND_GARDEN_OBS_TITLE: '마음 정원 관측',
  MIND_GARDEN_OBS_SUBTITLE: 'BW-6 읽기 전용 — 인메모리 성장 스냅샷(멀티 노드 시 일부만 표시될 수 있음).',
  MODAL_CONFIRM_APPROVE_TITLE: '게시글 승인',
  MODAL_CONFIRM_APPROVE_BODY: '선택한 항목을 승인(게시) 처리합니다. 계속하시겠습니까?',
  MODAL_CONFIRM_REJECT_TITLE: '게시글 반려',
  MODAL_CONFIRM_REJECT_BODY: '선택한 항목을 반려합니다. 필요 시 사유를 입력한 뒤 확인을 누르세요.',
  MODAL_REJECT_REASON_LABEL: '반려 사유(선택)',
  MODAL_ACTION_CANCEL: '취소',
  MODAL_ACTION_CONFIRM: '확인',
  MODAL_ADD_CONTENT_TITLE: '콘텐츠 추가',
  MODAL_EDIT_CONTENT_TITLE: '콘텐츠 수정',
  MODAL_ADD_CONTENT_BODY: '저장 시 신규는 POST, 수정 모드는 PUT으로 반영됩니다.',
  EMPTY_COMMUNITY_TITLE: '표시할 검수 항목이 없습니다',
  EMPTY_COMMUNITY_DESC: '필터를 바꾸거나 잠시 후 다시 불러오세요.',
  LIST_ERROR_RETRY: '다시 시도',
  DETAIL_LOAD_ERROR_PREFIX: '상세를 불러오지 못했습니다. ',
  DETAIL_SECTION_BODY_LABEL: '본문',
  COMMUNITY_DETAIL_LOADING: '상세를 불러오는 중…',
  MODAL_PATCH_ERROR_TITLE: '처리 실패',
  EMPTY_CONTENT_TITLE: '불러온 데이터가 없습니다',
  EMPTY_CONTENT_DESC: '관리자 목록 API가 비어 있거나 권한·경로가 맞지 않을 수 있습니다. 네트워크 탭에서 응답을 확인해 주세요.',
  CONTENT_ERROR_LOAD: '목록을 불러오지 못했습니다.',
  CONTENT_ERROR_SAVE: '저장에 실패했습니다.',
  CONTENT_ERROR_VISIBILITY: '노출 상태를 바꾸지 못했습니다.',
  CONTENT_SUCCESS_CREATED: '콘텐츠를 등록했습니다.',
  CONTENT_SUCCESS_UPDATED: '콘텐츠를 수정했습니다.',
  CONTENT_SUCCESS_VISIBILITY: '노출 상태를 반영했습니다.',
  CONTENT_VALIDATION_TITLE: '제목을 입력해 주세요.',
  CONTENT_TABLE_VISIBILITY: '노출',
  CONTENT_TABLE_ACTIONS: '작업',
  CONTENT_ACTION_EDIT: '수정',
  CONTENT_ACTION_SHOW: '노출하기',
  CONTENT_ACTION_HIDE: '비노출',
  CONTENT_FORM_LABEL_TITLE: '제목',
  CONTENT_FORM_LABEL_SUMMARY: '요약',
  CONTENT_FORM_LABEL_BODY: '본문',
  CONTENT_FORM_LABEL_CATEGORY: '카테고리 코드',
  CONTENT_FORM_LABEL_READ_MINUTES: '예상 읽기(분)',
  CONTENT_FORM_LABEL_DESCRIPTION: '설명',
  CONTENT_FORM_LABEL_CODE: '코드(고유 식별자)',
  CONTENT_FORM_HINT_AUTO_CODE: '비워두면 제목 기반으로 자동 생성됩니다.',
  CONTENT_FORM_LABEL_TYPE: '유형',
  CONTENT_FORM_LABEL_DURATION: '길이(분)',
  CONTENT_FORM_LABEL_THUMB: '썸네일 URL',
  CONTENT_FORM_LABEL_CONTENT_URL: '콘텐츠 URL',
  CONTENT_FORM_LABEL_PUBLISHED: '공개(앱 노출)',
  CONTENT_FORM_LABEL_SORT_ORDER: '정렬 순서(작을수록 위)',
  CONTENT_FORM_VALIDATION_BODY: '본문을 입력해 주세요.',
  CONTENT_QUICK_ADD_TITLE_PLACEHOLDER: '새 콘텐츠 제목을 입력하고 빠른 등록을 누르세요',
  CONTENT_QUICK_ADD_BUTTON: '빠른 등록',
  CONTENT_QUICK_ADD_SUCCESS: '초안을 추가했습니다. 필요 시 [수정]에서 상세 입력하세요.',
  CONTENT_ADVANCED_TOGGLE_SHOW: '고급 옵션 펼치기',
  CONTENT_ADVANCED_TOGGLE_HIDE: '고급 옵션 접기',
  CONTENT_FORM_SAVE: '저장',
  CONTENT_FORM_CANCEL: '취소',
  CONTENT_RELOAD: '다시 불러오기',
  PUSH_PLACEHOLDER_BODY: '예정: 발송 큐 길이, 실패율, 테넌트별 설정 스냅샷 등(BW-1).',
  PUSH_FOOTER_NOTE: 'StandardizedApi 연동 시 이 영역에 테이블·차트가 배치됩니다.',
  PUSH_EMPTY_TITLE: '모니터링 API 준비 중',
  COMMUNITY_DETAIL_STATUS_PREFIX: '상태: ',
  COMMUNITY_MODAL_ACTION_TYPE_PREFIX: '요청 유형: ',
  ACTION_APPROVE: '승인',
  ACTION_REJECT: '반려',
  COMMUNITY_SELECT_ROW_HINT_TITLE: '행을 선택하면 상세가 표시됩니다',
  MODAL_CLOSE_CONFIRM: '확인',
  SECTION_STATUS_FILTER: '상태 필터',
  SECTION_POST_LIST: '게시 목록',
  SECTION_DETAIL: '상세',
  SECTION_CONTENT_TYPE: '콘텐츠 유형',
  SECTION_MASTER_LIST: '목록',
  SECTION_PUSH_INFO: '안내',
  SECTION_MIND_WEATHER_SUMMARY: '요약 지표',
  SECTION_MIND_WEATHER_CARDS: '최근 카드',
  SECTION_MIND_GARDEN_SUMMARY: '요약 지표',
  SECTION_MIND_GARDEN_SNAPSHOTS: '사용자 스냅샷',
  COMMUNITY_TABLE_TITLE: '제목',
  COMMUNITY_TABLE_STATUS: '상태',
  COMMUNITY_TABLE_AUTHOR: '작성자',
  COMMUNITY_TABLE_CREATED: '등록',
  CONTENT_TABLE_TITLE_CODE: '제목·코드',
  CONTENT_TABLE_DESC: '설명·요약',
  CONTENT_TABLE_META: '메타',
  CONTENT_MASTER_ADD_BUTTON: '추가'
};

/**
 * 표준/비표준 페이로드에서 배열 행만 추출
 * @param {*} payload
 * @returns {Array<Object>}
 */
export function normalizeApiListPayload(payload) {
  if (payload == null) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (typeof payload !== 'object') {
    return [];
  }
  const candidateKeys = ['data', 'content', 'items', 'posts', 'records', 'list', 'elements', 'moderationQueue', 'queue', 'cards', 'snapshots'];
  for (let i = 0; i < candidateKeys.length; i += 1) {
    const key = candidateKeys[i];
    const v = payload[key];
    if (Array.isArray(v)) {
      return v;
    }
  }
  return [];
}

/**
 * Spring Data `Page` JSON (`content` 배열) 또는 일반 목록 페이로드에서 행 배열 추출
 * @param {*} payload
 * @returns {Array<Object>}
 */
export function normalizeSpringPageRows(payload) {
  if (payload != null && typeof payload === 'object' && Array.isArray(payload.content)) {
    return payload.content;
  }
  return normalizeApiListPayload(payload);
}

/**
 * Spring `Page` 메타(없으면 기본값)
 * @param {*} payload
 * @returns {{ totalElements: number, number: number, size: number, totalPages: number }}
 */
export function pickSpringPageMeta(payload) {
  if (payload == null || typeof payload !== 'object') {
    return { totalElements: 0, number: 0, size: 20, totalPages: 0 };
  }
  return {
    totalElements: payload.totalElements != null ? Number(payload.totalElements) : 0,
    number: payload.number != null ? Number(payload.number) : 0,
    size: payload.size != null ? Number(payload.size) : 20,
    totalPages: payload.totalPages != null ? Number(payload.totalPages) : 0
  };
}

/**
 * 단건 응답에서 객체 레코드만 추출 (ApiResponse.data 또는 본문 객체)
 * @param {*} payload
 * @returns {Object|null}
 */
export function normalizeApiRecordPayload(payload) {
  if (payload == null) {
    return null;
  }
  if (typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }
  if (
    Object.prototype.hasOwnProperty.call(payload, 'data')
    && payload.data != null
    && typeof payload.data === 'object'
    && !Array.isArray(payload.data)
  ) {
    return payload.data;
  }
  return payload;
}

/**
 * 검수 본문 텍스트 후보 필드 통합
 * @param {Object} row
 * @returns {string}
 */
export function pickCommunityRowContent(row) {
  if (!row || typeof row !== 'object') {
    return '';
  }
  const c = row.content ?? row.body ?? row.postBody ?? row.text ?? row.description ?? '';
  return c != null ? String(c) : '';
}

/**
 * BW-4 PATCH 본문 (status + 선택 반려 사유)
 * @param {'approve'|'reject'} action
 * @param {string} [rejectReason]
 * @returns {{ status: string, rejectReason?: string }}
 */
export function buildCommunityModerationPatchBody(action, rejectReason) {
  const reason = rejectReason != null ? String(rejectReason).trim() : '';
  if (action === 'approve') {
    return { status: COMMUNITY_MODERATION_STATUS.APPROVED };
  }
  const body = { status: COMMUNITY_MODERATION_STATUS.REJECTED };
  if (reason !== '') {
    body.rejectReason = reason;
  }
  return body;
}

/**
 * @param {Object} row
 * @returns {string}
 */
export function pickCommunityRowTitle(row) {
  if (!row || typeof row !== 'object') {
    return '';
  }
  const t = row.title ?? row.subject ?? row.postTitle ?? row.summary;
  return t != null ? String(t) : '';
}

/**
 * @param {Object} row
 * @returns {string}
 */
export function pickCommunityRowStatus(row) {
  if (!row || typeof row !== 'object') {
    return '';
  }
  const s = row.status ?? row.moderationStatus ?? row.reviewStatus ?? row.state;
  return s != null ? String(s) : '';
}

/**
 * @param {Object} row
 * @returns {string|number|null|undefined}
 */
export function pickCommunityRowId(row) {
  if (!row || typeof row !== 'object') {
    return undefined;
  }
  return row.id ?? row.postId ?? row.moderationQueueId ?? row.queueItemId ?? row.uuid;
}
