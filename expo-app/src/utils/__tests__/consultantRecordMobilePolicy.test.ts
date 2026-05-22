import {
  isConsultantRecordEditableOnMobile,
  isConsultantRecordVisibleOnMobile,
} from '../consultantRecordMobilePolicy';

describe('isConsultantRecordVisibleOnMobile', () => {
  it('returns true for COMPLETED (read-only view)', () => {
    expect(isConsultantRecordVisibleOnMobile('COMPLETED')).toBe(true);
    expect(isConsultantRecordVisibleOnMobile('completed')).toBe(true);
  });

  it('returns true for DRAFT and PENDING', () => {
    expect(isConsultantRecordVisibleOnMobile('DRAFT')).toBe(true);
    expect(isConsultantRecordVisibleOnMobile('draft')).toBe(true);
    expect(isConsultantRecordVisibleOnMobile('PENDING')).toBe(true);
    expect(isConsultantRecordVisibleOnMobile('pending')).toBe(true);
  });

  it('returns false for empty or unknown status', () => {
    expect(isConsultantRecordVisibleOnMobile(undefined)).toBe(false);
    expect(isConsultantRecordVisibleOnMobile(null)).toBe(false);
    expect(isConsultantRecordVisibleOnMobile('')).toBe(false);
  });
});

describe('isConsultantRecordEditableOnMobile', () => {
  it('returns true only for DRAFT', () => {
    expect(isConsultantRecordEditableOnMobile('DRAFT')).toBe(true);
    expect(isConsultantRecordEditableOnMobile('draft')).toBe(true);
  });

  it('returns false for COMPLETED and PENDING', () => {
    expect(isConsultantRecordEditableOnMobile('COMPLETED')).toBe(false);
    expect(isConsultantRecordEditableOnMobile('PENDING')).toBe(false);
  });
});
