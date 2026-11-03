/**
 * SalaryProfileFormModal P0 — 폴백 옵션·StandardizedApi 성공 판정·검증·서버 오류 토스트
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SalaryProfileFormModal from '../SalaryProfileFormModal';
import { SPFM } from '../../../constants/salaryProfileFormModalStrings';

const mockPost = jest.fn();
const mockPut = jest.fn();
const mockGet = jest.fn();
const mockGetCommonCodes = jest.fn();
const mockShowNotification = jest.fn();

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
    put: (...args) => mockPut(...args)
  }
}));

jest.mock('../../../utils/commonCodeApi', () => ({
  __esModule: true,
  getCommonCodes: (...args) => mockGetCommonCodes(...args)
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  showNotification: (...args) => mockShowNotification(...args)
}));

jest.mock('../../../utils/commonCodeUtils', () => ({
  __esModule: true,
  getGradeSalaryMap: jest.fn(async() => ({ CONSULTANT_JUNIOR: 30000 })),
  getGradeKoreanName: jest.fn(async(grade) => grade)
}));

jest.mock('../../../utils/userFacingApiErrorMessage', () => ({
  __esModule: true,
  resolveUserFacingApiErrorMessage: (error, fallback) =>
    (error && error.message) ? error.message : fallback
}));

jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children, title }) => (isOpen ? (
    <div data-testid="unified-modal">
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  ) : null)
}));

jest.mock('../../common/BadgeSelect', () => ({
  __esModule: true,
  default: ({ value, onChange, options, disabled }) => (
    <select
      data-testid={`badge-select-${options?.[1]?.value || 'field'}`}
      aria-label={options?.[0]?.label || 'select'}
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {(options || []).map((opt) => (
        <option key={String(opt.value)} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, loading, type = 'button' }) => (
    <button type={type} onClick={onClick} disabled={disabled || loading}>
      {children}
    </button>
  )
}));

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: () => <div data-testid="loading" />
}));

jest.mock('../common', () => ({
  __esModule: true,
  ErpSafeText: ({ value }) => <span>{value == null ? '' : String(value)}</span>,
  ErpSafeNumber: ({ value }) => <span>{value == null ? '' : String(value)}</span>,
  ERP_NUMBER_FORMAT: { CURRENCY: 'currency' }
}));

jest.mock('../common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'erp-btn',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중'
}));

const consultant = {
  id: 22,
  name: '테스트상담사',
  grade: 'CONSULTANT_JUNIOR'
};

describe('SalaryProfileFormModal P0', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue(null);
    mockGetCommonCodes.mockImplementation(async(group) => {
      if (group === 'SALARY_TYPE' || group === 'SALARY_OPTION_TYPE' || group === 'CONSULTANT_GRADE') {
        return [];
      }
      return [];
    });
  });

  test('빈 테넌트 코드 → 폴백 급여 유형 옵션 표시', async() => {
    render(
      <SalaryProfileFormModal
        isOpen
        onClose={jest.fn()}
        consultant={consultant}
        onSave={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const salaryTypeSelect = screen.getByLabelText(SPFM.SALARY_TYPE_PLACEHOLDER);
    expect(salaryTypeSelect).toBeInTheDocument();
    const optionTexts = Array.from(salaryTypeSelect.querySelectorAll('option')).map((o) => o.textContent);
    expect(optionTexts).toEqual(expect.arrayContaining(['프리랜서', '정규직']));
  });

  test('StandardizedApi가 data만 반환해도 저장 성공·토스트·모달 닫힘', async() => {
    const onClose = jest.fn();
    const onSave = jest.fn();
    const savedEntity = { id: 501, consultantId: 22, salaryType: 'FREELANCE' };
    mockPost.mockResolvedValue(savedEntity);

    render(
      <SalaryProfileFormModal
        isOpen
        onClose={onClose}
        consultant={consultant}
        onSave={onSave}
      />
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: SPFM.BTN_SAVE }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });
    expect(mockShowNotification).toHaveBeenCalledWith(SPFM.TOAST_PROFILE_CREATED, 'success');
    expect(onSave).toHaveBeenCalledWith(savedEntity);
    expect(onClose).toHaveBeenCalled();
  });

  test('서버 오류 문구를 토스트에 표시', async() => {
    mockPost.mockRejectedValue(new Error('허용되지 않은 급여 유형입니다.'));

    render(
      <SalaryProfileFormModal
        isOpen
        onClose={jest.fn()}
        consultant={consultant}
        onSave={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: SPFM.BTN_SAVE }));

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        '허용되지 않은 급여 유형입니다.',
        'error'
      );
    });
  });

  test('등급 미변경·옵션 금액만 변경 → PUT에 기존·변경 옵션 유지, 수정 성공 토스트', async() => {
    mockGet.mockResolvedValue({
      id: 77,
      consultantId: 22,
      salaryType: 'FREELANCE',
      baseSalary: 30000,
      grade: 'CONSULTANT_JUNIOR',
      optionTypes: [
        { type: 'FAMILY_CONSULTATION', amount: '3000.00', name: '가족' },
        { type: 'INITIAL_CONSULTATION', amount: '5000.00', name: '초기' }
      ]
    });
    mockPut.mockResolvedValue({ id: 77, consultantId: 22, salaryType: 'FREELANCE' });
    const onClose = jest.fn();

    render(
      <SalaryProfileFormModal isOpen onClose={onClose} consultant={consultant} onSave={jest.fn()} />
    );
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText(SPFM.PLACEHOLDER_AMOUNT)).toHaveLength(2);
    });
    const amounts = screen.getAllByPlaceholderText(SPFM.PLACEHOLDER_AMOUNT);
    expect(amounts[0]).toHaveValue(3000);
    fireEvent.change(amounts[1], { target: { value: '8000' } });
    fireEvent.click(screen.getByRole('button', { name: SPFM.BTN_SAVE }));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalled();
    });
    const body = mockPut.mock.calls[0][1];
    expect(body.options).toEqual([
      { type: 'FAMILY_CONSULTATION', amount: 3000, name: '가족' },
      { type: 'INITIAL_CONSULTATION', amount: 8000, name: '초기' }
    ]);
    expect(mockShowNotification).toHaveBeenCalledWith(SPFM.TOAST_PROFILE_UPDATED, 'success');
    expect(onClose).toHaveBeenCalled();
  });

  test('salaryType 빈 값이면 저장 차단·필드 오류', async() => {
    render(
      <SalaryProfileFormModal
        isOpen
        onClose={jest.fn()}
        consultant={consultant}
        onSave={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const salaryTypeSelect = screen.getByLabelText(SPFM.SALARY_TYPE_PLACEHOLDER);
    fireEvent.change(salaryTypeSelect, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: SPFM.BTN_SAVE }));

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(SPFM.TOAST_SALARY_TYPE_REQUIRED, 'error');
    });
    expect(mockPost).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(SPFM.TOAST_SALARY_TYPE_REQUIRED);
  });
});
