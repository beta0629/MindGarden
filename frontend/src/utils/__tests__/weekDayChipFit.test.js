/**
 * judgeWeekDayChipFit — time-first stages (incl. compact-pad / hide-time) + height stages
 */
import {
  WEEK_DAY_CHIP_FIT_STAGE,
  WEEK_DAY_CHIP_HEIGHT_STAGE,
  WEEK_DAY_CHIP_TIME_MODE,
  buildWeekDayChipA11yLabel,
  judgeWeekDayChipFit,
  judgeWeekDayChipHeightFit
} from '../weekDayChipFit';
import { formatNameWithSecondary } from '../safeDisplay';
import { MAPPING_ENGAGEMENT_TYPE_LABELS } from '../../constants/mappingEngagementType';

const HEIGHT_FULL = {
  heightStage: WEEK_DAY_CHIP_HEIGHT_STAGE.FULL,
  showStatus: true,
  showTitle: true
};

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
      showBadge: true,
      showTime: true,
      compactPad: false,
      ...HEIGHT_FULL
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
    expect(fit.showTime).toBe(true);
    expect(fit.compactPad).toBe(false);
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
      showBadge: false,
      showTime: true,
      compactPad: false,
      ...HEIGHT_FULL
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
      showBadge: true,
      showTime: true,
      compactPad: false,
      ...HEIGHT_FULL
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

  test('short 가 정상 패딩에 안 들어가면 compact-pad', () => {
    const fit = judgeWeekDayChipFit({
      chipWidth: 20,
      compactChipWidth: 30,
      longTimeWidth: longW,
      shortTimeWidth: shortW,
      badgeWidth: badgeW,
      gap,
      considerBadge: true
    });
    expect(fit.stage).toBe(WEEK_DAY_CHIP_FIT_STAGE.COMPACT_PAD);
    expect(fit.showTime).toBe(true);
    expect(fit.compactPad).toBe(true);
    expect(fit.timeMode).toBe(WEEK_DAY_CHIP_TIME_MODE.SHORT);
    expect(fit.showBadge).toBe(false);
  });

  test('compact 에도 short 가 안 들어가면 hide-time', () => {
    const fit = judgeWeekDayChipFit({
      chipWidth: 12,
      compactChipWidth: 18,
      longTimeWidth: longW,
      shortTimeWidth: shortW,
      badgeWidth: badgeW,
      gap,
      considerBadge: true
    });
    expect(fit.stage).toBe(WEEK_DAY_CHIP_FIT_STAGE.HIDE_TIME);
    expect(fit.showTime).toBe(false);
    expect(fit.compactPad).toBe(true);
    expect(fit.showBadge).toBe(false);
  });

  test('hide-time 에서도 badge 단독이 compact 에 맞으면 배지 유지', () => {
    const fit = judgeWeekDayChipFit({
      chipWidth: 12,
      compactChipWidth: 40,
      longTimeWidth: longW,
      shortTimeWidth: 50,
      badgeWidth: 36,
      gap,
      considerBadge: true
    });
    expect(fit.stage).toBe(WEEK_DAY_CHIP_FIT_STAGE.HIDE_TIME);
    expect(fit.showTime).toBe(false);
    expect(fit.showBadge).toBe(true);
  });

  test('34.8 half-width: short 미수용 시 compact/hide — 구코드 short 강제면 잘림', () => {
    // 실제 12px 기준 short≈30, 정상 content≈18.8(34.8-16) → short 불가
    const shortReal = 30;
    const normalContent = 18.8;
    const compactContent = 26.8;
    const fit = judgeWeekDayChipFit({
      chipWidth: normalContent,
      compactChipWidth: compactContent,
      longTimeWidth: 60,
      shortTimeWidth: shortReal,
      badgeWidth: badgeW,
      gap,
      considerBadge: true
    });
    expect(fit.stage).toBe(WEEK_DAY_CHIP_FIT_STAGE.HIDE_TIME);
    expect(fit.showTime).toBe(false);
    // 구코드: 항상 SHORT 반환 → 30 > 18.8 이면 잘림(「11:0」)
    expect(shortReal).toBeGreaterThan(normalContent);
  });
});

describe('judgeWeekDayChipHeightFit', () => {
  test('충분 높이 → full (status+title)', () => {
    expect(judgeWeekDayChipHeightFit({
      chipHeight: 64,
      timeRowHeight: 14,
      titleRowHeight: 14,
      statusRowHeight: 14,
      gapY: 2
    })).toEqual({
      heightStage: WEEK_DAY_CHIP_HEIGHT_STAGE.FULL,
      showStatus: true,
      showTitle: true
    });
  });

  test('상태 줄만 넘치면 hide-status', () => {
    expect(judgeWeekDayChipHeightFit({
      chipHeight: 32,
      timeRowHeight: 14,
      titleRowHeight: 14,
      statusRowHeight: 14,
      gapY: 2
    })).toEqual({
      heightStage: WEEK_DAY_CHIP_HEIGHT_STAGE.HIDE_STATUS,
      showStatus: false,
      showTitle: true
    });
  });

  test('이름 줄도 넘치면 hide-title', () => {
    expect(judgeWeekDayChipHeightFit({
      chipHeight: 16,
      timeRowHeight: 14,
      titleRowHeight: 14,
      statusRowHeight: 14,
      gapY: 2
    })).toEqual({
      heightStage: WEEK_DAY_CHIP_HEIGHT_STAGE.HIDE_TITLE,
      showStatus: false,
      showTitle: false
    });
  });

  test('폭+높이 단계 조합 — judgeWeekDayChipFit 가 둘 다 반환', () => {
    const fit = judgeWeekDayChipFit({
      chipWidth: 35,
      longTimeWidth: 56,
      shortTimeWidth: 28,
      badgeWidth: 36,
      gap: 4,
      considerBadge: true,
      chipHeight: 16,
      timeRowHeight: 14,
      titleRowHeight: 14,
      statusRowHeight: 14,
      gapY: 2
    });
    expect(fit.stage).toBe(WEEK_DAY_CHIP_FIT_STAGE.SHORT);
    expect(fit.showTitle).toBe(false);
    expect(fit.showStatus).toBe(false);
  });
});

describe('buildWeekDayChipA11yLabel + formatNameWithSecondary', () => {
  test('시간·이름·상태 기본 구성', () => {
    expect(buildWeekDayChipA11yLabel({
      timeText: '오전 10:00',
      clientName: '이내담',
      statusLabel: '예약됨'
    })).toBe('오전 10:00 · 이내담 - 예약됨');
  });

  test('기관연계 포함 — 배지 숨김과 무관하게 showInstitution 시 라벨 유지', () => {
    expect(buildWeekDayChipA11yLabel({
      timeText: '10:00',
      clientName: '이내담',
      statusLabel: '예약됨',
      showInstitution: true,
      institutionLabel: MAPPING_ENGAGEMENT_TYPE_LABELS.INSTITUTION_LINK
    })).toBe(`10:00 · 이내담 - 예약됨 · ${MAPPING_ENGAGEMENT_TYPE_LABELS.INSTITUTION_LINK}`);
  });

  test('formatNameWithSecondary — undefined secondary 금지', () => {
    expect(formatNameWithSecondary('이내담', undefined)).toBe('이내담');
    expect(formatNameWithSecondary('이내담', '')).toBe('이내담');
    expect(formatNameWithSecondary('이내담', '이메일')).toBe('이내담 (이메일)');
  });
});
