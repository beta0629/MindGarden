/**
 * ForgotPassword — 이메일|휴대폰 탭 전환 정적·단위 계약.
 *
 * @author MindGarden
 * @since 2026-11-01
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    post: jest.fn()
  }
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../common/MGButton', () => {
  const React = require('react');
  return function MockMGButton({ children, ...props }) {
    return React.createElement('button', props, children);
  };
});

jest.mock('../../erp/common/erpMgButtonProps', () => ({
  buildErpMgButtonClassName: () => 'mock-erp-btn',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중'
}));

import ForgotPassword from '../ForgotPassword';

describe('ForgotPassword 이메일|휴대폰 탭', () => {
  const renderPage = () =>
    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(ForgotPassword, null)
      )
    );

  test('기본은 이메일 폼·재설정 링크 전송 버튼', () => {
    renderPage();
    expect(screen.getByRole('tab', { name: '이메일' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('이메일 주소')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '재설정 링크 전송' })).toBeInTheDocument();
  });

  test('휴대폰 탭 전환 시 번호 입력·인증번호 전송', () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: '휴대폰' }));
    expect(screen.getByRole('tab', { name: '휴대폰' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('휴대폰 번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '인증번호 전송' })).toBeInTheDocument();
  });

  test('소스에 SMS API 상수와 StandardizedApi 사용', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.resolve(__dirname, '..', 'ForgotPassword.js'),
      'utf8'
    );
    expect(source).toMatch(/PASSWORD_RESET_SMS_SEND_OTP/);
    expect(source).toMatch(/PASSWORD_RESET_SMS_VERIFY_OTP/);
    expect(source).toMatch(/PASSWORD_RESET_SMS_SEND_TEMP/);
    expect(source).toMatch(/StandardizedApi\.post/);
    expect(source).not.toMatch(/from ['"].*ajax['"]/);
  });
});
