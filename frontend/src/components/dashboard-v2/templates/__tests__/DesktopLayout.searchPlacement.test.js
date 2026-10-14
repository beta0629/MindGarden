/**
 * DesktopLayout — 검색창이 main 본문 왼쪽(상단)에 있다
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import DesktopLayout from '../DesktopLayout';

jest.mock('../../organisms', () => ({
  DesktopGnb: () => <header data-testid="desktop-gnb" />,
  DesktopLnb: () => <nav data-testid="desktop-lnb" />
}));

describe('DesktopLayout search placement', () => {
  it('main 안 왼쪽에 SearchInput이 있다', () => {
    const { container } = render(
      <DesktopLayout searchValue="" onSearchChange={jest.fn()}>
        <div data-testid="page-content">page</div>
      </DesktopLayout>
    );
    const main = container.querySelector('main.mg-v2-desktop-layout__main');
    expect(main).toBeTruthy();
    const searchWrap = main.querySelector('.mg-v2-desktop-layout__search');
    expect(searchWrap).toBeTruthy();
    expect(searchWrap.querySelector('.mg-v2-search-input')).toBeTruthy();
    expect(screen.getByLabelText('통합 검색')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('통합 검색...')).toBeInTheDocument();
    expect(main.firstElementChild).toBe(searchWrap);
  });
});
