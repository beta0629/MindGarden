/**
 * 상담사 태블릿 일정 v2 — 아젠다 행 빌드
 */
import {
  buildTabletAgendaItem,
  buildTabletAgendaItems,
  formatAgendaClock,
  groupTabletAgendaByDay,
  isAgendaInProgress
} from '../consultantTabletAgenda';
import { STATUS } from '../../constants/schedule';

describe('consultantTabletAgenda', () => {
  const now = new Date(2026, 9, 28, 14, 0, 0);

  it('formatAgendaClock pads HH:mm', () => {
    expect(formatAgendaClock(new Date(2026, 9, 28, 9, 5))).toBe('09:05');
  });

  it('isAgendaInProgress when now is inside [start, end)', () => {
    const start = new Date(2026, 9, 28, 13, 30);
    const end = new Date(2026, 9, 28, 15, 0);
    expect(isAgendaInProgress(start, end, now)).toBe(true);
    expect(isAgendaInProgress(start, end, new Date(2026, 9, 28, 15, 0))).toBe(false);
  });

  it('buildTabletAgendaItem clamps long name fields and marks now/done', () => {
    const inProgress = buildTabletAgendaItem({
      id: 1,
      title: '세션',
      start: new Date(2026, 9, 28, 13, 30),
      end: new Date(2026, 9, 28, 15, 0),
      extendedProps: {
        clientName: '윤하늘별빛심리상담희망자',
        status: STATUS.BOOKED,
        consultationType: '화상'
      }
    }, {
      now,
      inProgressLabel: '진행',
      inProgressMeta: '지금 진행 중',
      durationLabel: (n) => `${n}분`
    });
    expect(inProgress.inProgress).toBe(true);
    expect(inProgress.statusLabel).toBe('진행');
    expect(inProgress.meta).toContain('지금 진행 중');
    expect(inProgress.className).toContain('status-booked');

    const done = buildTabletAgendaItem({
      id: 2,
      start: new Date(2026, 9, 27, 10, 0),
      end: new Date(2026, 9, 27, 10, 50),
      extendedProps: { clientName: '박지훈', status: STATUS.COMPLETED }
    }, { now, durationLabel: (n) => `${n}분` });
    expect(done.completed).toBe(true);
    expect(done.endLabel).toBe('10:50');
  });

  it('buildTabletAgendaItems filters range and sorts; groupTabletAgendaByDay groups', () => {
    const rangeStart = new Date(2026, 9, 27);
    const rangeEnd = new Date(2026, 9, 29);
    const items = buildTabletAgendaItems([
      {
        id: 3,
        start: new Date(2026, 9, 28, 16, 30),
        end: new Date(2026, 9, 28, 17, 20),
        extendedProps: { clientName: '송미래', status: STATUS.BOOKED }
      },
      {
        id: 1,
        start: new Date(2026, 9, 28, 9, 30),
        end: new Date(2026, 9, 28, 11, 0),
        extendedProps: { clientName: '김서연', status: STATUS.CONFIRMED }
      },
      {
        id: 9,
        start: new Date(2026, 9, 30, 9, 0),
        end: new Date(2026, 9, 30, 10, 0),
        extendedProps: { clientName: '범위밖', status: STATUS.BOOKED }
      }
    ], rangeStart, rangeEnd, { now, durationLabel: (n) => `${n}분` });
    expect(items.map((i) => i.id)).toEqual([1, 3]);
    const groups = groupTabletAgendaByDay(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].dayKey).toBe('2026-10-28');
  });
});
