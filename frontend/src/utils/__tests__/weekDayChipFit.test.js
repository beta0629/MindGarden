/**
 * judgeWeekDayChipFit — time-first stages
 */
import {
  WEEK_DAY_CHIP_FIT_STAGE,
  WEEK_DAY_CHIP_TIME_MODE,
  judgeWeekDayChipFit
} from '../weekDayChipFit';

describe('judgeWeekDayChipFit', () => {
  const longW = 56; // 「오전 10:00」
  const shortW = 28; // 「10:00」
  const badgeW = 36; // 「기관연계」
  const gap = 4;

  test('넓은 칩 → long+badge', () => {
    expect(judgeWeekDayChipFit({
      chipWidth: 124,
      longTimeWidth: longW,
      shortTimeWidth: shortW,
      badgeWidth: badgeW,
      gap,
      considerBadge: true
    })).toEqual({
      stage: WEEK_DAY_CHIP_FIT_STAGE.LONG_BADGE,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.LONG,
      showBadge: true
    });
  });

  test('중간(~78 inner 73.5): long 만 또는 short+badge — long 우선', () => {
    const fit = judgeWeekDayChipFit({
      chipWidth: 73.5,
      longTimeWidth: longW,
      shortTimeWidth: shortW,
      badgeWidth: badgeW,
      gap,
      considerBadge: true
    });
    expect(fit.stage).toBe(WEEK_DAY_CHIP_FIT_STAGE.LONG);
    expect(fit.timeMode).toBe(WEEK_DAY_CHIP_TIME_MODE.LONG);
    expect(fit.showBadge).toBe(false);
  });

  test('좁은 칩(~35): short only, badge 생략', () => {
    expect(judgeWeekDayChipFit({
      chipWidth: 35,
      longTimeWidth: longW,
      shortTimeWidth: shortW,
      badgeWidth: badgeW,
      gap,
      considerBadge: true
    })).toEqual({
      stage: WEEK_DAY_CHIP_FIT_STAGE.SHORT,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
      showBadge: false
    });
  });

  test('short+badge 가 long 보다 좁을 때', () => {
    expect(judgeWeekDayChipFit({
      chipWidth: 70,
      longTimeWidth: 80,
      shortTimeWidth: 28,
      badgeWidth: 36,
      gap: 4,
      considerBadge: true
    })).toEqual({
      stage: WEEK_DAY_CHIP_FIT_STAGE.SHORT_BADGE,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
      showBadge: true
    });
  });

  test('구코드 가정(항상 badge+long) 은 좁은 칩에서 FAIL 해야 함 — judge 는 short', () => {
    const narrow = judgeWeekDayChipFit({
      chipWidth: 35,
      longTimeWidth: longW,
      shortTimeWidth: shortW,
      badgeWidth: badgeW,
      gap,
      considerBadge: true
    });
    expect(narrow.showBadge).toBe(false);
    expect(narrow.timeMode).toBe(WEEK_DAY_CHIP_TIME_MODE.SHORT);
    // 구코드가 long+badge 를 강제하면 이 폭에서 잘림
    expect(longW + gap + badgeW).toBeGreaterThan(35);
  });

  test('considerBadge=false → long 또는 short 만', () => {
    expect(judgeWeekDayChipFit({
      chipWidth: 60,
      longTimeWidth: longW,
      shortTimeWidth: shortW,
      badgeWidth: badgeW,
      gap,
      considerBadge: false
    }).showBadge).toBe(false);
  });
});
