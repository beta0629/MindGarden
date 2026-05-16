import {
  formatCommunityListedTime,
  normalizeCommunityListedTimeIso,
} from '@/utils/dateFormat';

describe('normalizeCommunityListedTimeIso', () => {
  it('trims nanosecond fractional seconds to milliseconds', () => {
    expect(normalizeCommunityListedTimeIso('2026-05-14T12:34:13.788533006')).toBe(
      '2026-05-14T12:34:13.788',
    );
  });
});

describe('formatCommunityListedTime', () => {
  it('does not return raw ISO for Spring LocalDateTime with nanoseconds', () => {
    const raw = '2026-05-14T12:34:13.788533006';
    const out = formatCommunityListedTime(raw, '—');
    expect(out).not.toBe(raw);
    expect(out).not.toMatch(/T\d{2}:\d{2}:\d{2}\.\d{6,}/);
    expect(out).not.toBe('—');
  });

  it('returns fallback for empty input', () => {
    expect(formatCommunityListedTime('', '대체')).toBe('대체');
  });

  it('passes through non-ISO labels', () => {
    expect(formatCommunityListedTime('2시간 전', '—')).toBe('2시간 전');
  });
});
