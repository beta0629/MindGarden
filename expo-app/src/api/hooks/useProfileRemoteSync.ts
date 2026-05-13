/**
 * 프로필 화면 포커스 시 서버 프로필 이미지와 세션 동기화
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiGet } from '../client';
import { PROFILE_API } from '../endpoints';
import { useAuthStore } from '@/stores/useAuthStore';
import { extractProfileImageUrlFromPutResponse } from './useProfileImageUpload';

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
          const endpoint =
            user.role === 'client'
              ? PROFILE_API.CLIENT_PROFILE
              : PROFILE_API.userProfile(user.id);
          const raw = await apiGet<unknown>(endpoint);
          if (cancelled) {
            return;
          }
          const url = extractProfileImageUrlFromPutResponse(user.role, raw);
          if (url) {
            updateUser({ profileImageUrl: url });
          }
        } catch {
          // 베스트 에포트 동기화
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [user?.id, user?.role, updateUser]),
  );
}
