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
 * Spring `CommunityReportReasonCode` — Apple G1.2 UGC P2-C 5종 + 레거시 4종 호환.
 *
 * <p>FE 는 새 신고에서 5종({@code OBSCENE}/{@code HARASSMENT}/{@code SPAM}/{@code SELF_HARM}/{@code OTHER})
 * 만 사용한다. 레거시 4종({@code ABUSIVE_LANGUAGE}/{@code VIOLENCE}/{@code MISINFORMATION}/{@code COPYRIGHT})
 * 은 기존 데이터 직렬화 호환을 위해 타입에만 남기고 UI 에서는 노출하지 않는다.</p>
 */
export type CommunityReportReasonCodeDto =
  | 'OBSCENE'
  | 'HARASSMENT'
  | 'SPAM'
  | 'SELF_HARM'
  | 'OTHER'
  | 'ABUSIVE_LANGUAGE'
  | 'VIOLENCE'
  | 'MISINFORMATION'
  | 'COPYRIGHT';

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
