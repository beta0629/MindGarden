import { maskEmailDisplay, maskPhoneDisplay } from '../partyPiiDisplay';

describe('partyPiiDisplay', () => {
  describe('maskPhoneDisplay', () => {
    it('masks full mobile digits', () => {
      expect(maskPhoneDisplay('01012345678')).toBe('010-****-5678');
    });

    it('keeps null/empty', () => {
      expect(maskPhoneDisplay(null)).toBeNull();
      expect(maskPhoneDisplay('')).toBe('');
    });
  });

  describe('maskEmailDisplay', () => {
    it('masks local part', () => {
      expect(maskEmailDisplay('hello@example.com')).toBe('h***@example.com');
    });

    it('keeps null/empty', () => {
      expect(maskEmailDisplay(null)).toBeNull();
      expect(maskEmailDisplay('')).toBe('');
    });
  });
});
