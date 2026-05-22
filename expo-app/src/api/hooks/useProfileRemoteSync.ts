/**
 * 프로필 화면 포커스 시 서버 프로필 이미지와 세션 동기화
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiGet } from '../client';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  extractProfileImageUrlFromPutResponse,
  resolveProfileGetEndpoint,
  resolveProfileImageExtractRole,
} from '@/utils/profileImagePayload';

export function useProfileRemoteSync() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) {
        return undefined;
      }
      let cancelled = false;
      void (async () => {
        try {
          const extractRole = resolveProfileImageExtractRole(user.role);
          const endpoint = resolveProfileGetEndpoint(user.role, user.id);
          const raw = await apiGet<unknown>(endpoint);
          if (cancelled) {
            return;
          }
          const url = extractProfileImageUrlFromPutResponse(extractRole, raw);
          if (url && url !== user.profileImageUrl) {
            updateUser({ profileImageUrl: url });
          }
        } catch {
          // 베스트 에포트 동기화
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [user?.id, user?.role, user?.profileImageUrl, updateUser]),
  );
}
