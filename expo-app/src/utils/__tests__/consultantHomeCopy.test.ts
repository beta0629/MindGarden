/**
 * 상담사 홈 카피 — 웹 SSOT(일정 확인, 생성 유도 금지) 회귀
 *
 * @author MindGarden
 * @since 2026-09-06
 */
import { CONSULTANT_HOME_COPY } from '@/constants/consultantHomeCopy';

describe('CONSULTANT_HOME_COPY schedule parity (web SSOT)', () => {
  it('uses 일정 확인 for quick action (no create-schedule)', () => {
    expect(CONSULTANT_HOME_COPY.QUICK_ACTION_SCHEDULE).toBe('일정 확인');
  });

  it('does not prompt schedule creation in empty state', () => {
    expect(CONSULTANT_HOME_COPY.EMPTY_SCHEDULE_DESCRIPTION).toBe(
      '오늘은 예정된 상담이 없습니다.',
    );
    expect(CONSULTANT_HOME_COPY.EMPTY_SCHEDULE_ACTION).toBe('스케줄 보기');
    expect(CONSULTANT_HOME_COPY.EMPTY_SCHEDULE_DESCRIPTION).not.toMatch(/추가/);
    expect(CONSULTANT_HOME_COPY.EMPTY_SCHEDULE_ACTION).not.toMatch(/추가/);
  });
});
