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
  filterTodayOnlySchedules
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
});
