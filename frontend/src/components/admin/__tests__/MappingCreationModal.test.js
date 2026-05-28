/**
 * MappingCreationModal — P0 핫픽스 (2026-05-28) 가드 + STEP swap 회귀 테스트.
 *
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md
 *
 * 검증:
 *  - step 1 만 클릭 후 step 2 "다음" 버튼 disabled (내담자 미선택)
 *  - step 2 (내담자) 선택 후 step 3 "다음" 버튼 disabled (패키지 미선택)
 *  - 패키지 미선택 시 onMappingCreated 미호출, 알림은 error
 *  - 정상 흐름: onMappingCreated 호출 시 consultantId / clientId / packageName / totalSessions /
 *    packagePrice / paymentTiming 이 포함
 *  - 백엔드 POST body (`mappingData`) 에 `paymentTiming` 필드가 항상 포함
 *    (P0 핫픽스 2026-05-28 H1 회귀 가드: 누락 시 DB `payment_timing` NULL, 사이드바 분기 깨짐)
 *
 * @author MindGarden
 * @since 2026-05-28
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

jest.mock('react-i18next', () => {
  const stableT = (key, fallback) => (typeof fallback === 'string' ? fallback : key);
  return {
    __esModule: true,
    useTranslation: () => ({ t: stableT }),
    initReactI18next: { type: '3rdParty', init: jest.fn() }
  };
});

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => jest.fn()
}));

jest.mock('../../../utils/ajax', () => ({
  __esModule: true,
  apiGet: jest.fn().mockResolvedValue({ clients: [] }),
  apiPost: jest.fn().mockResolvedValue({ data: { id: 9001 } }),
  apiPut: jest.fn(),
  apiDelete: jest.fn()
}));

jest.mock('../../../utils/consultantHelper', () => ({
  __esModule: true,
  getAllConsultantsWithStats: jest.fn().mockResolvedValue([])
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('../../../utils/commonCodeApi', () => ({
  __esModule: true,
  getTenantCodes: jest.fn().mockResolvedValue([])
}));

jest.mock('../../../utils/safeDisplay', () => ({
  __esModule: true,
  toDisplayString: (v) => (v == null ? '' : String(v))
}));

jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children, actions, title }) => (
    isOpen ? (
      <div role="dialog" aria-label={title} data-testid="unified-modal-mock">
        {children}
        <div data-testid="modal-actions">{actions}</div>
      </div>
    ) : null
  )
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, type = 'button', className }) => (
    <button type={type} onClick={onClick} disabled={disabled} className={className}>{children}</button>
  )
}));

jest.mock('../../common/BadgeSelect', () => ({
  __esModule: true,
  default: ({ value, onChange, options = [] }) => (
    <select value={value || ''} onChange={(e) => onChange?.(e.target.value)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}));

jest.mock('../../common/Avatar', () => ({
  __esModule: true,
  default: () => <div data-testid="avatar-mock" />
}));

jest.mock('../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

jest.mock('../../dashboard-v2/atoms/SearchInput', () => ({
  __esModule: true,
  default: ({ value, onChange, placeholder }) => (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
    />
  )
}));

import MappingCreationModal from '../MappingCreationModal';
import { getAllConsultantsWithStats } from '../../../utils/consultantHelper';
import { getTenantCodes } from '../../../utils/commonCodeApi';
import { apiGet, apiPost } from '../../../utils/ajax';
import notificationManager from '../../../utils/notification';

const consultantFixture = [
  {
    consultant: {
      id: 11,
      name: '상담사A',
      email: 'a@example.com',
      phone: '',
      role: 'CONSULTANT',
      profileImageUrl: null
    },
    currentClients: 0,
    totalClients: 0
  }
];

const clientFixture = [{ id: 22, name: '내담자A', email: 'c@example.com', profileImageUrl: null }];

// `STANDARD`/`BASIC` 등 미리 정의된 codeValue 는 컴포넌트가 t() 로 label 을
// 덮어쓰므로 (i18n mock이 key 반환), 테스트는 fallback 라벨 경로를 사용한다.
const packageCodeFixture = [
  {
    codeValue: 'TEST_PKG',
    codeLabel: '표준 패키지',
    koreanName: '표준 패키지',
    extraData: JSON.stringify({ price: 300000, sessions: 5 })
  }
];

const renderModal = (overrides = {}) => {
  const props = {
    isOpen: true,
    onClose: jest.fn(),
    onMappingCreated: jest.fn(),
    ...overrides
  };
  const utils = render(<MappingCreationModal {...props} />);
  return { ...utils, props };
};

describe('MappingCreationModal — P0 핫픽스 + STEP swap', () => {
  beforeEach(() => {
    getAllConsultantsWithStats.mockReset();
    getAllConsultantsWithStats.mockResolvedValue(consultantFixture);
    apiGet.mockReset();
    apiGet.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('with-mapping-info')) {
        return Promise.resolve({ clients: clientFixture });
      }
      return Promise.resolve([]);
    });
    apiPost.mockReset();
    apiPost.mockResolvedValue({ data: { id: 9001 } });
    getTenantCodes.mockReset();
    getTenantCodes.mockImplementation((group) => {
      if (group === 'CONSULTATION_PACKAGE') return Promise.resolve(packageCodeFixture);
      return Promise.resolve([]);
    });
    notificationManager.success.mockClear();
    notificationManager.error.mockClear();
    notificationManager.warning.mockClear();
  });

  test('step 1 에서 상담사 미선택 시 "다음" 버튼 disabled', async () => {
    renderModal();
    await waitFor(() => expect(screen.getByText('상담사A')).toBeInTheDocument());
    const nextButton = screen.getByText('common:action.next');
    expect(nextButton).toBeDisabled();
  });

  test('step 2 에서 내담자 미선택 시 "다음" 버튼 disabled (swap 후)', async () => {
    renderModal();
    await waitFor(() => expect(screen.getByText('상담사A')).toBeInTheDocument());
    fireEvent.click(screen.getByText('상담사A'));
    await act(async () => {
      fireEvent.click(screen.getByText('common:action.next'));
    });
    await waitFor(() => expect(screen.getByText('내담자A')).toBeInTheDocument());
    const nextButton = screen.getByText('common:action.next');
    expect(nextButton).toBeDisabled();
  });

  test('step 3 에서 패키지 미선택 시 "다음" 버튼 disabled (default 패키지 제거)', async () => {
    renderModal();
    await waitFor(() => expect(screen.getByText('상담사A')).toBeInTheDocument());
    fireEvent.click(screen.getByText('상담사A'));
    await act(async () => {
      fireEvent.click(screen.getByText('common:action.next'));
    });
    await waitFor(() => expect(screen.getByText('내담자A')).toBeInTheDocument());
    fireEvent.click(screen.getByText('내담자A'));
    await act(async () => {
      fireEvent.click(screen.getByText('common:action.next'));
    });
    await waitFor(() => expect(screen.getByText('표준 패키지')).toBeInTheDocument());
    const nextButton = screen.getByText('common:action.next');
    expect(nextButton).toBeDisabled();
  });

  test('정상 흐름 → onMappingCreated 콜백에 consultantId/clientId/packageName/totalSessions/packagePrice 모두 포함', async () => {
    const onMappingCreated = jest.fn();
    renderModal({ onMappingCreated });

    await waitFor(() => expect(screen.getByText('상담사A')).toBeInTheDocument());
    fireEvent.click(screen.getByText('상담사A'));
    await act(async () => {
      fireEvent.click(screen.getByText('common:action.next'));
    });
    await waitFor(() => expect(screen.getByText('내담자A')).toBeInTheDocument());
    fireEvent.click(screen.getByText('내담자A'));
    await act(async () => {
      fireEvent.click(screen.getByText('common:action.next'));
    });
    await waitFor(() => expect(screen.getByText('표준 패키지')).toBeInTheDocument());
    fireEvent.click(screen.getByText('표준 패키지'));
    await act(async () => {
      fireEvent.click(screen.getByText('common:action.next'));
    });

    await waitFor(() => expect(screen.getByText('admin:mappingCreation.createMapping')).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByText('admin:mappingCreation.createMapping'));
    });

    await waitFor(() => expect(onMappingCreated).toHaveBeenCalledTimes(1));
    const payload = onMappingCreated.mock.calls[0][0];
    expect(payload).toMatchObject({
      mappingId: 9001,
      consultantId: 11,
      consultantName: '상담사A',
      clientId: 22,
      clientName: '내담자A',
      packageName: '표준 패키지',
      packagePrice: 300000,
      totalSessions: 5,
      paymentTiming: 'ADVANCE'
    });
  });

  // P0 핫픽스 2026-05-28 (PAYMENT_TIMING_NULL_DEBUG.md H1) 회귀 가드:
  // POST `/api/v1/admin/mappings` 페이로드에 `paymentTiming` 키가 항상 포함되어야 한다.
  // 누락 시 백엔드 Jackson 바인딩이 null 로 처리 → DB payment_timing NULL → 사이드바 SAME_DAY_CARD 분기 깨짐.
  test('ADVANCE 기본값 → apiPost mappingData 에 paymentTiming: "ADVANCE" 포함', async () => {
    renderModal();

    await waitFor(() => expect(screen.getByText('상담사A')).toBeInTheDocument());
    fireEvent.click(screen.getByText('상담사A'));
    await act(async () => {
      fireEvent.click(screen.getByText('common:action.next'));
    });
    await waitFor(() => expect(screen.getByText('내담자A')).toBeInTheDocument());
    fireEvent.click(screen.getByText('내담자A'));
    await act(async () => {
      fireEvent.click(screen.getByText('common:action.next'));
    });
    await waitFor(() => expect(screen.getByText('표준 패키지')).toBeInTheDocument());
    fireEvent.click(screen.getByText('표준 패키지'));
    await act(async () => {
      fireEvent.click(screen.getByText('common:action.next'));
    });

    await waitFor(() => expect(screen.getByText('admin:mappingCreation.createMapping')).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByText('admin:mappingCreation.createMapping'));
    });

    await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(1));
    const [, postedBody] = apiPost.mock.calls[0];
    expect(postedBody).toHaveProperty('paymentTiming', 'ADVANCE');
    expect(postedBody).toHaveProperty('consultantId', 11);
    expect(postedBody).toHaveProperty('clientId', 22);
    expect(postedBody).toHaveProperty('packageName', '표준 패키지');
  });

  test('SAME_DAY_CARD 선택 → apiPost mappingData 에 paymentTiming: "SAME_DAY_CARD" + remainingSessions: 0', async () => {
    renderModal();

    await waitFor(() => expect(screen.getByText('상담사A')).toBeInTheDocument());
    fireEvent.click(screen.getByText('상담사A'));
    await act(async () => {
      fireEvent.click(screen.getByText('common:action.next'));
    });
    await waitFor(() => expect(screen.getByText('내담자A')).toBeInTheDocument());
    fireEvent.click(screen.getByText('내담자A'));
    await act(async () => {
      fireEvent.click(screen.getByText('common:action.next'));
    });
    await waitFor(() => expect(screen.getByText('표준 패키지')).toBeInTheDocument());
    fireEvent.click(screen.getByText('표준 패키지'));
    await act(async () => {
      fireEvent.click(screen.getByText('common:action.next'));
    });

    // step 4 진입 후 SAME_DAY_CARD 라디오 선택
    await waitFor(() => expect(screen.getByText('admin:mappingCreation.createMapping')).toBeInTheDocument());
    const sameDayRadio = screen.getByDisplayValue('SAME_DAY_CARD');
    fireEvent.click(sameDayRadio);

    await act(async () => {
      fireEvent.click(screen.getByText('admin:mappingCreation.createMapping'));
    });

    await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(1));
    const [, postedBody] = apiPost.mock.calls[0];
    expect(postedBody).toHaveProperty('paymentTiming', 'SAME_DAY_CARD');
    // 옵션 B: 사후 카드 결제 시 신규 매칭에 회기 즉시 부여하지 않고 PENDING_PAYMENT 유지
    expect(postedBody).toHaveProperty('remainingSessions', 0);
    expect(postedBody).toHaveProperty('totalSessions', 5);
  });

  // 2026-05-28 카드형 결제 방식 선택 UI 회귀 가드
  // (MAPPING_PAYMENT_TIMING_CARD_SELECT_DESIGN.md)
  describe('결제 방식 카드형 선택 UI (2026-05-28)', () => {
    const advanceToStep4 = async () => {
      await waitFor(() => expect(screen.getByText('상담사A')).toBeInTheDocument());
      fireEvent.click(screen.getByText('상담사A'));
      await act(async () => {
        fireEvent.click(screen.getByText('common:action.next'));
      });
      await waitFor(() => expect(screen.getByText('내담자A')).toBeInTheDocument());
      fireEvent.click(screen.getByText('내담자A'));
      await act(async () => {
        fireEvent.click(screen.getByText('common:action.next'));
      });
      await waitFor(() => expect(screen.getByText('표준 패키지')).toBeInTheDocument());
      fireEvent.click(screen.getByText('표준 패키지'));
      await act(async () => {
        fireEvent.click(screen.getByText('common:action.next'));
      });
      await waitFor(() =>
        expect(screen.getByText('admin:mappingCreation.createMapping')).toBeInTheDocument()
      );
    };

    test('카드형 마크업이라도 native <input type="radio" value="SAME_DAY_CARD"> 가 보존되어야 함 (회귀 가드)', async () => {
      renderModal();
      await advanceToStep4();
      // sr-only 처리된 native radio input 이 DOM 에 남아 있어야 한다.
      const sameDayRadio = screen.getByDisplayValue('SAME_DAY_CARD');
      const advanceRadio = screen.getByDisplayValue('ADVANCE');
      expect(sameDayRadio).toBeInTheDocument();
      expect(advanceRadio).toBeInTheDocument();
      expect(sameDayRadio.tagName).toBe('INPUT');
      expect(sameDayRadio.getAttribute('type')).toBe('radio');
    });

    test('카드 click → paymentTiming state 가 카드 값으로 전환', async () => {
      renderModal();
      await advanceToStep4();
      // 기본 ADVANCE 가 selected
      const advanceCard = screen.getByTestId('payment-timing-card-ADVANCE');
      const sameDayCard = screen.getByTestId('payment-timing-card-SAME_DAY_CARD');
      expect(advanceCard.className).toContain('payment-timing-card--selected');
      expect(sameDayCard.className).not.toContain('payment-timing-card--selected');

      // SAME_DAY_CARD 카드 click → state 전환
      fireEvent.click(screen.getByDisplayValue('SAME_DAY_CARD'));

      expect(screen.getByTestId('payment-timing-card-SAME_DAY_CARD').className)
        .toContain('payment-timing-card--selected');
      expect(screen.getByTestId('payment-timing-card-ADVANCE').className)
        .not.toContain('payment-timing-card--selected');
    });

    test('Selected 카드에 CheckCircle 아이콘 노출 (Default 카드에는 미노출)', async () => {
      renderModal();
      await advanceToStep4();
      // 기본 ADVANCE selected → CheckCircle 표시
      expect(screen.getByTestId('payment-timing-card-check-ADVANCE')).toBeInTheDocument();
      expect(screen.queryByTestId('payment-timing-card-check-SAME_DAY_CARD')).toBeNull();

      // SAME_DAY_CARD 선택 시 CheckCircle 이 SAME_DAY_CARD 로 이동
      fireEvent.click(screen.getByDisplayValue('SAME_DAY_CARD'));
      expect(screen.getByTestId('payment-timing-card-check-SAME_DAY_CARD')).toBeInTheDocument();
      expect(screen.queryByTestId('payment-timing-card-check-ADVANCE')).toBeNull();
    });
  });
});
