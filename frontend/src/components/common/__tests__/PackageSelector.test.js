/**
 * PackageSelector — CONSULTATION_PACKAGE SSOT 회귀 가드
 *
 * - getCommonCodes('PACKAGE') / codeGroup=PACKAGE 호출 금지
 * - getTenantCodes('CONSULTATION_PACKAGE') + toPackageOption(extraData) 사용
 * - 실패 시 BASIC_20 / SINGLE_* 하드코딩 폴백 금지
 *
 * @author Core Solution
 * @since 2026-07-16
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PackageSelector from '../PackageSelector';
import { CODE_GROUP_CONSULTATION_PACKAGE } from '../../../constants/packagePricingConstants';

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

const mockGetTenantCodes = jest.fn();
const mockGetCommonCodes = jest.fn();

jest.mock('../../../utils/commonCodeApi', () => ({
  __esModule: true,
  getTenantCodes: (...args) => mockGetTenantCodes(...args),
  getCommonCodes: (...args) => mockGetCommonCodes(...args)
}));

describe('PackageSelector SSOT', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('CONSULTATION_PACKAGE 테넌트 코드만 조회하고 PACKAGE 공통코드를 호출하지 않는다', async() => {
    mockGetTenantCodes.mockResolvedValue([
      {
        codeValue: 'PKG_STANDARD',
        koreanName: '표준 패키지',
        sortOrder: 1,
        extraData: JSON.stringify({ sessions: 10, price: 350000 })
      }
    ]);

    render(<PackageSelector value="" onChange={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/표준 패키지 \(10회기, 350,000원\)/)).toBeInTheDocument();
    });

    expect(mockGetTenantCodes).toHaveBeenCalledWith(CODE_GROUP_CONSULTATION_PACKAGE);
    expect(mockGetCommonCodes).not.toHaveBeenCalled();
  });

  test('선택 시 value=codeValue, label=koreanName, sessions/price=extraData 를 전달한다', async() => {
    mockGetTenantCodes.mockResolvedValue([
      {
        codeValue: 'PKG_STANDARD',
        koreanName: '표준 패키지',
        sortOrder: 1,
        extraData: JSON.stringify({ sessions: 10, price: 350000 })
      }
    ]);
    const onChange = jest.fn();

    render(<PackageSelector value="" onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByText(/표준 패키지/)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'PKG_STANDARD' } });

    expect(onChange).toHaveBeenCalledWith({
      value: 'PKG_STANDARD',
      label: '표준 패키지',
      sessions: 10,
      price: 350000
    });
  });

  test('조회 실패 시 빈 목록이며 BASIC/SINGLE 하드코딩 폴백이 없다', async() => {
    mockGetTenantCodes.mockRejectedValue(new Error('network'));

    render(<PackageSelector value="" onChange={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/패키지 요금 관리에서 활성 패키지를/)).toBeInTheDocument();
    });

    expect(screen.queryByText(/BASIC_20/)).not.toBeInTheDocument();
    expect(screen.queryByText(/SINGLE_30000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/기본 패키지/)).not.toBeInTheDocument();
  });
});
