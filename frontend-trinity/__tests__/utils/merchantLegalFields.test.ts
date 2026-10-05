import { openingDateError, representativeNameError, todayInSeoul } from '../../utils/merchantLegalFields';

describe('merchantLegalFields', () => {
  it('rejects a KST-future opening date and accepts today', () => {
    const today = todayInSeoul(new Date('2026-10-04T15:00:00Z'));
    expect(today).toBe('2026-10-05');
    expect(openingDateError('2026-10-05', today)).toBeNull();
    expect(openingDateError('2026-10-06', today)).not.toBeNull();
    expect(openingDateError('2020-02-31', today)).not.toBeNull();
    expect(openingDateError('', today)).not.toBeNull();
  });

  it('rejects a representative name that is only digits', () => {
    expect(representativeNameError('홍길동')).toBeNull();
    expect(representativeNameError('12345')).not.toBeNull();
    expect(representativeNameError('')).not.toBeNull();
  });
});
