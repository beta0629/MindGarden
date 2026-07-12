import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mocks
jest.mock('react-i18next', () => {
  const stableT = (key, fallback) => (typeof fallback === 'string' ? fallback : key);
  return {
    __esModule: true,
    useTranslation: () => ({ t: stableT }),
    initReactI18next: { type: '3rdParty', init: jest.fn() }
  };
});

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn()
  }
}));

jest.mock('../../../utils/ajax', () => ({
  __esModule: true,
  apiGet: jest.fn(),
  apiPost: jest.fn()
}));

jest.mock('../../../utils/commonCodeApi', () => ({
  __esModule: true,
  getTenantCodes: jest.fn()
}));

jest.mock('../../../utils/consultantHelper', () => ({
  __esModule: true,
  getAllConsultantsWithStats: jest.fn().mockResolvedValue([])
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }
}));

jest.mock('../../layout/AdminCommonLayout', () => {
  return function MockAdminCommonLayout({ children }) {
    return <div data-testid="admin-common-layout">{children}</div>;
  };
});


import PackagePricingDetailPage from '../package-pricing/pages/PackagePricingDetailPage';
import MappingCreationModal from '../MappingCreationModal';
import StandardizedApi from '../../../utils/standardizedApi';
import { getTenantCodes } from '../../../utils/commonCodeApi';
import { apiGet, apiPost } from '../../../utils/ajax';
import { getAllConsultantsWithStats } from '../../../utils/consultantHelper';

describe('조합 패키지 생성 및 매칭 모달 정합성 검증 (E2E/Integration)', () => {
  const basePackages = [
    {
      codeValue: 'SINGLE_1',
      codeLabel: '1회 상담',
      koreanName: '1회 상담',
      extraData: JSON.stringify({ sessions: 1, price: 100000 })
    },
    {
      codeValue: 'PSYCH_TEST',
      codeLabel: '심리검사',
      koreanName: '심리검사',
      extraData: JSON.stringify({ sessions: 0, price: 50000 })
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    StandardizedApi.get.mockImplementation((url, params) => {
      if (params?.codeGroup === 'CONSULTATION_PACKAGE') {
        return Promise.resolve({ codes: basePackages });
      }
      return Promise.resolve({});
    });

    StandardizedApi.post.mockResolvedValue({ success: true });

    getAllConsultantsWithStats.mockResolvedValue([{
      consultant: { id: 1, name: '상담사A' },
      currentClients: 0,
      totalClients: 0
    }]);

    apiGet.mockImplementation((url) => {
      if (url.includes('with-mapping-info')) {
        return Promise.resolve({ clients: [{ id: 1, name: '내담자A' }] });
      }
      return Promise.resolve([]);
    });
  });

  test('1회 상담 + 심리검사 조합 패키지 생성 후 매칭 모달에서 금액/회기수 확인', async () => {
    let capturedPackagePayload = null;
    StandardizedApi.post.mockImplementation((url, payload) => {
      capturedPackagePayload = payload;
      return Promise.resolve({ success: true });
    });

    // 1. PackagePricingDetailPage 렌더링 및 조합 패키지 생성
    const { unmount } = render(
      <MemoryRouter initialEntries={['/admin/package-pricing/new']}>
        <Routes>
          <Route path="/admin/package-pricing/new" element={<PackagePricingDetailPage isNew={true} />} />
        </Routes>
      </MemoryRouter>
    );

    // 데이터 로드 대기
    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalled());

    // 기본 정보 입력
    const codeValueInput = screen.getByPlaceholderText('예: BASIC, SINGLE_80000');
    fireEvent.change(codeValueInput, { target: { value: 'COMBO_1' } });

    const nameInput = screen.getByPlaceholderText('패키지 한글명');
    fireEvent.change(nameInput, { target: { value: '1회 상담 + 심리검사 패키지' } });

    // 상품 추가 (1회 상담)
    const selectDropdown = screen.getByText('+ 상품 추가 (드롭다운)').parentElement;
    fireEvent.change(selectDropdown, { target: { value: 'SINGLE_1' } });
    
    // 상품 추가 (심리검사)
    fireEvent.change(selectDropdown, { target: { value: 'PSYCH_TEST' } });

    // 할인율 적용 (10%)
    const discountInput = screen.getByPlaceholderText('0');
    fireEvent.change(discountInput, { target: { value: '10' } });

    // 저장 버튼 클릭
    const saveButton = screen.getByText('저장');
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // API 전송 내용 확인
    expect(StandardizedApi.post).toHaveBeenCalled();
    expect(capturedPackagePayload).not.toBeNull();
    
    const extraData = JSON.parse(capturedPackagePayload.extraData);
    
    // 검증: 원래 100000 + 50000 = 150000. 10% 할인이면 135000원. 회기는 1 + 0 = 1회.
    expect(extraData.sessions).toBe(1);
    expect(extraData.price).toBe(135000);
    expect(extraData.items.length).toBe(2);

    unmount();

    // 2. MappingCreationModal 연동 확인
    // 새로 생성된 패키지를 포함하여 mock 설정
    const newPackageCode = {
      codeValue: capturedPackagePayload.codeValue,
      codeLabel: capturedPackagePayload.codeLabel,
      koreanName: capturedPackagePayload.koreanName,
      extraData: capturedPackagePayload.extraData
    };

    getTenantCodes.mockResolvedValue([...basePackages, newPackageCode]);

    render(
      <MemoryRouter>
        <MappingCreationModal 
          isOpen={true} 
          onClose={() => {}} 
          onMappingCreated={() => {}} 
        />
      </MemoryRouter>
    );

    // Step 1: 상담사 선택
    await waitFor(() => expect(screen.getByText('상담사A')).toBeInTheDocument());
    fireEvent.click(screen.getByText('상담사A'));
    await act(async () => {
      fireEvent.click(screen.getByText('common:action.next'));
    });

    // Step 2: 내담자 선택
    await waitFor(() => expect(screen.getByText('내담자A')).toBeInTheDocument());
    fireEvent.click(screen.getByText('내담자A'));
    await act(async () => {
      fireEvent.click(screen.getByText('common:action.next'));
    });

    // Step 3: 패키지 선택
    await waitFor(() => expect(screen.getByText(/1회 상담 \+ 심리검사 패키지/)).toBeInTheDocument());
    
    // 셀렉트 박스에서 방금 만든 패키지 선택. 
    // MappingCreationModal.js 에서는 BadgeSelect를 사용하므로 해당 값을 찾아 클릭 (여기선 option 텍스트로 찾거나 value 로 change 발생)
    const packageSelect = screen.getByText('1회 상담 + 심리검사 패키지 (1회, 135,000원)').parentElement;
    fireEvent.change(packageSelect, { target: { value: 'COMBO_1' } });

    await act(async () => {
      fireEvent.click(screen.getByText('common:action.next'));
    });

    // Step 4: 결제 화면에서 올바른 회기수와 금액이 표시되는지 확인
    await waitFor(() => expect(screen.getByText('admin:mappingCreation.step.payment')).toBeInTheDocument());

    // 금액과 회기 표시 검증 (MappingCreationModal.js 에서는 1회, 135,000원으로 표시됨)
    expect(screen.getByText('admin:mappingCreation.sessionUnit')).toBeInTheDocument(); // totalSessions 값으로 렌더링되는데 t() mock 으로 인해 'admin:mappingCreation.sessionUnit' 이 표시될 수 있음. 실제 텍스트 검증
    // MappingCreationModal.js 844: {paymentInfo.packagePrice?.toLocaleString()}{t('admin:mappingCreation.currency')}
    // 135,000 이 DOM 에 있는지 확인
    expect(screen.getByText(/135,000/)).toBeInTheDocument();
    
    // MappingCreationModal.js 834: {paymentInfo.totalSessions}회
    // 1회 가 DOM 에 있는지 확인 (summary segment)
    const summarySessions = screen.getByText(/1회/);
    expect(summarySessions).toBeInTheDocument();

  });
});
