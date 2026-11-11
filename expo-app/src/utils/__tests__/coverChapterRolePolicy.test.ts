import { CLIENT_COVER_COPY, CLIENT_HOME_ROUTES } from '@/constants/clientHomeCopy';
import { CONSULTANT_COVER_COPY, CONSULTANT_HOME_ROUTES } from '@/constants/consultantHomeCopy';
import {
  CLIENT_DOCK_TABS,
  CONSULTANT_DOCK_TABS,
  getDockTab,
  getVisibleDockLabels,
} from '@/constants/roleDockConfig';
import { containsMoneyText } from '../coverChapterViewModel';

/** 함수형 문구는 대표 인자로 펼쳐 실제 노출 문자열을 검사한다. */
function flattenCopy(copy: Record<string, unknown>): string[] {
  return Object.values(copy).flatMap((v) => {
    if (typeof v === 'string') {
      return [v];
    }
    if (typeof v === 'function') {
      return [String((v as (...args: unknown[]) => unknown)('홍길동', 3, 2, 1))];
    }
    return [];
  });
}

describe('역할 도크', () => {
  it('내담자 도크: 홈 · 예약 · 마음 · 나', () => {
    expect(getVisibleDockLabels(CLIENT_DOCK_TABS)).toEqual(['홈', '예약', '마음', '나']);
  });

  it('내담자 「예약」 탭은 일정 챕터 (sessions) 이며 (booking)·(shop) 은 숨김', () => {
    expect(getDockTab(CLIENT_DOCK_TABS, '(sessions)').label).toBe('예약');
    expect(getDockTab(CLIENT_DOCK_TABS, '(booking)').visible).toBe(false);
    expect(getDockTab(CLIENT_DOCK_TABS, '(shop)').visible).toBe(false);
  });

  it('상담사 도크: 홈 · 일정 · 일지 · 나, (clients) 숨김', () => {
    expect(getVisibleDockLabels(CONSULTANT_DOCK_TABS)).toEqual(['홈', '일정', '일지', '나']);
    expect(getDockTab(CONSULTANT_DOCK_TABS, '(clients)').visible).toBe(false);
  });

  it('정의되지 않은 라우트는 즉시 실패한다', () => {
    expect(() => getDockTab(CLIENT_DOCK_TABS, '(nope)' as never)).toThrow();
  });
});

describe('상담사 커버 문구 — 금액 노출 없음', () => {
  it('CONSULTANT_COVER_COPY 에 결제·미결제·원·급여 문구가 없다', () => {
    const strings = flattenCopy(CONSULTANT_COVER_COPY);
    expect(strings.length).toBeGreaterThan(0);
    for (const s of strings) {
      expect(containsMoneyText(s)).toBe(false);
    }
  });

  it('상담사 홈 라우트는 급여·결제 화면을 가리키지 않는다', () => {
    const used = [
      CONSULTANT_HOME_ROUTES.SCHEDULE,
      CONSULTANT_HOME_ROUTES.RECORDS,
      CONSULTANT_HOME_ROUTES.NOTIFICATIONS,
      CONSULTANT_HOME_ROUTES.scheduleDetail(1),
      CONSULTANT_HOME_ROUTES.recordCreate(1),
      CONSULTANT_HOME_ROUTES.CLIENT_DETAIL(1),
    ];
    expect(used.some((r) => /salary|payment/.test(r))).toBe(false);
  });
});

describe('내담자 커버 문구 — 정책', () => {
  it('미결제 문구는 회기 칩 전용 문구에만 있다 (히어로·입장 CTA 문구에는 없음)', () => {
    expect(containsMoneyText(CLIENT_COVER_COPY.unpaidChip(1))).toBe(true);
    for (const s of [
      CLIENT_COVER_COPY.ENTRY_CTA,
      CLIENT_COVER_COPY.ENTRY_CTA_A11Y,
      CLIENT_COVER_COPY.HERO_EMPTY_TITLE,
      CLIENT_COVER_COPY.HERO_EMPTY_DESCRIPTION,
      CLIENT_COVER_COPY.HERO_EMPTY_ACTION,
    ]) {
      expect(containsMoneyText(s)).toBe(false);
    }
  });

  it('입장 CTA·빈 상태 행동은 예약 생성 경로로 가지 않는다', () => {
    const targets = [
      CLIENT_HOME_ROUTES.sessionDetail(5),
      CLIENT_HOME_ROUTES.NOTIFICATIONS,
      CLIENT_HOME_ROUTES.SESSIONS,
    ];
    expect(targets.some((r) => r.includes('(booking)'))).toBe(false);
  });
});
