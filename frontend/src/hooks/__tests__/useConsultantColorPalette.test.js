/**
 * 상담사 색 훅 — 같은 API 응답을 범례·칩 클래스로 공유한다.
 */

import { renderHook, waitFor } from '@testing-library/react';
import StandardizedApi from '../../utils/standardizedApi';
import { setConsultantColors } from '../../utils/designSystemHelper';
import {
  resetConsultantColorPaletteCache,
  useConsultantColorPalette
} from '../useConsultantColorPalette';

jest.mock('../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));

jest.mock('../../utils/designSystemHelper', () => ({
  setConsultantColors: jest.fn()
}));

describe('useConsultantColorPalette', () => {
  beforeEach(() => {
    resetConsultantColorPaletteCache();
    StandardizedApi.get.mockReset();
    setConsultantColors.mockReset();
  });

  test('consultant-colors 를 읽어 같은 슬롯 클래스를 준다', async() => {
    StandardizedApi.get.mockResolvedValue({
      themeName: 'default',
      colors: ['#112233', '#445566']
    });
    const consultants = [{ id: 3 }, { id: 22 }];
    const { result } = renderHook(() => useConsultantColorPalette());

    await waitFor(() => {
      expect(result.current.paletteSize).toBe(2);
    });

    expect(StandardizedApi.get).toHaveBeenCalledWith('/api/v1/admin/css-themes/consultant-colors');
    expect(setConsultantColors).toHaveBeenCalledWith(['#112233', '#445566']);
    expect(result.current.colorClassFor(3, consultants)).toBe(
      'mg-v2-consultant-color mg-v2-consultant-color--1'
    );
    expect(result.current.colorClassFor(22, consultants)).toBe(
      'mg-v2-consultant-color mg-v2-consultant-color--2'
    );
  });
});
