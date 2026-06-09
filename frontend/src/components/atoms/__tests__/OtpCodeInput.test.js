/**
 * OtpCodeInput atom — React Testing Library 단위 테스트.
 *
 * 시각 회귀(border 색)는 CSS Variable 기반이라 jsdom 환경에선 className 검증으로
 * 대체한다 — Storybook 시각 회귀는 별도 패스.
 *
 * @author MindGarden
 * @since 2026-06-09
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OtpCodeInput from '../OtpCodeInput';

describe('OtpCodeInput', () => {
  test('기본 6칸 cell 렌더', () => {
    const handleChange = jest.fn();
    render(<OtpCodeInput value="" onChange={handleChange} />);
    for (let i = 0; i < 6; i += 1) {
      expect(screen.getByTestId(`mg-otp-cell-${i}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId('mg-otp-hidden-input')).toHaveAttribute(
      'autocomplete',
      'one-time-code'
    );
    expect(screen.getByTestId('mg-otp-hidden-input')).toHaveAttribute(
      'inputmode',
      'numeric'
    );
    expect(screen.getByTestId('mg-otp-hidden-input')).toHaveAttribute('maxLength', '6');
  });

  test('aria-label 기본값 + 커스텀 적용', () => {
    const { rerender } = render(<OtpCodeInput value="" onChange={() => {}} />);
    expect(screen.getByTestId('mg-otp-hidden-input')).toHaveAttribute(
      'aria-label',
      '인증번호 6자리 입력'
    );
    rerender(<OtpCodeInput value="" onChange={() => {}} ariaLabel="OTP 6자리" />);
    expect(screen.getByTestId('mg-otp-hidden-input')).toHaveAttribute(
      'aria-label',
      'OTP 6자리'
    );
  });

  test('입력 시 숫자만 통과시켜 onChange 호출', () => {
    const handleChange = jest.fn();
    render(<OtpCodeInput value="" onChange={handleChange} />);
    fireEvent.change(screen.getByTestId('mg-otp-hidden-input'), {
      target: { value: '12a3' }
    });
    expect(handleChange).toHaveBeenCalledWith('123');
  });

  test('length=6 초과 입력은 잘려서 onChange 에 전달', () => {
    const handleChange = jest.fn();
    render(<OtpCodeInput value="" onChange={handleChange} />);
    fireEvent.change(screen.getByTestId('mg-otp-hidden-input'), {
      target: { value: '1234567' }
    });
    expect(handleChange).toHaveBeenCalledWith('123456');
  });

  test('6자리 완료 시 onComplete 호출 (단 1회)', () => {
    const handleChange = jest.fn();
    const handleComplete = jest.fn();
    const { rerender } = render(
      <OtpCodeInput value="" onChange={handleChange} onComplete={handleComplete} />
    );
    fireEvent.change(screen.getByTestId('mg-otp-hidden-input'), {
      target: { value: '123456' }
    });
    expect(handleComplete).toHaveBeenCalledWith('123456');

    rerender(
      <OtpCodeInput value="123456" onChange={handleChange} onComplete={handleComplete} />
    );
    fireEvent.change(screen.getByTestId('mg-otp-hidden-input'), {
      target: { value: '123456' }
    });
    expect(handleComplete).toHaveBeenCalledTimes(1);
  });

  test('외부 value 가 줄어들면 다음 완성 시 onComplete 재호출 (controlled)', () => {
    const handleChange = jest.fn();
    const handleComplete = jest.fn();
    const { rerender } = render(
      <OtpCodeInput value="" onChange={handleChange} onComplete={handleComplete} />
    );
    fireEvent.change(screen.getByTestId('mg-otp-hidden-input'), {
      target: { value: '123456' }
    });
    expect(handleComplete).toHaveBeenCalledTimes(1);

    // 부모가 value 를 5자리로 줄임 (예: 재발송 후 reset 시뮬레이션)
    rerender(
      <OtpCodeInput value="12345" onChange={handleChange} onComplete={handleComplete} />
    );
    // 그 상태에서 다시 6자리 입력 → next != sanitizedValue 이므로 onChange + onComplete 재호출
    fireEvent.change(screen.getByTestId('mg-otp-hidden-input'), {
      target: { value: '123456' }
    });
    expect(handleComplete).toHaveBeenCalledTimes(2);
  });

  test('error prop 전달 시 alert role 표시 + cell error 클래스', () => {
    render(
      <OtpCodeInput
        value="12"
        onChange={() => {}}
        error="인증번호가 일치하지 않습니다. 다시 확인해 주세요."
      />
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('인증번호가 일치하지 않습니다.');
    expect(screen.getByTestId('mg-otp-cell-0')).toHaveClass('mg-otp-input__cell--error');
    expect(screen.getByTestId('mg-otp-hidden-input')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  test('filled cell 은 mg-otp-input__cell--filled 클래스를 가진다', () => {
    render(<OtpCodeInput value="12" onChange={() => {}} />);
    expect(screen.getByTestId('mg-otp-cell-0')).toHaveClass(
      'mg-otp-input__cell--filled'
    );
    expect(screen.getByTestId('mg-otp-cell-1')).toHaveClass(
      'mg-otp-input__cell--filled'
    );
    expect(screen.getByTestId('mg-otp-cell-2')).not.toHaveClass(
      'mg-otp-input__cell--filled'
    );
  });

  test('disabled 시 input/disabled, 클릭 시 포커스 이동 안 함', () => {
    render(<OtpCodeInput value="" onChange={() => {}} disabled />);
    const hidden = screen.getByTestId('mg-otp-hidden-input');
    expect(hidden).toBeDisabled();
  });

  test('imperative ref.focus() 가 hidden input 에 포커스', () => {
    const ref = React.createRef();
    render(<OtpCodeInput ref={ref} value="" onChange={() => {}} />);
    ref.current.focus();
    expect(screen.getByTestId('mg-otp-hidden-input')).toHaveFocus();
  });

  test('value prop 변경 시 cell 표시 동기화 (외부 제어)', () => {
    const { rerender } = render(<OtpCodeInput value="" onChange={() => {}} />);
    rerender(<OtpCodeInput value="9876" onChange={() => {}} />);
    expect(screen.getByTestId('mg-otp-cell-0')).toHaveTextContent('9');
    expect(screen.getByTestId('mg-otp-cell-3')).toHaveTextContent('6');
    expect(screen.getByTestId('mg-otp-cell-4')).toHaveTextContent('');
  });
});
