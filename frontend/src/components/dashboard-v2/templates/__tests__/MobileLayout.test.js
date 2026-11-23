/**
 * MobileLayout — onLogout → MobileGnb 전달 (P0 admin mobile logout)
 * @see docs/standards/TESTING_STANDARD.md
 */
import React from 'react';
import { act, render } from '@testing-library/react';
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

  it('햄버거 onMenuClick은 drawer를 토글한다 (열기→닫기)', () => {
    render(
      <MobileLayout drawerVariant="soft-sheet" shellTone="admin">
        <div>content</div>
      </MobileLayout>
    );

    expect(mockMobileGnb.mock.calls[0][0].menuExpanded).toBe(false);
    expect(mockMobileLnbDrawer.mock.calls[0][0].isOpen).toBe(false);

    act(() => {
      mockMobileGnb.mock.calls[0][0].onMenuClick();
    });
    expect(mockMobileGnb.mock.calls.at(-1)[0].menuExpanded).toBe(true);
    expect(mockMobileLnbDrawer.mock.calls.at(-1)[0].isOpen).toBe(true);

    act(() => {
      mockMobileGnb.mock.calls.at(-1)[0].onMenuClick();
    });
    expect(mockMobileGnb.mock.calls.at(-1)[0].menuExpanded).toBe(false);
    expect(mockMobileLnbDrawer.mock.calls.at(-1)[0].isOpen).toBe(false);
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

  it('기본: stage 검색 행을 렌더한다', () => {
    const { container } = render(
      <MobileLayout>
        <div>content</div>
      </MobileLayout>
    );
    expect(container.querySelector('.mg-v2-mobile-layout__search')).toBeTruthy();
  });

  it('hideSearch=true면 stage 검색 행을 미렌더한다', () => {
    const { container } = render(
      <MobileLayout hideSearch>
        <div>content</div>
      </MobileLayout>
    );
    expect(container.querySelector('.mg-v2-mobile-layout__search')).toBeNull();
  });
});
