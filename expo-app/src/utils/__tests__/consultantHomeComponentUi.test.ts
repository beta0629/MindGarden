/**
 * 상담사 홈 P0-3~4 컴포넌트 표시 모델 스모크 테스트 (ROLE-04)
 *
 * RN 렌더 없이 copy·뷰모델 분기를 검증한다.
 */
import { format as formatDate } from 'date-fns';
import {
  buildConsultantNextSessionCardModel,
  buildConsultantUrgentClientBannerModel,
} from '../consultantHomeComponentUi';
import { CONSULTANT_HOME_COPY } from '@/constants/consultantHomeCopy';

describe('buildConsultantNextSessionCardModel', () => {
  const todayYmd = formatDate(new Date(), 'yyyy-MM-dd');

  it('returns loading state when isLoading is true', () => {
    expect(
      buildConsultantNextSessionCardModel(
        {
          scheduleId: 1,
          clientName: '김내담',
          sessionDate: todayYmd,
          startTime: '10:00',
          endTime: '10:50',
          sessionNumber: 1,
          isToday: true,
        },
        true,
      ),
    ).toEqual({ kind: 'loading' });
  });

  it('returns empty state when session is null', () => {
    expect(buildConsultantNextSessionCardModel(null)).toEqual({ kind: 'empty' });
  });

  it('builds content model with today badge and consultation type line', () => {
    const model = buildConsultantNextSessionCardModel({
      scheduleId: 88,
      clientName: '이내담',
      sessionDate: todayYmd,
      startTime: '11:00',
      endTime: '11:50',
      sessionNumber: 4,
      consultationType: '화상',
      isToday: true,
      countdownLabel: '30분 뒤',
    });
    expect(model).toMatchObject({
      kind: 'content',
      badgeLabel: '30분 뒤',
      timeRange: '11:00 - 11:50',
      sessionLine: '이내담 님 (화상)',
      recordCta: CONSULTANT_HOME_COPY.NEXT_SESSION_RECORD_CTA,
      detailCta: CONSULTANT_HOME_COPY.NEXT_SESSION_DETAIL_CTA,
      scheduleId: 88,
    });
    if (model.kind === 'content') {
      expect(model.accessibilityLabel).toContain('이내담');
      expect(model.accessibilityLabel).toContain('11:00 - 11:50');
    }
  });

  it('uses tomorrow badge when session is not today and no countdown', () => {
    const tomorrowYmd = formatDate(
      new Date(Date.now() + 24 * 60 * 60 * 1000),
      'yyyy-MM-dd',
    );
    const model = buildConsultantNextSessionCardModel({
      scheduleId: 99,
      clientName: '박내담',
      sessionDate: tomorrowYmd,
      startTime: '09:00',
      endTime: '09:50',
      sessionNumber: 1,
      isToday: false,
    });
    expect(model).toMatchObject({
      kind: 'content',
      badgeLabel: CONSULTANT_HOME_COPY.NEXT_SESSION_BADGE_TOMORROW,
      sessionLine: '박내담 님',
    });
  });
});

describe('buildConsultantUrgentClientBannerModel', () => {
  it('maps banner copy and a11y from risk level', () => {
    const model = buildConsultantUrgentClientBannerModel({
      clientId: 12,
      clientName: '홍길동',
      riskLevel: 'CRITICAL',
    });
    expect(model.bannerText).toBe('긴급: 홍길동 님 (위험)');
    expect(model.accessibilityLabel).toBe('긴급 내담자 홍길동 님, 위험');
    expect(model.ctaLabel).toBe(CONSULTANT_HOME_COPY.PENDING_BANNER_CTA);
  });

  it('defaults unknown risk level to 확인 필요 label', () => {
    const model = buildConsultantUrgentClientBannerModel({
      clientId: 13,
      clientName: '테스트',
      riskLevel: 'UNKNOWN',
    });
    expect(model.bannerText).toContain('확인 필요');
  });
});
