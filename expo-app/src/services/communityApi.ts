/**
 * 커뮤니티 REST — `CommunityController` (`/api/v1/community`)와 DTO 필드 정합.
 * 실패 시(401·404·네트워크 등) 호출부에서 MMKV/샘플 폴백을 유지한다 (§11.1).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
import { apiDelete, apiGet, apiPatch, apiPost } from '@/api/client';
import { COMMUNITY_API } from '@/api/endpoints';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import {
  normalizeCommunityComment,
  normalizeCommunityPost,
  normalizeCommunityPosts,
} from '@/utils/communityNormalize';
import type { CommunityComment, CommunityPost, CommunityTab } from '@/constants/communityData';

/** Spring `CommunityPostKind` (Jackson enum 이름) */
export type CommunityPostKindDto = 'CLIENT_REVIEW' | 'CONSULTANT_COLUMN';

/**
 * Spring `CommunityReportReasonCode` — Apple T2 1.2 UGC 8종 사유.
 * 핸드오프 §3.3, 백엔드 enum 정합.
 */
export type CommunityReportReasonCodeDto =
  | 'SPAM'
  | 'HARASSMENT'
  | 'ABUSIVE_LANGUAGE'
  | 'OBSCENE'
  | 'VIOLENCE'
  | 'MISINFORMATION'
  | 'COPYRIGHT'
  | 'OTHER';

/** `CommunityUserBlockResponse` — 차단 목록 항목 */
export interface CommunityUserBlockResponseDto {
  id: number;
  blockedUserId: number;
  blockedDisplayName?: string;
  blockedAt: string;
}

/** `CommunityPostCreateRequest` — 필드명 camelCase */
export interface CommunityPostCreateRequestDto {
  postKind: CommunityPostKindDto;
  title: string;
  body: string;
  specialty?: string;
  anonymous: boolean;
}

/** `CommunityPostUpdateRequest` */
export interface CommunityPostUpdateRequestDto {
  title: string;
  body: string;
  specialty?: string;
  anonymous: boolean;
}

/** `CommunityCommentCreateRequest` */
export interface CommunityCommentCreateRequestDto {
  body: string;
}

/** `CommunityReportCreateRequest` */
export interface CommunityReportCreateRequestDto {
  reasonCode: CommunityReportReasonCodeDto;
  detailMessage?: string;
  commentId?: number;
}

function feedQueryParams(feedTab?: CommunityTab): Record<string, string> | undefined {
  if (!feedTab || feedTab === 'all') {
    return undefined;
  }
  return { tab: feedTab };
}

/**
 * 원격 피드 — 파싱 불가 시 throw (`COMMUNITY_PARSE_FAILED`), 네트워크·HTTP 오류도 throw.
 */
export async function fetchRemoteCommunityFeed(feedTab?: CommunityTab): Promise<CommunityPost[]> {
  const raw = await apiGet<unknown>(COMMUNITY_API.LIST, feedQueryParams(feedTab));
  const normalized = normalizeCommunityPosts(unwrapApiResponse(raw) ?? raw);
  if (normalized === null) {
    throw new Error('COMMUNITY_PARSE_FAILED');
  }
  return normalized;
}

export async function fetchRemoteCommunityPost(postId: number): Promise<CommunityPost | null> {
  const raw = await apiGet<unknown>(COMMUNITY_API.detail(postId));
  return normalizeCommunityPost(unwrapApiResponse(raw) ?? raw);
}

export async function createRemoteCommunityPost(
  body: CommunityPostCreateRequestDto,
): Promise<CommunityPost | null> {
  const raw = await apiPost<unknown>(COMMUNITY_API.LIST, body);
  return normalizeCommunityPost(unwrapApiResponse(raw) ?? raw);
}

export async function updateRemoteCommunityPost(
  postId: number,
  body: CommunityPostUpdateRequestDto,
): Promise<CommunityPost | null> {
  const raw = await apiPatch<unknown>(COMMUNITY_API.detail(postId), body);
  return normalizeCommunityPost(unwrapApiResponse(raw) ?? raw);
}

export async function deleteRemoteCommunityPost(postId: number): Promise<void> {
  await apiDelete<unknown>(COMMUNITY_API.detail(postId));
}

export async function createRemoteCommunityComment(
  postId: number,
  body: CommunityCommentCreateRequestDto,
): Promise<CommunityComment | null> {
  const raw = await apiPost<unknown>(COMMUNITY_API.comments(postId), body);
  const data = unwrapApiResponse<unknown>(raw) ?? raw;
  return normalizeCommunityComment(data, 0);
}

export async function deleteRemoteCommunityComment(commentId: number): Promise<void> {
  await apiDelete<unknown>(COMMUNITY_API.commentById(commentId));
}

export async function createRemoteCommunityLike(postId: number): Promise<void> {
  await apiPost<unknown>(COMMUNITY_API.likes(postId));
}

export async function deleteRemoteCommunityLike(postId: number): Promise<void> {
  await apiDelete<unknown>(COMMUNITY_API.likes(postId));
}

export async function createRemoteCommunityReport(
  postId: number,
  body: CommunityReportCreateRequestDto,
): Promise<void> {
  await apiPost<unknown>(COMMUNITY_API.reports(postId), body);
}

/** Apple T2 1.2 — 사용자 차단 */
export async function blockRemoteCommunityUser(
  userId: number,
  reason?: string,
): Promise<void> {
  await apiPost<unknown>(COMMUNITY_API.blockUser(userId), reason ? { reason } : {});
}

/** Apple T2 1.2 — 차단 해제 */
export async function unblockRemoteCommunityUser(userId: number): Promise<void> {
  await apiDelete<unknown>(COMMUNITY_API.blockUser(userId));
}

/** Apple T2 1.2 — 차단 사용자 목록 */
export async function fetchRemoteCommunityBlockedUsers(): Promise<
  CommunityUserBlockResponseDto[]
> {
  const raw = await apiGet<unknown>(COMMUNITY_API.BLOCKED_USERS);
  const data = unwrapApiResponse<unknown>(raw) ?? raw;
  if (!Array.isArray(data)) {
    return [];
  }
  return data as CommunityUserBlockResponseDto[];
}
