/**
 * 기관연계 표식 SSOT 회귀 (2026-10-07)
 *
 * 기관연계는 어디서나 일정 상세(ScheduleDetailModal)와 같은 EngagementTypeBadge 글자 배지다.
 * - 월간 칩 끝 표식(ScheduleEventMarks) · 사이드바 행(MatchingScheduleCompactRow) · 일정 상세가 같은 배지 DOM
 * - 사이드바 행에서 「기관연계」 글자는 배지 한 곳만
 * - 문자 발송 원 표식은 툴팁·aria 로 「문자 발송됨」을 남기고 기관연계와 섞이지 않는다
 * - 좁은 폭(월간 칩 마크업 안)에서도 글자가 그대로 남는다
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import EngagementTypeBadge from '../../../../../common/EngagementTypeBadge';
import ScheduleEventMarks from '../ScheduleEventMarks';
import MatchingScheduleCompactRow from '../MatchingScheduleCompactRow';
import ScheduleLegend from '../../../../../ui/Schedule/ScheduleLegend';

const SRC = path.resolve(__dirname, '..', '..', '..', '..', '..', '..');
const readLocale = (ns) => JSON.parse(
  fs.readFileSync(path.resolve(SRC, 'locales', 'ko', `${ns}.json`), 'utf8')
);

jest.mock('react-i18next', () => {
  const mockFs = jest.requireActual('fs');
  const mockPath = jest.requireActual('path');
  const localeDir = mockPath.resolve(__dirname, '..', '..', '..', '..', '..', '..', 'locales', 'ko');
  const cache = {};
  const load = (ns) => {
    if (!cache[ns]) {
      cache[ns] = JSON.parse(mockFs.readFileSync(mockPath.join(localeDir, `${ns}.json`), 'utf8'));
    }
    return cache[ns];
  };
  const makeT = (defaultNs) => (key, opts) => {
    const [ns, rest] = key.includes(':') ? key.split(':') : [defaultNs, key];
    const value = rest.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), load(ns));
    if (typeof value !== 'string') {
      return typeof opts === 'string' ? opts : key;
    }
    return value.replace(/\{\{(\w+)\}\}/g, (_, name) => String(opts?.[name] ?? ''));
  };
  return {
    __esModule: true,
    useTranslation: (ns) => ({ t: makeT(typeof ns === 'string' ? ns : 'common') })
  };
});

const INSTITUTION_LABEL = '기관연계';
const SCHEDULE_JSON = readLocale('schedule');
const SMS_SENT_ARIA = SCHEDULE_JSON.calendar.reminderSms.aria.SENT;

const INSTITUTION_SOURCE = { paymentTiming: 'INSTITUTION_LINK' };
const SMS_SENT = { status: 'SENT', sentAt: '2026-10-07T09:05:00' };

const INSTITUTION_MAPPING = {
  id: 11,
  consultantName: '김상담',
  clientName: '이내담',
  status: 'ACTIVE',
  remainingSessions: 0,
  paymentTiming: 'INSTITUTION_LINK'
};

const badgeHtml = (root) => root.querySelector('[data-testid="engagement-type-badge"]').outerHTML;

const renderDetailBadge = () => {
  const { container, unmount } = render(<EngagementTypeBadge source={INSTITUTION_SOURCE} />);
  const html = badgeHtml(container);
  unmount();
  return html;
};

describe('기관연계 글자 배지 — 세 곳 동일 렌더', () => {
  test('일정 상세는 공통 EngagementTypeBadge 를 source 로 그린다', () => {
    const detailJs = fs.readFileSync(
      path.resolve(SRC, 'components', 'schedule', 'ScheduleDetailModal.js'),
      'utf8'
    );
    expect(detailJs).toContain("import EngagementTypeBadge from '../common/EngagementTypeBadge';");
    expect(detailJs).toContain('<EngagementTypeBadge source={displayData} />');
  });

  test('월간 칩 끝 표식(ScheduleEventMarks)은 일정 상세와 같은 배지 DOM', () => {
    const detail = renderDetailBadge();
    const { container } = render(
      <ScheduleEventMarks source={INSTITUTION_SOURCE} institutionTitle={INSTITUTION_LABEL} />
    );
    expect(badgeHtml(container)).toBe(detail);
    expect(screen.getAllByText(INSTITUTION_LABEL)).toHaveLength(1);
  });

  test('사이드바 행은 일정 상세와 같은 배지 DOM 이고 「기관연계」 글자는 한 곳만', () => {
    const detail = renderDetailBadge();
    const { container } = render(<MatchingScheduleCompactRow mapping={INSTITUTION_MAPPING} />);
    expect(badgeHtml(container)).toBe(detail);
    expect(screen.getAllByText(INSTITUTION_LABEL)).toHaveLength(1);

    const secondary = container.querySelector('.integrated-schedule__compact-row-secondary');
    expect(secondary.textContent).not.toContain(INSTITUTION_LABEL);
    expect(secondary.querySelector('.integrated-schedule__compact-row-sep')).toBeNull();
    expect(container.querySelector('.mg-schedule-event-marks [data-testid="engagement-type-badge"]'))
      .toHaveTextContent(INSTITUTION_LABEL);
  });

  test('회기권 배정은 사이드바 secondary 문구·구분선을 그대로 쓴다', () => {
    const { container } = render(
      <MatchingScheduleCompactRow mapping={{ ...INSTITUTION_MAPPING, paymentTiming: null, remainingSessions: 3 }} />
    );
    expect(container.querySelector('[data-testid="engagement-type-badge"]')).toBeNull();
    const secondary = container.querySelector('.integrated-schedule__compact-row-secondary');
    expect(secondary.querySelector('.integrated-schedule__compact-row-sep')).not.toBeNull();
  });
});

describe('좁은 폭에서도 글자 배지', () => {
  test('월간 칩 마크업 안에서도 글자·패딩 배지 그대로이고 인라인 축소 스타일이 없다', () => {
    const { container } = render(
      <div className="integrated-schedule__calendar-wrapper--integrated">
        <div className="fc-daygrid-event-harness">
          <div className="mg-v2-ad-calendar-event mg-v2-ad-calendar-event--compact mg-v2-ad-calendar-event--integrated-month">
            <span className="mg-v2-ad-calendar-event__client">이내담</span>
            <ScheduleEventMarks source={INSTITUTION_SOURCE} sms={SMS_SENT} compact />
          </div>
        </div>
      </div>
    );
    const badge = container.querySelector('[data-testid="engagement-type-badge"]');
    expect(badge).toHaveTextContent(INSTITUTION_LABEL);
    expect(badge.getAttribute('style')).toBeNull();
    expect(badge.getAttribute('data-engagement-type')).toBe('INSTITUTION_LINK');
  });

  test('표식 안 배지는 「기관연계」 네 글자 전부이고 말줄임하지 않는다', () => {
    const { container } = render(
      <ScheduleEventMarks source={INSTITUTION_SOURCE} institutionTitle={INSTITUTION_LABEL} />
    );
    const badge = container.querySelector('.mg-schedule-event-marks .mg-engagement-type-badge');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe(INSTITUTION_LABEL);
    expect(INSTITUTION_LABEL).toHaveLength(4);

    const marksCss = fs.readFileSync(path.resolve(__dirname, '..', 'ScheduleEventMarks.css'), 'utf8');
    const badgeBlock = marksCss.match(/\.mg-schedule-event-marks \.mg-engagement-type-badge \{[^}]*\}/);
    expect(badgeBlock).not.toBeNull();
    expect(badgeBlock[0]).not.toMatch(/text-overflow:\s*ellipsis/);
    expect(badgeBlock[0]).not.toMatch(/overflow:\s*hidden/);
    expect(badgeBlock[0]).toMatch(/white-space:\s*nowrap/);

    const commonBadgeCss = fs.readFileSync(path.resolve(SRC, 'components', 'common', 'Badge.css'), 'utf8');
    expect(commonBadgeCss).toMatch(/\.mg-common-badge \{[^}]*display:\s*inline-flex;[^}]*justify-content:\s*center;/);
  });

  test('64px 미만 월 칩은 기관연계 배지를 다음 줄 전폭으로 내린다', () => {
    const pageCss = fs.readFileSync(
      path.resolve(SRC, 'components', 'admin', 'mapping-management', 'IntegratedMatchingSchedule.css'),
      'utf8'
    );
    const stageG = pageCss.match(/@container mg-month-event \(width < 64px\) \{[\s\S]*?\n\}/);
    expect(stageG).not.toBeNull();
    const unwrapRule = stageG[0].match(
      /\.mg-schedule-event-marks:has\(\.mg-schedule-event-marks__institution\) \{[^}]*\}/
    );
    expect(unwrapRule).not.toBeNull();
    expect(unwrapRule[0]).toMatch(/display:\s*contents;/);
    const badgeLineRule = stageG[0].match(/\.mg-schedule-event-marks__institution \{[^}]*\}/);
    expect(badgeLineRule).not.toBeNull();
    expect(badgeLineRule[0]).toMatch(/flex-basis:\s*100%;/);
  });

  /**
   * 390 월 칩(~36px): nowrap 네 글자(~48px)가 칩 overflow:hidden 에 「기관연」만 남긴다.
   * 좁은 단계(@container width < 64px) 공통 칩 컨텍스트에서만 nowrap 을 풀어 2줄(기관/연계)을 허용한다.
   * Badge.css 기본·넓은 표식 nowrap·말줄임 금지는 유지한다.
   */
  test('64px 미만 월 칩 컨텍스트에서만 기관연계 배지 nowrap 을 해제하고 말줄임하지 않는다', () => {
    const marksCss = fs.readFileSync(path.resolve(__dirname, '..', 'ScheduleEventMarks.css'), 'utf8');
    const imsCss = fs.readFileSync(
      path.resolve(SRC, 'components', 'admin', 'mapping-management', 'IntegratedMatchingSchedule.css'),
      'utf8'
    );
    const commonBadgeCss = fs.readFileSync(
      path.resolve(SRC, 'components', 'common', 'Badge.css'),
      'utf8'
    );

    const extractContainerBlock = (css, header) => {
      const start = css.indexOf(header);
      if (start < 0) {
        return '';
      }
      let depth = 0;
      for (let i = css.indexOf('{', start); i < css.length; i += 1) {
        if (css[i] === '{') depth += 1;
        if (css[i] === '}') {
          depth -= 1;
          if (depth === 0) {
            return css.slice(start, i + 1);
          }
        }
      }
      return '';
    };

    const NARROW_QUERY = '@container mg-month-event (width < 64px)';
    const marksNarrow = extractContainerBlock(marksCss, NARROW_QUERY);
    const imsNarrow = extractContainerBlock(imsCss, NARROW_QUERY);
    const narrowChipBadgeCss = `${marksNarrow}\n${imsNarrow}`;

    expect(marksNarrow.length + imsNarrow.length).toBeGreaterThan(0);

    const badgeRules = [];
    const rulePattern = /([^{}]*\.mg-engagement-type-badge[^{}]*)\{([^}]*)\}/g;
    let match = rulePattern.exec(narrowChipBadgeCss);
    while (match) {
      badgeRules.push({ selector: match[1].trim(), body: match[2] });
      match = rulePattern.exec(narrowChipBadgeCss);
    }
    expect(badgeRules.length).toBeGreaterThan(0);

    const wrapOverride = badgeRules.find(({ body }) => /white-space:\s*normal/.test(body));
    expect(wrapOverride).toBeDefined();
    expect(wrapOverride.selector).toMatch(/mg-v2-ad-calendar-event--integrated-month/);
    expect(wrapOverride.selector).toMatch(/mg-schedule-event-marks/);
    expect(wrapOverride.body).not.toMatch(/white-space:\s*nowrap/);
    expect(wrapOverride.body).not.toMatch(/text-overflow:\s*ellipsis/);
    expect(wrapOverride.body).not.toMatch(/overflow:\s*hidden/);
    expect(wrapOverride.body).toMatch(/overflow:\s*visible/);
    expect(wrapOverride.body).toMatch(/max-inline-size:\s*100%/);
    expect(wrapOverride.body).toMatch(/height:\s*auto/);

    const baseMarksBadge = marksCss.match(
      /^\.mg-schedule-event-marks \.mg-engagement-type-badge \{[^}]*\}/m
    );
    expect(baseMarksBadge).not.toBeNull();
    expect(baseMarksBadge[0]).toMatch(/white-space:\s*nowrap/);

    expect(commonBadgeCss).toMatch(
      /\.mg-common-badge \{[^}]*white-space:\s*nowrap/
    );
    expect(commonBadgeCss).toMatch(
      /\.mg-engagement-type-badge \{[^}]*white-space:\s*nowrap/
    );
  });

  /**
   * 주간/일 ~74px 열: 제목 밖 직계 __engagement 에 월 좁은 칩과 같은 wrap 을 적용한다.
   * Badge.css·넓은 표식 nowrap 은 유지한다.
   */
  test('주간/일 제목 밖 __engagement 배지에 월 좁은 칩과 같은 wrap 이 적용된다', () => {
    const marksCss = fs.readFileSync(path.resolve(__dirname, '..', 'ScheduleEventMarks.css'), 'utf8');
    const weekDayWrap = marksCss.match(
      /\.mg-v2-ad-calendar-event:not\(\.mg-v2-ad-calendar-event--compact\)\s*>\s*\.mg-v2-ad-calendar-event__engagement\s*\{[^}]*\}/
    );
    expect(weekDayWrap).not.toBeNull();
    expect(weekDayWrap[0]).toMatch(/white-space:\s*normal/);
    expect(weekDayWrap[0]).toMatch(/word-break:\s*break-all/);
    expect(weekDayWrap[0]).toMatch(/max-inline-size:\s*100%/);
    expect(weekDayWrap[0]).toMatch(/height:\s*auto/);
    expect(weekDayWrap[0]).toMatch(/overflow:\s*visible/);
    expect(weekDayWrap[0]).toMatch(/padding-block:\s*var\(--mg-v2-space-0-5\)/);
    expect(weekDayWrap[0]).toMatch(/padding-inline:\s*var\(--mg-v2-space-0-5\)/);
    expect(weekDayWrap[0]).toMatch(/font-size:\s*var\(--mg-v2-font-size-caption\)/);
    expect(weekDayWrap[0]).not.toMatch(/text-overflow:\s*ellipsis/);
    expect(weekDayWrap[0]).not.toMatch(/overflow:\s*hidden/);
    expect(weekDayWrap[0]).not.toMatch(/white-space:\s*nowrap/);
  });

  test('좁은 사이드바 행에서도 끝 표식은 글자 배지', () => {
    const { container } = render(
      <div className="integrated-schedule__sidebar-narrow-probe">
        <MatchingScheduleCompactRow
          mapping={{ ...INSTITUTION_MAPPING, packageName: '아주 긴 패키지 이름 A + 패키지 B' }}
        />
      </div>
    );
    const marks = container.querySelector('.mg-schedule-event-marks');
    expect(within(marks).getByText(INSTITUTION_LABEL)).toBeInTheDocument();
  });
});

describe('문자 발송 원 표식은 기관연계와 구분된다', () => {
  test('원 표식 툴팁·aria 가 있고 기관연계 글자를 포함하지 않는다', () => {
    const { container } = render(
      <ScheduleEventMarks source={INSTITUTION_SOURCE} sms={SMS_SENT} compact />
    );
    const sms = container.querySelector('.integrated-schedule__reminder-sms-badge');
    expect(sms).not.toBeNull();
    expect(sms.getAttribute('title')).toBeTruthy();
    expect(sms.getAttribute('aria-label')).toBeTruthy();
    expect(sms.getAttribute('aria-label')).not.toContain(INSTITUTION_LABEL);
    expect(sms.textContent).toBe('');
  });

  test('사이드바 행 aria-label 에 「문자 발송됨」이 남는다', () => {
    const onOpenPeek = jest.fn();
    render(
      <MatchingScheduleCompactRow
        mapping={{ ...INSTITUTION_MAPPING, clientReminderSms: SMS_SENT }}
        onOpenPeek={onOpenPeek}
      />
    );
    const row = screen.getByRole('button');
    expect(SMS_SENT_ARIA).toBe('문자 발송됨');
    expect(row.getAttribute('aria-label')).toContain(SMS_SENT_ARIA);
    expect(row.getAttribute('aria-label')).toContain(INSTITUTION_LABEL);
  });
});

describe('범례', () => {
  const legendProps = {
    consultants: [],
    events: [],
    scheduleStatusOptions: [],
    getConsultantColor: () => 'var(--mg-primary-500)',
    calendarSkin: 'integrated'
  };

  const renderExpandedLegend = () => {
    const utils = render(<ScheduleLegend {...legendProps} />);
    const toggle = utils.container.querySelector('.mg-v2-schedule-legend__toggle');
    if (toggle && toggle.getAttribute('aria-expanded') === 'false') {
      fireEvent.click(toggle);
    }
    return utils;
  };

  beforeEach(() => {
    window.localStorage.removeItem('mg.integratedSchedule.legendCollapsed');
  });

  test('기관연계 범례는 일정 상세와 같은 글자 배지이고 ■ 사각이 아니다', () => {
    const detail = renderDetailBadge();
    const { container } = renderExpandedLegend();
    const legend = container.querySelector('.mg-schedule-marks-legend');
    expect(legend).not.toBeNull();
    const badge = legend.querySelector('[data-testid="engagement-type-badge"]');
    expect(badge).not.toBeNull();
    expect(badge).toHaveTextContent(INSTITUTION_LABEL);
    expect(badge.getAttribute('data-engagement-type')).toBe('INSTITUTION_LINK');
    expect(badge.outerHTML.replace(/\s?mg-schedule-marks-legend__institution/, '')).toBe(detail);
    expect(legend.textContent).toContain(SCHEDULE_JSON.calendar.legend.institution);
  });

  test('기관연계 범례는 글자 배지 하나뿐이고 ■ 사각 범례가 없다', () => {
    const { container } = renderExpandedLegend();
    expect(container.querySelectorAll('[data-testid="engagement-type-badge"]')).toHaveLength(1);

    const pageDir = path.resolve(SRC, 'components', 'admin', 'mapping-management');
    const pageJs = fs.readFileSync(path.resolve(pageDir, 'IntegratedMatchingSchedule.js'), 'utf8');
    const pageCss = fs.readFileSync(path.resolve(pageDir, 'IntegratedMatchingSchedule.css'), 'utf8');
    expect(pageJs).not.toMatch(/institution-link"/);
    expect(pageJs).not.toMatch(/legend\.institutionLink/);
    expect(pageCss).not.toMatch(/legend(-swatch)?--institution-link/);
  });

  test('문자 원 표식 설명이 범례에 있다', () => {
    const { container } = renderExpandedLegend();
    const legend = container.querySelector('.mg-schedule-marks-legend');
    expect(legend.querySelector('.mg-schedule-marks-legend__sms')).not.toBeNull();
    expect(legend.textContent).toContain(SCHEDULE_JSON.calendar.legend.sms);
    expect(SCHEDULE_JSON.calendar.legend.sms).toContain('문자 발송됨');
  });
});
