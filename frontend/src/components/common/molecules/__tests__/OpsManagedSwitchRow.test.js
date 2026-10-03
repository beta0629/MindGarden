/**
 * OpsManagedSwitchRow — 운영자 전용 설정 읽기 전용 행.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import OpsManagedSwitchRow from '../OpsManagedSwitchRow';
import {
  OPS_MANAGED_SETTING_CAPTION,
  OPS_MANAGED_TEST_ID_SUFFIX
} from '../../../../constants/opsManagedSettings';

describe('OpsManagedSwitchRow', () => {
  it('Switch 는 항상 disabled 이고 클릭해도 aria-checked 가 바뀌지 않는다', () => {
    render(
      <OpsManagedSwitchRow label="전역 스위치" checked data-testid="ops-row" ariaLabel="전역 스위치" />
    );
    const sw = screen.getByTestId('ops-row');
    expect(sw).toHaveAttribute('role', 'switch');
    expect(sw).toBeDisabled();
    expect(sw).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('meta 가 없으면 운영자 관리 안내만, 있으면 meta 뒤에 안내를 붙인다', () => {
    const { rerender } = render(<OpsManagedSwitchRow label="A" checked={false} />);
    expect(screen.getByText(OPS_MANAGED_SETTING_CAPTION)).toBeInTheDocument();

    rerender(<OpsManagedSwitchRow label="A" checked={false} meta="마지막 변경: SYSTEM" />);
    expect(
      screen.getByText(`마지막 변경: SYSTEM · ${OPS_MANAGED_SETTING_CAPTION}`)
    ).toBeInTheDocument();
  });

  it('data-testid 미지정 시 기본 접미사를 쓴다', () => {
    render(<OpsManagedSwitchRow label="B" checked={false} />);
    expect(screen.getByTestId(OPS_MANAGED_TEST_ID_SUFFIX)).toBeDisabled();
  });
});
