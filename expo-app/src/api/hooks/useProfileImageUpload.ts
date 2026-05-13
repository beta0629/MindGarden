/**
 * 프로필 이미지(data URI) 업로드 — 웹 `mypageProfilePayload`와 동일 API
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPut } from '../client';
import { PROFILE_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';
import { useAuthStore } from '@/stores/useAuthStore';
import { MESSAGE_QUERY_KEYS } from './useMessages';
import { CLIENT_QUERY_KEYS } from './useClients';
import { CONSULTATION_QUERY_KEYS } from './useConsultations';

/**
 * PUT/GET 프로필 API 본문에서 표시용 이미지 URL·data URI 추출
 *
 * @param role 세션 역할
 * @param raw axios 이후 본문(ApiResponse 래퍼 가능)
 * @returns 프로필 이미지 문자열 또는 null
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
  const v = data.profileImageUrl;
  return typeof v === 'string' && v.trim() !== '' ? v : null;
}

export function useProfileImageUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dataUri: string) => {
      const u = useAuthStore.getState().user;
      if (!u) {
        throw new Error('로그인이 필요합니다.');
      }
      if (u.role === 'client') {
        return apiPut<unknown>(PROFILE_API.CLIENT_PROFILE, {
          profileImage: dataUri,
        });
      }
      return apiPut<unknown>(PROFILE_API.userProfile(u.id), {
        profileImageUrl: dataUri,
      });
    },
    onSuccess: (raw) => {
      const u = useAuthStore.getState().user;
      if (!u) {
        return;
      }
      const profileImageUrl = extractProfileImageUrlFromPutResponse(u.role, raw);
      if (profileImageUrl) {
        useAuthStore.getState().updateUser({ profileImageUrl });
      }
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: MESSAGE_QUERY_KEYS.conversations() }),
        queryClient.invalidateQueries({ queryKey: MESSAGE_QUERY_KEYS.messages() }),
        queryClient.invalidateQueries({ queryKey: [...CLIENT_QUERY_KEYS.all] }),
        queryClient.invalidateQueries({ queryKey: [...CONSULTATION_QUERY_KEYS.all] }),
      ]);
    },
  });
}
