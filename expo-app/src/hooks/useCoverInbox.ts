/**
 * 커버 홈 「소식」 배너 + 「알림」 원천 데이터 (내담자·상담사 공용).
 * 배너는 활성 시스템 공지가 있을 때만, 상담사는 결제·금액 문구 공지를 제외한다.
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import { useCallback, useMemo } from 'react';
import { useNotifications, useUnreadCount } from '@/api/hooks/useNotifications';
import { useActiveSystemNotices } from '@/api/hooks/useSystemNotifications';
import {
  pickCoverNewsBanner,
  toCoverNotificationSources,
  type CoverNewsBannerView,
  type CoverNotificationSource,
} from '@/utils/coverChapterViewModel';

export interface CoverInbox {
  readonly banner: CoverNewsBannerView | null;
  readonly notificationSources: CoverNotificationSource[];
  readonly unreadCount: number;
  readonly refetchAll: () => Promise<unknown>;
}

export function useCoverInbox(role: 'CLIENT' | 'CONSULTANT'): CoverInbox {
  const noticesQuery = useActiveSystemNotices();
  const notificationsQuery = useNotifications();
  const unreadQuery = useUnreadCount();

  const banner = useMemo(
    () => pickCoverNewsBanner(noticesQuery.data ?? [], role),
    [noticesQuery.data, role],
  );
  const notificationSources = useMemo(
    () => toCoverNotificationSources(notificationsQuery.data?.pages),
    [notificationsQuery.data?.pages],
  );

  const refetchAll = useCallback(
    () =>
      Promise.all([noticesQuery.refetch(), notificationsQuery.refetch(), unreadQuery.refetch()]),
    [noticesQuery, notificationsQuery, unreadQuery],
  );

  return {
    banner,
    notificationSources,
    unreadCount: unreadQuery.data?.count ?? 0,
    refetchAll,
  };
}
