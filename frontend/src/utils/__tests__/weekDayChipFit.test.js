/**
 * judgeWeekDayChipFit — time-first stages (incl. compact-pad / hide-time) + height stages
 * (full → hide-status → merge-time-title → hide-title) + 빈 칩 금지
 */
import {
  WEEK_DAY_CHIP_FIT_STAGE,
  WEEK_DAY_CHIP_HEIGHT_STAGE,
  WEEK_DAY_CHIP_TIME_MODE,
  buildWeekDayChipA11yLabel,
  enforceNonEmptyChipVisible,
  judgeTitleNameVisibility,
  judgeWeekDayChipFit,
  judgeWeekDayChipHeightFit,
  measureTextWidth,
  readRowHeight
} from '../weekDayChipFit';
import { formatNameWithSecondary } from '../safeDisplay';
import { MAPPING_ENGAGEMENT_TYPE_LABELS } from '../../constants/mappingEngagementType';

const HEIGHT_FULL = {
  heightStage: WEEK_DAY_CHIP_HEIGHT_STAGE.FULL,
  showStatus: true,
  showTitle: true,
  mergeTimeTitle: false,
  showCounselorName: false,
  markerOnly: false
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
      showTitle: true,
      mergeTimeTitle: false
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
      showTitle: true,
      mergeTimeTitle: false
    });
  });

  test('50분(~51px): 자연 줄 높이면 hide-status, 눌린 clientHeight면 FULL 오판', () => {
    // 실제 버그: title clientHeight≈1.8 로 합산하면 fullNeed 가 칩보다 작아 FULL
    const crushedTitleH = 1.8;
    const naturalRowH = 16;
    const chipH = 51;
    const gapY = 2;
    const crushed = judgeWeekDayChipHeightFit({
      chipHeight: chipH,
      timeRowHeight: naturalRowH,
      titleRowHeight: crushedTitleH,
      statusRowHeight: naturalRowH,
      gapY
    });
    expect(crushed.heightStage).toBe(WEEK_DAY_CHIP_HEIGHT_STAGE.FULL);
    expect(crushed.showStatus).toBe(true);

    const natural = judgeWeekDayChipHeightFit({
      chipHeight: chipH,
      timeRowHeight: naturalRowH,
      titleRowHeight: naturalRowH,
      statusRowHeight: naturalRowH,
      gapY
    });
    expect(natural.heightStage).toBe(WEEK_DAY_CHIP_HEIGHT_STAGE.HIDE_STATUS);
    expect(natural.showStatus).toBe(false);
    expect(natural.showTitle).toBe(true);
  });

  test('두 줄은 부족·한 줄은 가능 → merge-time-title', () => {
    expect(judgeWeekDayChipHeightFit({
      chipHeight: 18,
      timeRowHeight: 14,
      titleRowHeight: 14,
      statusRowHeight: 14,
      gapY: 2
    })).toEqual({
      heightStage: WEEK_DAY_CHIP_HEIGHT_STAGE.MERGE_TIME_TITLE,
      showStatus: false,
      showTitle: true,
      mergeTimeTitle: true
    });
  });

  test('시간 행 높이도 부족하면 time-detail', () => {
    expect(judgeWeekDayChipHeightFit({
      chipHeight: 10,
      timeRowHeight: 14,
      titleRowHeight: 14,
      statusRowHeight: 14,
      gapY: 2
    })).toEqual({
      heightStage: WEEK_DAY_CHIP_HEIGHT_STAGE.TIME_DETAIL,
      showStatus: false,
      showTitle: false,
      mergeTimeTitle: false
    });
  });

  test('시간은 맞고 이름 행이 더 크면 hide-title (merge 불가)', () => {
    expect(judgeWeekDayChipHeightFit({
      chipHeight: 12,
      timeRowHeight: 10,
      titleRowHeight: 20,
      statusRowHeight: 14,
      gapY: 2
    })).toEqual({
      heightStage: WEEK_DAY_CHIP_HEIGHT_STAGE.HIDE_TITLE,
      showStatus: false,
      showTitle: false,
      mergeTimeTitle: false
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
      chipHeight: 12,
      timeRowHeight: 10,
      titleRowHeight: 20,
      statusRowHeight: 14,
      gapY: 2
    });
    expect(fit.stage).toBe(WEEK_DAY_CHIP_FIT_STAGE.SHORT);
    expect(fit.heightStage).toBe(WEEK_DAY_CHIP_HEIGHT_STAGE.HIDE_TITLE);
    expect(fit.showTitle).toBe(false);
    expect(fit.showStatus).toBe(false);
    expect(fit.showTime).toBe(true);
  });

  test('merge-time-title 단계가 judgeWeekDayChipFit 결과에 포함', () => {
    const fit = judgeWeekDayChipFit({
      chipWidth: 80,
      longTimeWidth: 56,
      shortTimeWidth: 28,
      badgeWidth: 36,
      gap: 4,
      considerBadge: true,
      chipHeight: 18,
      timeRowHeight: 14,
      titleRowHeight: 14,
      statusRowHeight: 14,
      gapY: 2
    });
    expect(fit.heightStage).toBe(WEEK_DAY_CHIP_HEIGHT_STAGE.MERGE_TIME_TITLE);
    expect(fit.mergeTimeTitle).toBe(true);
    expect(fit.showTitle).toBe(true);
    expect(fit.showTime).toBe(true);
    expect(fit.showStatus).toBe(false);
  });
});

describe('빈 칩 금지 lock', () => {
  test('hide-time + hide-title 조합이면 이름 강제', () => {
    const enforced = enforceNonEmptyChipVisible({
      stage: WEEK_DAY_CHIP_FIT_STAGE.HIDE_TIME,
      showTime: false,
      showTitle: false,
      mergeTimeTitle: false,
      heightStage: WEEK_DAY_CHIP_HEIGHT_STAGE.HIDE_TITLE
    });
    expect(enforced.showTime || enforced.showTitle).toBe(true);
    expect(enforced.showTitle).toBe(true);
    expect(enforced.markerOnly).toBe(false);
  });

  test('marker 단계에서는 텍스트 강제 금지·markerOnly 유지', () => {
    const enforced = enforceNonEmptyChipVisible({
      stage: WEEK_DAY_CHIP_FIT_STAGE.MARKER,
      markerOnly: true,
      showTime: false,
      showTitle: false,
      mergeTimeTitle: false,
      heightStage: WEEK_DAY_CHIP_HEIGHT_STAGE.TIME_DETAIL
    });
    expect(enforced.showTime).toBe(false);
    expect(enforced.showTitle).toBe(false);
    expect(enforced.markerOnly).toBe(true);
  });

  test('judgeWeekDayChipFit 은 텍스트 또는 marker 표식 중 하나를 반환한다', () => {
    const fit = judgeWeekDayChipFit({
      chipWidth: 8,
      compactChipWidth: 10,
      longTimeWidth: 56,
      shortTimeWidth: 28,
      badgeWidth: 36,
      gap: 4,
      considerBadge: true,
      chipHeight: 8,
      timeRowHeight: 14,
      titleRowHeight: 14,
      statusRowHeight: 14,
      gapY: 2
    });
    expect(fit.showTime || fit.showTitle || fit.markerOnly).toBe(true);
  });
});

describe('marker(표식) 단계 — 12px급', () => {
  test('compact 에 shortTime 1글자도 못 넣으면 markerOnly·텍스트 강제 없음', () => {
    const fit = judgeWeekDayChipFit({
      chipWidth: 4,
      compactChipWidth: 6,
      outerChipWidth: 12,
      longTimeWidth: 56,
      shortTimeWidth: 28,
      minTimeGlyphWidth: 8,
      badgeWidth: 36,
      gap: 4,
      considerBadge: true,
      clientNameWidth: 36,
      counselorNameWidth: 42,
      minClientWidth: 12,
      nameGap: 4,
      chipHeight: 40,
      timeRowHeight: 14,
      titleRowHeight: 14,
      statusRowHeight: 14,
      gapY: 2
    });
    expect(fit.stage).toBe(WEEK_DAY_CHIP_FIT_STAGE.MARKER);
    expect(fit.markerOnly).toBe(true);
    expect(fit.showTime).toBe(false);
    expect(fit.showTitle).toBe(false);
    expect(fit.showCounselorName).toBe(false);
    expect(fit.showBadge).toBe(false);
    expect(fit.showStatus).toBe(false);
  });

  test('outer=0·content=0(미측정)이면 marker 금지·HIDE_TIME+이름 강제', () => {
    // jsdom: clientWidth===0 → outer/compact=0 → minGlyph>0 만으로 MARKER 오판 방지
    const fit = judgeWeekDayChipFit({
      chipWidth: 0,
      compactChipWidth: 0,
      outerChipWidth: 0,
      longTimeWidth: 56,
      shortTimeWidth: 28,
      minTimeGlyphWidth: 8,
      badgeWidth: 36,
      gap: 4,
      considerBadge: true,
      clientNameWidth: 36,
      counselorNameWidth: 42,
      minClientWidth: 12,
      nameGap: 4,
      chipHeight: 40,
      timeRowHeight: 14,
      titleRowHeight: 14,
      statusRowHeight: 14,
      gapY: 2
    });
    expect(fit.markerOnly).toBe(false);
    expect(fit.stage).toBe(WEEK_DAY_CHIP_FIT_STAGE.HIDE_TIME);
    expect(fit.showTitle).toBe(true);
    expect(fit.showTime).toBe(false);
  });

  test('outer=12·content=0(실측 협폭)이면 marker', () => {
    // harness namePri12: 패딩 차감 후 content≈0이어도 outer>0 → 표식
    const fit = judgeWeekDayChipFit({
      chipWidth: 0,
      compactChipWidth: 0,
      outerChipWidth: 12,
      longTimeWidth: 56,
      shortTimeWidth: 28,
      minTimeGlyphWidth: 8,
      badgeWidth: 36,
      gap: 4,
      considerBadge: true,
      clientNameWidth: 36,
      counselorNameWidth: 42,
      minClientWidth: 12,
      nameGap: 4,
      chipHeight: 40,
      timeRowHeight: 14,
      titleRowHeight: 14,
      statusRowHeight: 14,
      gapY: 2
    });
    expect(fit.stage).toBe(WEEK_DAY_CHIP_FIT_STAGE.MARKER);
    expect(fit.markerOnly).toBe(true);
    expect(fit.showTitle).toBe(false);
    expect(fit.showTime).toBe(false);
  });

  test('outer=12·compact<minGlyph이면 marker', () => {
    const fit = judgeWeekDayChipFit({
      chipWidth: 0,
      compactChipWidth: 4,
      outerChipWidth: 12,
      longTimeWidth: 56,
      shortTimeWidth: 28,
      minTimeGlyphWidth: 8,
      badgeWidth: 36,
      gap: 4,
      considerBadge: true
    });
    expect(fit.markerOnly).toBe(true);
    expect(fit.stage).toBe(WEEK_DAY_CHIP_FIT_STAGE.MARKER);
  });

  test('이름 1글자 이상 들어가는 폭(29px) — 내담자 말줄임·상담사 숨김 유지', () => {
    const fit = judgeWeekDayChipFit({
      chipWidth: 29,
      longTimeWidth: 56,
      shortTimeWidth: 28,
      minTimeGlyphWidth: 8,
      badgeWidth: 36,
      gap: 4,
      considerBadge: false,
      clientNameWidth: 39,
      counselorNameWidth: 48,
      minClientWidth: 13,
      nameGap: 4
    });
    expect(fit.markerOnly).toBe(false);
    expect(fit.showTitle).toBe(true);
    expect(fit.showCounselorName).toBe(false);
  });

  test('더 넓은 폭(59px) — 내담자 표시·상담사 숨김 또는 표시(반례)', () => {
    const fit = judgeWeekDayChipFit({
      chipWidth: 59,
      longTimeWidth: 56,
      shortTimeWidth: 28,
      minTimeGlyphWidth: 8,
      badgeWidth: 36,
      gap: 4,
      considerBadge: false,
      clientNameWidth: 39,
      counselorNameWidth: 48,
      minClientWidth: 13,
      nameGap: 4
    });
    expect(fit.markerOnly).toBe(false);
    expect(fit.showTitle).toBe(true);
    // 59: client+gap+counselor = 13+4+48=65 > 59 → counselor 숨김
    expect(fit.showCounselorName).toBe(false);
  });
});

describe('readRowHeight — 눌린 clientHeight 무시', () => {
  test('line-height 가 crushed clientHeight 보다 크면 line-height 반환', () => {
    const el = document.createElement('div');
    el.textContent = '이내담';
    el.style.cssText = 'font-size:13px;line-height:16px;height:2px;overflow:hidden;padding:0;border:0;';
    document.body.appendChild(el);
    try {
      const h = readRowHeight(el);
      expect(h).toBeGreaterThanOrEqual(15);
      // getBoundingClientRect 는 눌린 값(~2) — 그대로 쓰면 FULL 오판
      const crushed = el.getBoundingClientRect().height;
      expect(crushed).toBeLessThan(8);
      expect(h).toBeGreaterThan(crushed + 4);
    } finally {
      el.remove();
    }
  });

  test('눌린 clientHeight 합으로 판정하면 FULL, readRowHeight 합이면 hide-status', () => {
    const chipH = 51;
    const gapY = 2;
    const makeRow = (text, crushedPx) => {
      const el = document.createElement('div');
      el.textContent = text;
      el.style.cssText =
        `font-size:13px;line-height:16px;height:${crushedPx}px;overflow:hidden;padding:0;border:0;`;
      document.body.appendChild(el);
      return el;
    };
    const timeRow = makeRow('10:00', 16);
    const titleRow = makeRow('이내담', 1.8);
    const statusRow = makeRow('예약됨', 16);
    try {
      const crushedJudge = judgeWeekDayChipHeightFit({
        chipHeight: chipH,
        timeRowHeight: timeRow.getBoundingClientRect().height,
        titleRowHeight: titleRow.getBoundingClientRect().height,
        statusRowHeight: statusRow.getBoundingClientRect().height,
        gapY
      });
      expect(crushedJudge.heightStage).toBe(WEEK_DAY_CHIP_HEIGHT_STAGE.FULL);

      const naturalJudge = judgeWeekDayChipHeightFit({
        chipHeight: chipH,
        timeRowHeight: readRowHeight(timeRow),
        titleRowHeight: readRowHeight(titleRow),
        statusRowHeight: readRowHeight(statusRow),
        gapY
      });
      expect(naturalJudge.heightStage).toBe(WEEK_DAY_CHIP_HEIGHT_STAGE.HIDE_STATUS);
      expect(naturalJudge.showTitle).toBe(true);
    } finally {
      timeRow.remove();
      titleRow.remove();
      statusRow.remove();
    }
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

  test('상담사 이름 포함 — 칩에서 숨겨도 a11y 라벨 유지', () => {
    expect(buildWeekDayChipA11yLabel({
      timeText: '10:00',
      clientName: '라마바',
      counselorName: '상담사A',
      statusLabel: '예약됨'
    })).toBe('10:00 · 라마바 상담사A - 예약됨');
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

describe('내담자 우선 · showCounselorName', () => {
  test('좁은 폭: counselor 숨김·client 우선', () => {
    const nameFit = judgeTitleNameVisibility({
      showTitle: true,
      clientNameWidth: 36,
      counselorNameWidth: 42,
      minClientWidth: 12,
      nameGap: 4,
      titleNameBudget: 20
    });
    expect(nameFit.showTitle).toBe(true);
    expect(nameFit.showCounselorName).toBe(false);
  });

  test('충분 폭: client+counselor 동시', () => {
    const nameFit = judgeTitleNameVisibility({
      showTitle: true,
      clientNameWidth: 36,
      counselorNameWidth: 42,
      minClientWidth: 12,
      nameGap: 4,
      titleNameBudget: 90
    });
    expect(nameFit.showTitle).toBe(true);
    expect(nameFit.showCounselorName).toBe(true);
  });

  test('1글자 client 도 불가 → showTitle false', () => {
    const nameFit = judgeTitleNameVisibility({
      showTitle: true,
      clientNameWidth: 36,
      counselorNameWidth: 42,
      minClientWidth: 12,
      nameGap: 4,
      titleNameBudget: 8
    });
    expect(nameFit.showTitle).toBe(false);
    expect(nameFit.showCounselorName).toBe(false);
  });

  test('judgeWeekDayChipFit — 좁은 칩에서 counselor 숨김', () => {
    const fit = judgeWeekDayChipFit({
      chipWidth: 29,
      longTimeWidth: 56,
      shortTimeWidth: 28,
      badgeWidth: 36,
      gap: 4,
      considerBadge: false,
      clientNameWidth: 39,
      counselorNameWidth: 48,
      minClientWidth: 13,
      nameGap: 4
    });
    expect(fit.showTitle).toBe(true);
    expect(fit.showCounselorName).toBe(false);
  });

  test('judgeWeekDayChipFit — 넓은 칩에서 counselor 표시', () => {
    const fit = judgeWeekDayChipFit({
      chipWidth: 160,
      longTimeWidth: 56,
      shortTimeWidth: 28,
      badgeWidth: 36,
      gap: 4,
      considerBadge: false,
      clientNameWidth: 39,
      counselorNameWidth: 48,
      minClientWidth: 13,
      nameGap: 4
    });
    expect(fit.showTitle).toBe(true);
    expect(fit.showCounselorName).toBe(true);
  });

  test('이름 폭 미제공 시 showCounselorName 기본 false (기존 toEqual 호환)', () => {
    const fit = judgeWeekDayChipFit({
      chipWidth: 124,
      longTimeWidth: 56,
      shortTimeWidth: 28,
      badgeWidth: 36,
      gap: 4,
      considerBadge: true
    });
    expect(fit.showCounselorName).toBe(false);
  });
});

describe('measureTextWidth (jsdom)', () => {
  test('jsdom에서 throw/console.error 없이 숫자(fallback) 반환', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let width;
    expect(() => {
      width = measureTextWidth('오전 10:00', '400 12px sans-serif');
    }).not.toThrow();
    expect(typeof width).toBe('number');
    expect(Number.isFinite(width)).toBe(true);
    expect(width).toBe('오전 10:00'.length * 7);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
