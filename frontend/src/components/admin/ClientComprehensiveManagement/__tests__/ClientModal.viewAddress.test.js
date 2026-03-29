/**
 * 내담자 모달 조회(view) 시 주소 필드 표시·주소 검색 비활성
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ClientModal from '../ClientModal';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ isDuplicate: false }))
  }
}));

const formWithAddress = {
  name: '홍길동',
  email: 'a@b.com',
  password: '',
  phone: '010-0000-0000',
  status: 'ACTIVE',
  grade: 'BRONZE',
  notes: '',
  profileImageUrl: '',
  rrnFirst6: '',
  rrnLast1: '',
  address: '서울특별시 강남구 테헤란로',
  addressDetail: '101동 202호',
  postalCode: '06234',
  vehiclePlate: ''
};

describe('ClientModal 조회 모드 주소', () => {
  it('view에서 저장된 주소·상세·우편번호가 입력란에 보이고 주소 검색 버튼은 비활성', () => {
    render(
      <ClientModal
        type="view"
        client={null}
        formData={formWithAddress}
        setFormData={jest.fn()}
        onClose={jest.fn()}
        onSave={jest.fn()}
        userStatusOptions={[]}
      />
    );

    expect(screen.getByDisplayValue('서울특별시 강남구 테헤란로')).toBeInTheDocument();
    expect(screen.getByDisplayValue('101동 202호')).toBeInTheDocument();
    expect(screen.getByDisplayValue('06234')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /주소 검색/i })).toBeDisabled();
  });
});
