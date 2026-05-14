/**
 * 커뮤니티 API 응답 → `CommunityPost` 정규화 (표시 경계: 스칼라만)
 *
 * SSOT: `docs/project-management/EXPO_NATIVE_APP_PLAN.md` Phase 3-C·§13 `/api/v1/community`
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import type { CommunityComment, CommunityPost, CommunityTab } from '@/constants/communityData';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import { toDisplayString } from '@/utils/toDisplayString';
import { toSafeNumber } from '@/utils/safeDisplay';

function normalizeTab(raw: unknown): CommunityTab {
  const s = toDisplayString(raw, '').toLowerCase();
  if (s.includes('column') || s.includes('칼럼')) return 'columns';
  if (s.includes('review') || s.includes('후기')) return 'reviews';
  return 'all';
}

/**
 * 단일 댓글 응답(`CommunityCommentResponse`) → `CommunityComment`
 */
export function normalizeCommunityComment(raw: unknown, index: number): CommunityComment | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  return {
    id: toSafeNumber(o.id ?? index, index),
    author: toDisplayString(o.author ?? o.writerName, '익명'),
    body: toDisplayString(o.body ?? o.content ?? o.text, ''),
    time: toDisplayString(o.time ?? o.createdAt ?? o.relativeTime, '—'),
    likes: toSafeNumber(o.likes ?? o.likeCount, 0),
  };
}

function normalizePost(raw: unknown, index: number): CommunityPost | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = toSafeNumber(o.id ?? o.postId ?? index + 1, index + 1);
  const title = toDisplayString(o.title ?? o.subject, '');
  const body = toDisplayString(o.body ?? o.content ?? o.preview, '');
  if (!title && !body) return null;
  const commentsRaw = o.comments ?? o.replies;
  const comments: CommunityComment[] = Array.isArray(commentsRaw)
    ? commentsRaw
        .map((c, i) => normalizeCommunityComment(c, i + 1))
        .filter((c): c is CommunityComment => c != null)
    : [];
  const tab = normalizeTab(o.tab ?? o.category ?? o.type);
  const effectiveTab: CommunityTab = tab === 'all' ? 'reviews' : tab;

  return {
    id,
    tab: effectiveTab,
    author: toDisplayString(o.author ?? o.writerName, '익명'),
    specialty: toDisplayString(o.specialty ?? o.speciality, ''),
    title: title || toDisplayString(body, '게시글').slice(0, 80),
    body: body || title,
    likes: toSafeNumber(o.likes ?? o.likeCount, 0),
    comments,
    time: toDisplayString(o.time ?? o.createdAt ?? o.relativeTime, '—'),
    isConsultant: Boolean(o.isConsultant ?? o.consultant ?? o.role === 'CONSULTANT'),
    isAnonymous: Boolean(o.isAnonymous ?? o.anonymous),
  };
}

export function normalizeCommunityPosts(raw: unknown): CommunityPost[] | null {
  const body = unwrapApiResponse<unknown>(raw) ?? raw;
  if (!Array.isArray(body)) {
    if (body && typeof body === 'object') {
      const obj = body as Record<string, unknown>;
      if (Array.isArray(obj.content)) {
        return normalizeCommunityPosts(obj.content);
      }
      if (Array.isArray(obj.posts)) {
        return normalizeCommunityPosts(obj.posts);
      }
    }
    return null;
  }
  const out: CommunityPost[] = [];
  let i = 0;
  for (const row of body) {
    const p = normalizePost(row, i);
    if (p) out.push(p);
    i += 1;
  }
  return out.length > 0 ? out : [];
}

/**
 * 단일 게시 응답(`CommunityPostFeedItemResponse`) → `CommunityPost`
 */
export function normalizeCommunityPost(raw: unknown): CommunityPost | null {
  const body = unwrapApiResponse<unknown>(raw) ?? raw;
  return normalizePost(body, 0);
}
