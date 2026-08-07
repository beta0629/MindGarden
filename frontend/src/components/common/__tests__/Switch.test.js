/**
 * Switch Atom — role=switch, aria-checked, 클릭/disabled 단위 테스트
 *
 * @author Core Solution
 * @since 2026-08-07
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Switch from '../Switch';

describe('Switch', () => {
  it('role=switch 와 aria-checked 를 checked prop 에 맞게 렌더한다', () => {
    const { rerender } = render(<Switch checked={false} ariaLabel="테스트 토글" />);

    const sw = screen.getByRole('switch', { name: '테스트 토글' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(sw).toHaveClass('mg-v2-switch--off');

    rerender(<Switch checked ariaLabel="테스트 토글" />);
    expect(screen.getByRole('switch', { name: '테스트 토글' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByRole('switch', { name: '테스트 토글' })).toHaveClass('mg-v2-switch--on');
  });

  it('클릭 시 onCheckedChange 에 반전된 boolean 을 전달한다', () => {
    const onCheckedChange = jest.fn();
    render(
      <Switch checked={false} onCheckedChange={onCheckedChange} ariaLabel="알림 토글" />
    );

    fireEvent.click(screen.getByRole('switch', { name: '알림 토글' }));

    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('checked=true 에서 클릭하면 onCheckedChange(false) 를 호출한다', () => {
    const onCheckedChange = jest.fn();
    render(
      <Switch checked onCheckedChange={onCheckedChange} ariaLabel="알림 토글" />
    );

    fireEvent.click(screen.getByRole('switch', { name: '알림 토글' }));

    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it('disabled 이면 클릭해도 onCheckedChange 를 호출하지 않는다', () => {
    const onCheckedChange = jest.fn();
    render(
      <Switch
        checked={false}
        disabled
        onCheckedChange={onCheckedChange}
        ariaLabel="비활성 토글"
      />
    );

    const sw = screen.getByRole('switch', { name: '비활성 토글' });
    expect(sw).toBeDisabled();
    fireEvent.click(sw);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('checkbox role 이 아니다', () => {
    render(<Switch checked={false} ariaLabel="역할 검증" />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByRole('switch', { name: '역할 검증' })).toBeInTheDocument();
  });
});
