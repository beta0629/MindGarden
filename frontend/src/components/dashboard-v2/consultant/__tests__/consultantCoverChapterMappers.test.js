/**
 * Cover+Chapter 매퍼 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import {
  mapNextConsultationSheet,
  mapScheduleChips,
  mapGuideContent,
  buildCoverSubtitle,
  formatConsultantDisplayName,
  filterTodayOnlySchedules,
  selectNextWaitingSchedule,
  isNextWaitingStatus
} from '../consultantCoverChapterMappers';
import {
  COVER_CHAPTER_ZERO_COVER_SUB,
  COVER_CHAPTER_INCOMPLETE_HINT
} from '../consultantCoverChapterConstants';

describe('consultantCoverChapterMappers', () => {
  test('formatConsultantDisplayName appends 상담사', () => {
    expect(formatConsultantDisplayName('김서연')).toBe('김서연 상담사');
    expect(formatConsultantDisplayName('김서연 상담사')).toBe('김서연 상담사');
  });

  test('mapNextConsultationSheet null → null (zero)', () => {
    expect(mapNextConsultationSheet(null)).toBeNull();
  });

  test('mapNextConsultationSheet has → sheet model with truncate-ready body', () => {
    const model = mapNextConsultationSheet({
      scheduleId: 1,
      clientName: '남궁민서윤아림정한솔예린',
      startTime: '2026-10-29T14:30:00',
      endTime: '2026-10-29T15:20:00',
      isToday: true,
      status: 'CONFIRMED',
      packageName: '개인상담',
      roomName: '3층 상담실 B'
    });
    expect(model.timeLabel).toBe('오늘 14:30');
    expect(model.bodyLabel).toContain('남궁민서윤아림정한솔예린');
    expect(model.bodyLabel).toContain('50분');
    expect(model.metaLabel).toContain('3층 상담실 B');
    expect(model.badgeLabel).toBe('확정');
  });

  test('mapScheduleChips uses today statistics fields', () => {
    expect(mapScheduleChips({
      totalToday: 3,
      completedToday: 1,
      inProgressToday: 2
    })).toEqual({ today: 3, completed: 1, remaining: 2 });
  });

  test('buildCoverSubtitle zero vs has', () => {
    expect(buildCoverSubtitle(null, 0)).toBe(COVER_CHAPTER_ZERO_COVER_SUB);
    expect(buildCoverSubtitle({ startTime: '2026-10-29T14:30:00', isToday: true }, 3))
      .toBe('오늘 상담 3건 · 다음 14:30');
  });

  test('mapGuideContent prefers incomplete hint when no notification', () => {
    const guide = mapGuideContent([], 2);
    expect(guide.body).toBe(COVER_CHAPTER_INCOMPLETE_HINT(2));
  });

  test('filterTodayOnlySchedules keeps today rows', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const rows = filterTodayOnlySchedules([
      { id: 1, startTime: `${y}-${m}-${d}T10:00:00` },
      { id: 2, startTime: '2020-01-01T10:00:00' }
    ], today);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(1);
  });

  test('isNextWaitingStatus matches pending/confirmed family', () => {
    expect(isNextWaitingStatus('PENDING')).toBe(true);
    expect(isNextWaitingStatus('WAITING')).toBe(true);
    expect(isNextWaitingStatus('CONFIRMED')).toBe(true);
    expect(isNextWaitingStatus('IN_PROGRESS')).toBe(true);
    expect(isNextWaitingStatus('COMPLETED')).toBe(false);
    expect(isNextWaitingStatus('NO_SHOW')).toBe(false);
  });

  test('selectNextWaitingSchedule: empty → null (zero)', () => {
    expect(selectNextWaitingSchedule([], new Date('2026-10-29T12:00:00'))).toBeNull();
    expect(selectNextWaitingSchedule(null, new Date('2026-10-29T12:00:00'))).toBeNull();
  });

  test('selectNextWaitingSchedule: past-only → null (zero)', () => {
    const now = new Date('2026-10-29T13:00:00');
    const picked = selectNextWaitingSchedule([
      {
        id: 1,
        startTime: '2026-10-29T10:00:00',
        status: 'PENDING'
      },
      {
        id: 2,
        startTime: '2026-10-29T11:00:00',
        status: 'COMPLETED'
      }
    ], now);
    expect(picked).toBeNull();
  });

  test('selectNextWaitingSchedule: has waiting → earliest future', () => {
    const now = new Date('2026-10-29T12:00:00');
    const picked = selectNextWaitingSchedule([
      {
        id: 10,
        startTime: '2026-10-29T19:00:00',
        status: 'PENDING',
        clientName: 'C'
      },
      {
        id: 11,
        startTime: '2026-10-29T14:00:00',
        status: 'WAITING',
        clientName: 'A'
      },
      {
        id: 12,
        startTime: '2026-10-29T18:00:00',
        status: 'CONFIRMED',
        clientName: 'B'
      },
      {
        id: 13,
        startTime: '2026-10-29T09:00:00',
        status: 'COMPLETED',
        clientName: 'Past'
      }
    ], now);
    expect(picked).not.toBeNull();
    expect(picked.id).toBe(11);
    expect(picked.clientName).toBe('A');
  });

  test('selectNextWaitingSchedule: injected server now picks 14:00 waiting', () => {
    const now = new Date('2026-10-29T13:30:00');
    const picked = selectNextWaitingSchedule([
      { id: 1, startTime: '2026-10-29T14:00:00', status: 'PENDING' },
      { id: 2, startTime: '2026-10-29T18:00:00', status: 'PENDING' },
      { id: 3, startTime: '2026-10-29T19:00:00', status: 'PENDING' }
    ], now);
    expect(picked.id).toBe(1);
    expect(mapNextConsultationSheet(picked).timeLabel).toBe('오늘 14:00');
  });
});
