/**
 * ClientModal 이메일 폼 구조 검증 (코어 테스트)
 * - 이메일 행에 래퍼(.mg-v2-form-email-row__input-wrap) + input이 있어야 레이아웃 깨짐 방지
 * - 내담자/상담사/스태프 등록 모달 공통 구조 회귀 방지
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import ClientModal from '../ClientModal';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ isDuplicate: false }))
  }
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
    postalCode: '',
    vehiclePlate: ''
  },
  setFormData: jest.fn(),
  onClose: jest.fn(),
  onSave: jest.fn(),
  userStatusOptions: []
};

/** 휴대폰 행(KoreanMobileDuplicateField)도 동일 클래스를 쓰므로, 이메일 필드로 행을 특정한다. */
function getEmailFormRow() {
  const input = screen.getByPlaceholderText(/example@email\.com/i);
  const row = input.closest('.mg-v2-form-email-row');
  expect(row).toBeInTheDocument();
  return row;
}

describe('ClientModal 이메일 폼 구조', () => {
  it('이메일 행에 .mg-v2-form-email-row가 렌더된다', () => {
    render(<ClientModal {...defaultProps} />);
    expect(getEmailFormRow()).toHaveClass('mg-v2-form-email-row');
  });

  it('이메일 행 내부에 래퍼 .mg-v2-form-email-row__input-wrap가 있어야 레이아웃이 깨지지 않는다', () => {
    render(<ClientModal {...defaultProps} />);
    const row = getEmailFormRow();
    const wrap = row.querySelector('.mg-v2-form-email-row__input-wrap');
    expect(wrap).toBeInTheDocument();
    expect(row).toContainElement(wrap);
  });

  it('이메일 input이 래퍼 안에 있고, placeholder가 노출된다', () => {
    render(<ClientModal {...defaultProps} />);
    const input = screen.getByPlaceholderText(/example@email\.com/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
    const wrap = input.closest('.mg-v2-form-email-row__input-wrap');
    expect(wrap).toBeInTheDocument();
    expect(wrap).toContainElement(input);
  });

  it('create 타입일 때 이메일 행에 중복확인 버튼이 있다', () => {
    render(<ClientModal {...defaultProps} />);
    const button = within(getEmailFormRow()).getByRole('button', { name: /중복확인/i });
    expect(button).toHaveAttribute('data-action', 'email-duplicate-check');
  });
});
