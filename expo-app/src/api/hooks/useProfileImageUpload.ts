/**
 * 프로필 이미지 multipart 업로드 (P0 영구 대책 Phase 2 — 2026-06-09)
 *
 * <p>이전: base64 dataURI 를 PUT 본문(profileImage / profileImageUrl)에 직접 실어
 * {@code users.profile_image_url} 컬럼(longtext)에 저장 → 마이페이지 응답 폭증.</p>
 *
 * <p>현재: 신설된 {@code POST /api/v1/users/profile/{userId}/image} multipart 엔드포인트로
 * 파일을 업로드하고, 응답의 {@code profileImageUrl} 만 store 에 반영한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09 (rewritten)
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../client';
import { PROFILE_API } from '../endpoints';
import { useAuthStore } from '@/stores/useAuthStore';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import { normalizeProfileImageUploadPayload } from '@/utils/profileImageUploadPayload';
import { MESSAGE_QUERY_KEYS } from './useMessages';
import { CLIENT_QUERY_KEYS } from './useClients';
import { CONSULTATION_QUERY_KEYS } from './useConsultations';

export {
  extractProfileImageUrlFromPutResponse,
  resolveProfileGetEndpoint,
  resolveProfileImageExtractRole,
} from '@/utils/profileImagePayload';

/** 업로드 입력 — expo-image-picker 결과에서 추출한 file URI · MIME · 표시용 파일명. */
export interface ProfileImageUploadInput {
  /** 로컬 파일 URI (file:// 또는 ph://). React Native FormData 가 직접 읽는다. */
  readonly uri: string;
  /** content-type. 기본 'image/jpeg'. */
  readonly mimeType?: string | null;
  /** 표시용 파일명. 기본 timestamp 기반 자동 생성. */
  readonly fileName?: string | null;
}

function extractProfileImageUrl(raw: unknown): string | null {
  const data = unwrapApiResponse<Record<string, unknown>>(raw);
  if (!data || typeof data !== 'object') {
    return null;
  }
  const v = data.profileImageUrl;
  return typeof v === 'string' && v.trim() !== '' ? v : null;
}

export function useProfileImageUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProfileImageUploadInput) => {
      const u = useAuthStore.getState().user;
      if (!u) {
        throw new Error('로그인이 필요합니다.');
      }
      const payload = normalizeProfileImageUploadPayload(input);

      const formData = new FormData();
      // React Native FormData — { uri, name, type } 객체를 직접 append.
      // axios 가 multipart boundary 를 자동 생성하므로 Content-Type 헤더는 명시하지 않는다.
      formData.append('file', payload as unknown as Blob);

      return apiPost<unknown>(PROFILE_API.uploadProfileImage(u.id), formData, {
        headers: {
          // RN axios 멀티파트: Content-Type 을 비워 axios·fetch 가 boundary 포함 자동 설정하게 한다.
          // 일부 환경에서 명시가 필요하면 'multipart/form-data' 로 두되 boundary 는 생략(브라우저/RN 이 채움).
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data,
      });
    },
    onSuccess: (raw) => {
      const u = useAuthStore.getState().user;
      if (!u) {
        return;
      }
      const profileImageUrl = extractProfileImageUrl(raw);
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
