/**
 * 프로필 이미지 API 응답·엔드포인트 매핑 (웹 mypageProfilePayload 정합)
 *
 * @author MindGarden
 * @since 2026-05-22
 */
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import { PROFILE_API } from '@/api/endpoints';
import type { AppAuthRole } from '@/stores/useAuthStore';

/**
 * PUT/GET 프로필 API 본문에서 표시용 이미지 URL·data URI 추출
 */
export function extractProfileImageUrlFromPutResponse(
  role: 'client' | 'consultant',
  raw: unknown,
): string | null {
  const data = unwrapApiResponse<Record<string, unknown>>(raw);
  if (!data || typeof data !== 'object') {
    return null;
  }
  if (role === 'client') {
    const v = data.profileImage ?? data.profileImageUrl;
    return typeof v === 'string' && v.trim() !== '' ? v : null;
  }
  const v = data.profileImageUrl ?? data.profileImage;
  return typeof v === 'string' && v.trim() !== '' ? v : null;
}

/** 웹 mypageProfileRoles — 상담사만 userProfile, 그 외 CLIENT_PROFILE */
export function resolveProfileImageExtractRole(appRole: AppAuthRole): 'client' | 'consultant' {
  return appRole === 'consultant' ? 'consultant' : 'client';
}

export function resolveProfileGetEndpoint(appRole: AppAuthRole, userId: number): string {
  if (appRole === 'consultant') {
    return PROFILE_API.userProfile(userId);
  }
  return PROFILE_API.CLIENT_PROFILE;
}

/**
 * 프로필 GET 응답에서 휴대폰 번호 원본 자리(11자리 또는 하이픈 포함)를 추출.
 * 응답 키 호환: `phone`, `phoneNumber`, `mobile`. 없으면 null.
 *
 * 표시 시에는 PII 정책상 maskKoreanMobileForDisplay 등으로 반드시 마스킹.
 */
export function extractPhoneFromProfileResponse(raw: unknown): string | null {
  const data = unwrapApiResponse<Record<string, unknown>>(raw);
  if (!data || typeof data !== 'object') {
    return null;
  }
  const candidate = data.phone ?? data.phoneNumber ?? data.mobile;
  return typeof candidate === 'string' && candidate.trim() !== '' ? candidate : null;
}
