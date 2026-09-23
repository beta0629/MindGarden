/**
 * MobileLayout — onLogout → MobileGnb 전달 (P0 admin mobile logout)
 * @see docs/standards/TESTING_STANDARD.md
 */
import React from 'react';
import { render } from '@testing-library/react';
import MobileLayout from '../MobileLayout';

const mockMobileGnb = jest.fn(() => null);
const mockMobileLnbDrawer = jest.fn(() => null);

jest.mock('../../organisms', () => ({
  MobileGnb: (props) => mockMobileGnb(props),
  MobileLnbDrawer: (props) => mockMobileLnbDrawer(props)
}));

describe('MobileLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('onLogout prop을 MobileGnb에 전달한다', () => {
    const onLogout = jest.fn();
    render(
      <MobileLayout onLogout={onLogout}>
        <div>content</div>
      </MobileLayout>
    );

    expect(mockMobileGnb).toHaveBeenCalled();
    const gnbProps = mockMobileGnb.mock.calls[0][0];
    expect(gnbProps.onLogout).toBe(onLogout);
  });

  it('onLogout이 없으면 MobileGnb에 undefined를 전달한다', () => {
    render(
      <MobileLayout>
        <div>content</div>
      </MobileLayout>
    );

    const gnbProps = mockMobileGnb.mock.calls[0][0];
    expect(gnbProps.onLogout).toBeUndefined();
  });
});
