/**
 * SettingSwitchRow Molecule — 라벨/상태 렌더 + Switch 토글 콜백 단위 테스트
 *
 * @author Core Solution
 * @since 2026-08-07
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SettingSwitchRow from '../SettingSwitchRow';

describe('SettingSwitchRow', () => {
  it('라벨·힌트·상태 라벨을 렌더하고 Switch 가 aria-checked 를 반영한다', () => {
    render(
      <SettingSwitchRow
        label="중복 로그인 허용"
        hint="다른 기기 동시 접속을 허용합니다"
        statusLabel="켜짐"
        checked
        data-testid="dup-toggle"
      />
    );

    expect(screen.getByText('중복 로그인 허용')).toBeInTheDocument();
    expect(screen.getByText('다른 기기 동시 접속을 허용합니다')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('켜짐');
    expect(screen.getByTestId('dup-toggle-row')).toBeInTheDocument();

    const sw = screen.getByTestId('dup-toggle');
    expect(sw).toHaveAttribute('role', 'switch');
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('토글 클릭 시 onCheckedChange 를 호출한다', () => {
    const onCheckedChange = jest.fn();
    render(
      <SettingSwitchRow
        label="웰니스 자동 발송"
        statusLabel="꺼짐"
        checked={false}
        onCheckedChange={onCheckedChange}
        data-testid="wellness-toggle"
      />
    );

    fireEvent.click(screen.getByTestId('wellness-toggle'));

    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('ariaLabel 이 없으면 라벨을 Switch aria-label 로 사용한다', () => {
    render(
      <SettingSwitchRow label="세션 보안" checked={false} />
    );

    expect(screen.getByRole('switch', { name: '세션 보안' })).toBeInTheDocument();
  });

  it('disabled 이면 Switch 가 비활성이고 콜백이 호출되지 않는다', () => {
    const onCheckedChange = jest.fn();
    render(
      <SettingSwitchRow
        label="저장 중"
        checked
        disabled
        onCheckedChange={onCheckedChange}
        data-testid="saving-toggle"
      />
    );

    const sw = screen.getByTestId('saving-toggle');
    expect(sw).toBeDisabled();
    fireEvent.click(sw);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('meta 가 있으면 메타 문구를 표시한다', () => {
    render(
      <SettingSwitchRow
        label="스케줄러"
        meta="마지막 변경: SYSTEM"
        checked={false}
      />
    );

    expect(screen.getByText('마지막 변경: SYSTEM')).toBeInTheDocument();
  });
});
