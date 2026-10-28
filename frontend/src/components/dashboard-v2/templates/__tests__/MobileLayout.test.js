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

  it('drawerVariant soft-sheet를 MobileLnbDrawer에 전달한다', () => {
    render(
      <MobileLayout drawerVariant="soft-sheet">
        <div>content</div>
      </MobileLayout>
    );

    expect(mockMobileLnbDrawer).toHaveBeenCalled();
    const drawerProps = mockMobileLnbDrawer.mock.calls[0][0];
    expect(drawerProps.variant).toBe('soft-sheet');
  });

  it('soft-sheet 루트 클래스 · main/stage는 drawer 상태와 무관하게 동일 마크업', () => {
    const { container } = render(
      <MobileLayout drawerVariant="soft-sheet">
        <div>content</div>
      </MobileLayout>
    );
    const root = container.querySelector('.mg-v2-mobile-layout--soft-sheet');
    expect(root).toBeTruthy();
    const main = container.querySelector('.mg-v2-mobile-layout__main');
    const stage = container.querySelector('.mg-v2-mobile-layout__stage');
    expect(main).toBeTruthy();
    expect(stage).toBeTruthy();
    expect(main.className).not.toMatch(/drawer-open|pushed|shifted/);
    expect(stage.className).not.toMatch(/drawer-open|pushed|shifted/);
  });
});
