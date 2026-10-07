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

  test('문자 원 표식 설명이 범례에 있다', () => {
    const { container } = renderExpandedLegend();
    const legend = container.querySelector('.mg-schedule-marks-legend');
    expect(legend.querySelector('.mg-schedule-marks-legend__sms')).not.toBeNull();
    expect(legend.textContent).toContain(SCHEDULE_JSON.calendar.legend.sms);
    expect(SCHEDULE_JSON.calendar.legend.sms).toContain('문자 발송됨');
  });
});
