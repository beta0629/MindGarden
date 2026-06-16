/**
 * BillingCycleToggle 단위 테스트 (Refine v2 W2)
 *
 * @author MindGarden
 * @since 2026-06-16
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: {} })),
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
}));

const BillingCycleToggle = require('../BillingCycleToggle').default;

const renderToggle = (props = {}) => {
  const onCycleChange = jest.fn();
  const utils = render(
    <BillingCycleToggle
      cycle={props.cycle || 'monthly'}
      onCycleChange={props.onCycleChange || onCycleChange}
    />
  );
  return { ...utils, onCycleChange };
};

describe('BillingCycleToggle', () => {
  it('루트 클래스 mg-v2-billing-cycle-toggle 가 존재한다', () => {
    const { container } = renderToggle();
    expect(container.querySelector('.mg-v2-billing-cycle-toggle')).toBeInTheDocument();
  });

  it('월간 / 연간 버튼이 모두 렌더링된다', () => {
    renderToggle();
    expect(screen.getByTestId('billing-cycle-toggle-monthly')).toBeInTheDocument();
    expect(screen.getByTestId('billing-cycle-toggle-yearly')).toBeInTheDocument();
  });

  it('cycle="monthly" 일 때 월간 버튼이 active 클래스를 가진다', () => {
    renderToggle({ cycle: 'monthly' });
    const monthly = screen.getByTestId('billing-cycle-toggle-monthly');
    const yearly = screen.getByTestId('billing-cycle-toggle-yearly');
    expect(monthly.className).toContain('mg-v2-billing-cycle-toggle__option--active');
    expect(yearly.className).not.toContain('mg-v2-billing-cycle-toggle__option--active');
    expect(monthly.getAttribute('aria-selected')).toBe('true');
    expect(yearly.getAttribute('aria-selected')).toBe('false');
  });

  it('cycle="yearly" 일 때 연간 버튼이 active 클래스를 가진다', () => {
    renderToggle({ cycle: 'yearly' });
    const yearly = screen.getByTestId('billing-cycle-toggle-yearly');
    expect(yearly.className).toContain('mg-v2-billing-cycle-toggle__option--active');
    expect(yearly.getAttribute('aria-selected')).toBe('true');
  });

  it('연간 클릭 시 onCycleChange("yearly") 가 호출된다', () => {
    const { onCycleChange } = renderToggle({ cycle: 'monthly' });
    fireEvent.click(screen.getByTestId('billing-cycle-toggle-yearly'));
    expect(onCycleChange).toHaveBeenCalledWith('yearly');
  });

  it('현재 활성 사이클을 다시 클릭하면 onCycleChange 가 호출되지 않는다', () => {
    const { onCycleChange } = renderToggle({ cycle: 'monthly' });
    fireEvent.click(screen.getByTestId('billing-cycle-toggle-monthly'));
    expect(onCycleChange).not.toHaveBeenCalled();
  });

  it('연간 버튼은 "20% 할인" 배지를 노출한다', () => {
    renderToggle();
    expect(screen.getByText('20% 할인')).toBeInTheDocument();
  });

  it('role="tablist" 와 role="tab" 가 적용된다', () => {
    renderToggle();
    expect(screen.getByTestId('billing-cycle-toggle').getAttribute('role')).toBe('tablist');
    expect(screen.getByTestId('billing-cycle-toggle-monthly').getAttribute('role')).toBe('tab');
    expect(screen.getByTestId('billing-cycle-toggle-yearly').getAttribute('role')).toBe('tab');
  });
});
