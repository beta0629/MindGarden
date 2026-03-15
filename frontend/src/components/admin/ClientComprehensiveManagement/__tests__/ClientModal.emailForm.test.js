/**
 * ClientModal 이메일 폼 구조 검증 (코어 테스트)
 * - 이메일 행에 래퍼(.mg-v2-form-email-row__input-wrap) + input이 있어야 레이아웃 깨짐 방지
 * - 내담자/상담사/스태프 등록 모달 공통 구조 회귀 방지
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ClientModal from '../ClientModal';

jest.mock('../../../../utils/ajax', () => ({
  apiGet: jest.fn(() => Promise.resolve({ isDuplicate: false }))
}));

const defaultProps = {
  type: 'create',
  client: null,
  formData: {
    name: '',
    email: '',
    password: '',
    phone: '',
    status: 'ACTIVE',
    grade: 'BRONZE',
    notes: '',
    profileImageUrl: '',
    rrnFirst6: '',
    rrnLast1: '',
    address: '',
    addressDetail: '',
    postalCode: ''
  },
  setFormData: jest.fn(),
  onClose: jest.fn(),
  onSave: jest.fn(),
  userStatusOptions: []
};

describe('ClientModal 이메일 폼 구조', () => {
  it('이메일 행에 .mg-v2-form-email-row가 렌더된다', () => {
    render(<ClientModal {...defaultProps} />);
    const row = document.querySelector('.mg-v2-form-email-row');
    expect(row).toBeInTheDocument();
  });

  it('이메일 행 내부에 래퍼 .mg-v2-form-email-row__input-wrap가 있어야 레이아웃이 깨지지 않는다', () => {
    render(<ClientModal {...defaultProps} />);
    const wrap = document.querySelector('.mg-v2-form-email-row__input-wrap');
    expect(wrap).toBeInTheDocument();
    const row = document.querySelector('.mg-v2-form-email-row');
    expect(row).toContainElement(wrap);
  });

  it('이메일 input이 래퍼 안에 있고, placeholder가 노출된다', () => {
    render(<ClientModal {...defaultProps} />);
    const input = screen.getByPlaceholderText(/example@email\.com/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
    const wrap = document.querySelector('.mg-v2-form-email-row__input-wrap');
    expect(wrap).toContainElement(input);
  });

  it('create 타입일 때 중복확인 버튼이 있다', () => {
    render(<ClientModal {...defaultProps} />);
    const button = screen.getByRole('button', { name: /중복확인/i });
    expect(button).toBeInTheDocument();
  });
});
