/**
 * ConsultantProfileModal 급여 저장 — 등급 PUT 언랩 응답 성공 판정·옵션 유지·실제 오류 사유 노출
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConsultantProfileModal from '../ConsultantProfileModal';

const mockGet = jest.fn();
const mockPut = jest.fn();
const mockPost = jest.fn();
const mockShow = jest.fn();

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: (...a) => mockGet(...a),
    put: (...a) => mockPut(...a),
    post: (...a) => mockPost(...a)
  }
}));
jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: (...a) => mockShow(...a) }
}));
jest.mock('../../../utils/commonCodeUtils', () => ({
  __esModule: true,
  getGradeSalaryMap: jest.fn(async() => ({ CONSULTANT_JUNIOR: 30000, CONSULTANT_SENIOR: 40000 })),
  getGradeKoreanName: jest.fn(async(g) => g)
}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children }) => (isOpen ? <div>{children}</div> : null)
}));
jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, type = 'button' }) => (
    <button type={type} onClick={onClick} disabled={disabled}>{children}</button>
  )
}));
jest.mock('../../common/UnifiedLoading', () => ({ __esModule: true, default: () => <div data-testid="loading" /> }));
jest.mock('../common', () => ({
  __esModule: true,
  ErpSafeText: ({ value }) => <span>{value == null ? '' : String(value)}</span>,
  ErpSafeNumber: ({ value }) => <span>{value == null ? '' : String(value)}</span>,
  ERP_NUMBER_FORMAT: { CURRENCY: 'currency' }
}));

const consultant = { id: 22, name: '테스트상담사', grade: 'CONSULTANT_JUNIOR' };
const profile = {
  id: 77,
  consultantId: 22,
  salaryType: 'FREELANCE',
  baseSalary: 30000,
  grade: 'CONSULTANT_JUNIOR',
  optionTypes: [
    { type: 'FAMILY_CONSULTATION', amount: '3000.00', name: '가족' },
    { type: 'INITIAL_CONSULTATION', amount: '5000.00', name: '초기' }
  ]
};

const setupGet = () => mockGet.mockImplementation(async(url) => {
  if (/grades/i.test(url)) {
    return [{ codeValue: 'CONSULTANT_JUNIOR', codeLabel: '주니어' }, { codeValue: 'CONSULTANT_SENIOR', codeLabel: '시니어' }];
  }
  if (/option/i.test(url)) return [];
  if (/codes/i.test(url)) return [{ codeValue: 'FREELANCE', codeLabel: '프리랜서' }];
  return profile;
});

const openForm = async() => {
  render(<ConsultantProfileModal isOpen onClose={jest.fn()} consultant={{ ...consultant }} onSuccess={jest.fn()} />);
  const edit = await screen.findByRole('button', { name: '수정' });
  fireEvent.click(edit);
  await waitFor(() => expect(document.querySelector('form.salary-profile-form')).not.toBeNull());
};

describe('ConsultantProfileModal 급여 저장', () => {
  beforeEach(() => { jest.clearAllMocks(); setupGet(); });

  test('등급 미변경 → 등급 PUT 없이 저장, 문자열 금액 옵션 유지·성공 토스트', async() => {
    mockPut.mockResolvedValue({ id: 77 });
    await openForm();
    fireEvent.submit(document.querySelector('form.salary-profile-form'));
    await waitFor(() => expect(mockPut).toHaveBeenCalledTimes(1));
    const [url, body] = mockPut.mock.calls[0];
    expect(url).toMatch(/profiles\/77$/);
    expect(body.options).toEqual([
      { type: 'FAMILY_CONSULTATION', amount: 3000, name: '가족' },
      { type: 'INITIAL_CONSULTATION', amount: 5000, name: '초기' }
    ]);
    await waitFor(() => expect(mockShow).toHaveBeenCalledWith('급여 프로필이 성공적으로 저장되었습니다.', 'info'));
  });

  test('등급 PUT이 {id,name,grade}만 반환해도 성공 → 급여 PUT 전송', async() => {
    mockPut.mockImplementation(async(url) => (/grade/.test(url)
      ? { id: 22, name: '테스트상담사', grade: 'CONSULTANT_SENIOR' }
      : { id: 77 }));
    await openForm();
    const gradeSelect = screen.getAllByRole('combobox').find((s) => [...s.options].some((o) => o.value === 'CONSULTANT_SENIOR'));
    fireEvent.change(gradeSelect, { target: { value: 'CONSULTANT_SENIOR' } });
    await waitFor(() => expect(gradeSelect).toHaveValue('CONSULTANT_SENIOR'));
    fireEvent.submit(document.querySelector('form.salary-profile-form'));
    await waitFor(() => expect(mockPut).toHaveBeenCalledTimes(2));
    expect(mockPut.mock.calls[1][0]).toMatch(/profiles\/77$/);
    expect(mockShow).not.toHaveBeenCalledWith('상담사 등급 업데이트에 실패했습니다.', 'error');
  });

  test('저장 실패 시 서버 사유를 error 토스트로 노출', async() => {
    const err = new Error('급여 옵션 형식이 올바르지 않습니다(유형 필수, 금액 0 이상).');
    mockPut.mockRejectedValue(err);
    await openForm();
    fireEvent.submit(document.querySelector('form.salary-profile-form'));
    await waitFor(() => expect(mockShow).toHaveBeenCalledWith(expect.stringContaining('급여 옵션 형식'), 'error'));
  });
});
