import { openingDateError, representativeNameError, todayInSeoul } from '../merchantOpeningDate';

describe('merchantOpeningDate', () => {
  it('uses Seoul calendar for the opening-date upper bound', () => {
    const today = todayInSeoul(new Date('2026-10-04T15:00:00Z'));
    expect(today).toBe('2026-10-05');
    expect(openingDateError('2026-10-05', today)).toBe('');
    expect(openingDateError('2026-10-06', today)).not.toBe('');
  });

  it('rejects a digits-only representative name', () => {
    expect(representativeNameError('홍길동')).toBe('');
    expect(representativeNameError('1234')).not.toBe('');
  });
});
