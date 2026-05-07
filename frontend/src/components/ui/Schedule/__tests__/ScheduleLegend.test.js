/**
 * ScheduleLegend 회귀: 범례 본문에 이모지(픽토그래픽) 미포함 — 디자인 스펙(이모지 제거) 고정
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ScheduleLegend from '../ScheduleLegend';
import {
  KR_PUBLIC_HOLIDAY_LEGEND_LABEL,
  SCHEDULE_LEGEND_INTEGRATED_WEEKEND_HOLIDAY_NOTE
} from '../../../../constants/schedule';

const minimalProps = () => ({
  consultants: [],
  events: [],
  scheduleStatusOptions: [],
  getConsultantColor: () => 'var(--mg-primary-500)'
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

  test('calendarSkin=integrated일 때 주말·공휴일 색 안내 문구가 보인다', () => {
    render(<ScheduleLegend {...minimalProps()} calendarSkin="integrated" />);
    expect(screen.getByText(SCHEDULE_LEGEND_INTEGRATED_WEEKEND_HOLIDAY_NOTE)).toBeInTheDocument();
  });
});
