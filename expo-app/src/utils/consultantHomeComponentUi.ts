/**
 * 상담사 홈 P0-3~4 컴포넌트 표시 모델 — RN 렌더 없이 단위 테스트 가능
 *
 * @author MindGarden
 * @since 2026-07-07
 */
import type {
  HighPriorityClientItem,
  UpcomingPreparationSession,
} from '@/utils/consultantHomeApiNormalize';
import { CONSULTANT_HOME_COPY } from '@/constants/consultantHomeCopy';

export type ConsultantNextSessionCardRenderState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | {
      kind: 'content';
      badgeLabel: string;
      timeRange: string;
      sessionLine: string;
      accessibilityLabel: string;
      recordCta: string;
      detailCta: string;
      scheduleId: number;
    };

export interface ConsultantUrgentClientBannerModel {
  bannerText: string;
  accessibilityLabel: string;
  ctaLabel: string;
}

export function buildConsultantNextSessionCardModel(
  session: UpcomingPreparationSession | null,
  isLoading = false,
): ConsultantNextSessionCardRenderState {
  if (isLoading) {
    return { kind: 'loading' };
  }
  if (!session) {
    return { kind: 'empty' };
  }

  const badgeLabel =
    session.countdownLabel ??
    (session.isToday
      ? CONSULTANT_HOME_COPY.NEXT_SESSION_BADGE_TODAY
      : CONSULTANT_HOME_COPY.NEXT_SESSION_BADGE_TOMORROW);

  const timeRange = `${session.startTime} - ${session.endTime}`;
  const clientLine = `${session.clientName} 님`;
  const sessionLine = session.consultationType
    ? `${clientLine} (${session.consultationType})`
    : clientLine;

  return {
    kind: 'content',
    badgeLabel,
    timeRange,
    sessionLine,
    accessibilityLabel: CONSULTANT_HOME_COPY.NEXT_SESSION_A11Y(session.clientName, timeRange),
    recordCta: CONSULTANT_HOME_COPY.NEXT_SESSION_RECORD_CTA,
    detailCta: CONSULTANT_HOME_COPY.NEXT_SESSION_DETAIL_CTA,
    scheduleId: session.scheduleId,
  };
}

export function buildConsultantUrgentClientBannerModel(
  client: HighPriorityClientItem,
): ConsultantUrgentClientBannerModel {
  const riskLabel = CONSULTANT_HOME_COPY.riskLevelLabel(client.riskLevel);
  return {
    bannerText: CONSULTANT_HOME_COPY.URGENT_CLIENT_BANNER(client.clientName, riskLabel),
    accessibilityLabel: CONSULTANT_HOME_COPY.URGENT_CLIENT_BANNER_A11Y(client.clientName, riskLabel),
    ctaLabel: CONSULTANT_HOME_COPY.PENDING_BANNER_CTA,
  };
}
