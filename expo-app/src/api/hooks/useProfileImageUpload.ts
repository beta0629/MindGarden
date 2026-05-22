/**
 * 프로필 이미지(data URI) 업로드 — 웹 `mypageProfilePayload`와 동일 API
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPut } from '../client';
import { PROFILE_API } from '../endpoints';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  extractProfileImageUrlFromPutResponse,
  resolveProfileImageExtractRole,
} from '@/utils/profileImagePayload';
import { MESSAGE_QUERY_KEYS } from './useMessages';
import { CLIENT_QUERY_KEYS } from './useClients';
import { CONSULTATION_QUERY_KEYS } from './useConsultations';

export {
  extractProfileImageUrlFromPutResponse,
  resolveProfileGetEndpoint,
  resolveProfileImageExtractRole,
} from '@/utils/profileImagePayload';

export function useProfileImageUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dataUri: string) => {
      const u = useAuthStore.getState().user;
      if (!u) {
        throw new Error('로그인이 필요합니다.');
      }
      const extractRole = resolveProfileImageExtractRole(u.role);
      if (extractRole === 'client') {
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
      const profileImageUrl = extractProfileImageUrlFromPutResponse(
        resolveProfileImageExtractRole(u.role),
        raw,
      );
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
