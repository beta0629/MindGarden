/**
 * ScheduleLegend 회귀:
 *  1) 범례 본문에 이모지(픽토그래픽) 미포함 — 디자인 스펙(이모지 제거) 고정.
 *  2) 옵션 A (2026-05-26): calendarSkin=integrated 일 때 collapsible accordion 토글이
 *     렌더링되고 기본 접힘(aria-expanded="false") 이며, 토글 시 펼침 상태로 전환된다.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ScheduleLegend from '../ScheduleLegend';
import {
  KR_PUBLIC_HOLIDAY_LEGEND_LABEL,
  SCHEDULE_LEGEND_INTEGRATED_WEEKEND_HOLIDAY_NOTE,
  SCHEDULE_LEGEND_SESSION_BOOKING_SEQUENCE_MEANING,
  SCHEDULE_LEGEND_SESSION_BOOKING_SEQUENCE_SAMPLE,
  SCHEDULE_LEGEND_SESSION_LABELS_TITLE,
  SCHEDULE_LEGEND_SESSION_REMAINING_MEANING,
  SCHEDULE_LEGEND_SESSION_REMAINING_SAMPLE
} from '../../../../constants/schedule';

const minimalProps = () => ({
  consultants: [],
  events: [],
  scheduleStatusOptions: [],
  getConsultantColor: () => 'var(--mg-primary-500)'
});

const LEGEND_COLLAPSED_STORAGE_KEY = 'mg.integratedSchedule.legendCollapsed';

beforeEach(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(LEGEND_COLLAPSED_STORAGE_KEY);
  }
});

describe('ScheduleLegend', () => {
  test('공휴일 범례 라벨이 보이고 범례 영역에 이모지(Extended_Pictographic)가 없다', () => {
    const { container } = render(<ScheduleLegend {...minimalProps()} />);

    expect(screen.getByText(KR_PUBLIC_HOLIDAY_LEGEND_LABEL)).toBeInTheDocument();

    const root = container.querySelector('.mg-v2-schedule-legend');
    expect(root).toBeTruthy();
    const text = root.textContent || '';
    expect(/\p{Extended_Pictographic}/u.test(text)).toBe(false);
  });

  test('calendarSkin=integrated일 때 주말·공휴일 색 안내 문구가 보인다 (DOM 존재)', () => {
    render(<ScheduleLegend {...minimalProps()} calendarSkin="integrated" />);
    // 기본 접힘이어도 본문 DOM 은 [hidden] 상태로 유지 — getByText 는 hidden 노드도 탐색
    expect(screen.getByText(SCHEDULE_LEGEND_INTEGRATED_WEEKEND_HOLIDAY_NOTE)).toBeInTheDocument();
  });

  test('calendarSkin=integrated일 때 회기 표기 범례가 보인다 (DOM 존재)', () => {
    render(<ScheduleLegend {...minimalProps()} calendarSkin="integrated" />);
    expect(screen.getByText(SCHEDULE_LEGEND_SESSION_LABELS_TITLE)).toBeInTheDocument();
    expect(screen.getByText(SCHEDULE_LEGEND_SESSION_BOOKING_SEQUENCE_SAMPLE)).toBeInTheDocument();
    expect(screen.getByText(`= ${SCHEDULE_LEGEND_SESSION_BOOKING_SEQUENCE_MEANING}`)).toBeInTheDocument();
    expect(screen.getByText(SCHEDULE_LEGEND_SESSION_REMAINING_SAMPLE)).toBeInTheDocument();
    expect(screen.getByText(`= ${SCHEDULE_LEGEND_SESSION_REMAINING_MEANING}`)).toBeInTheDocument();
  });

  test('calendarSkin=integrated 기본 접힘(Q2=A) — 토글 버튼이 존재하고 aria-expanded=false 이다', () => {
    const { container } = render(<ScheduleLegend {...minimalProps()} calendarSkin="integrated" />);

    const toggle = container.querySelector('.mg-v2-schedule-legend__toggle');
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    const body = container.querySelector('.mg-v2-schedule-legend__body');
    expect(body).toBeTruthy();
    expect(body.hasAttribute('hidden')).toBe(true);
  });

  test('calendarSkin=integrated 토글 클릭 시 펼침 상태로 전환되고 localStorage 에 선호가 저장된다', () => {
    const { container } = render(<ScheduleLegend {...minimalProps()} calendarSkin="integrated" />);

    const toggle = container.querySelector('.mg-v2-schedule-legend__toggle');
    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const body = container.querySelector('.mg-v2-schedule-legend__body');
    expect(body.hasAttribute('hidden')).toBe(false);

    expect(window.localStorage.getItem(LEGEND_COLLAPSED_STORAGE_KEY)).toBe('false');
  });

  test('비통합 스킨(calendarSkin 미지정)에서는 collapsible 토글이 렌더링되지 않는다', () => {
    const { container } = render(<ScheduleLegend {...minimalProps()} />);
    expect(container.querySelector('.mg-v2-schedule-legend__toggle')).toBeNull();
    expect(container.querySelector('.mg-v2-schedule-legend--collapsible')).toBeNull();
  });

  test('localStorage 에 선호값(펼침)이 있으면 초기 상태는 펼침이다', () => {
    window.localStorage.setItem(LEGEND_COLLAPSED_STORAGE_KEY, 'false');
    const { container } = render(<ScheduleLegend {...minimalProps()} calendarSkin="integrated" />);

    const toggle = container.querySelector('.mg-v2-schedule-legend__toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const body = container.querySelector('.mg-v2-schedule-legend__body');
    expect(body.hasAttribute('hidden')).toBe(false);
  });
});
