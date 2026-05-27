/**
 * 커뮤니티 작성자 표시 헬퍼 — Phase 4 옵션 b
 * (USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.12 Q12).
 *
 * 작성자가 익명화된 경우 ({@code authorAnonymized=true}) "[삭제된 사용자]" 와 같은
 * 안전한 표식 문자열을 반환한다. 본문은 보존되므로 호출자가 본문을 그대로 노출하면 된다.
 *
 * @author Core Solution
 * @since 2026-06-06
 */

import { toDisplayString } from './safeDisplay';

/** 작성자 익명 표시 i18n key (community 네임스페이스). */
export const COMMUNITY_ANONYMIZED_AUTHOR_KEY = 'anonymizedAuthor';

/** 익명 작성자 avatar 표시용 단일 문자. */
export const COMMUNITY_ANONYMIZED_INITIAL_KEY = 'anonymizedAvatarInitial';

/**
 * 작성자 표시 문자열을 반환한다. {@code authorAnonymized=true} 이면 i18n 익명 라벨,
 * 그렇지 않으면 원본 author 문자열을 안전하게 정규화하여 반환.
 *
 * @param {Object} post API 응답 게시글·댓글 (author / authorAnonymized 필드 보유)
 * @param {Function} t  react-i18next translator (community 네임스페이스 권장)
 * @param {string} [fallback='—'] 표시 가능한 author 가 없을 때 fallback
 * @returns {string}
 */
export function getAuthorDisplay(post, t, fallback = '—') {
  if (post && post.authorAnonymized) {
    if (typeof t === 'function') {
      return t(COMMUNITY_ANONYMIZED_AUTHOR_KEY, '[삭제된 사용자]');
    }
    return '[삭제된 사용자]';
  }
  return toDisplayString(post?.author, fallback);
}

/**
 * Avatar initial 표시 문자열을 반환한다. 익명화면 익명 placeholder 단일 문자, 아니면
 * 원본 author 의 첫 글자.
 *
 * @param {Object} post API 응답 게시글·댓글
 * @param {Function} t  react-i18next translator
 * @returns {string}
 */
export function getAuthorAvatarInitial(post, t) {
  if (post && post.authorAnonymized) {
    if (typeof t === 'function') {
      return t(COMMUNITY_ANONYMIZED_INITIAL_KEY, '—');
    }
    return '—';
  }
  const author = toDisplayString(post?.author, '');
  return author ? author.charAt(0) : '—';
}

/**
 * 프로필 이미지 표시 여부. 익명화된 작성자는 항상 placeholder 사용.
 *
 * @param {Object} post API 응답 게시글·댓글
 * @returns {boolean} true 면 원본 프로필 이미지 표시 가능, false 면 placeholder 강제
 */
export function shouldShowAuthorProfileImage(post) {
  if (!post) return false;
  return !post.authorAnonymized;
}
