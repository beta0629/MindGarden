/**
 * MappingListBlock — SidePeekShell stub 연동 테스트 (table default)
 *
 * @author CoreSolution
 * @since 2026-07-02
 */

import React, { useState, useCallback } from 'react';
import { render, screen, fireEvent, within, act } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key) => {
      const map = {
        'admin.labels.status': '상태',
        'admin.labels.consultant': '상담사',
        'admin.labels.client': '내담자',
        'common.labels.schedule': '스케줄',
        'common.actions.edit': '수정',
        'admin.actions.paymentConfirm': '결제 확인'
      };
      return map[key] || key;
    }
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => jest.fn()
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, title }) => (
    <button type="button" onClick={onClick} title={title}>
      {children}
    </button>
  )
}));

jest.mock('../../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'mock-erp-class',
  ERP_MG_BUTTON_LOADING_TEXT: 'loading...'
}));

jest.mock('../../mapping/MappingPaymentModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../mapping/MappingDepositModal', () => ({
  __esModule: true,
  default: () => null
}));

import MappingListBlock, { MAPPING_LIST_DEFAULT_VIEW_MODE } from '../organisms/MappingListBlock';
import SidePeekShell from '../../../common/organisms/SidePeekShell';
import MappingScheduleSidePeekContent from '../integrated-schedule/molecules/MappingScheduleSidePeekContent';
import { SIDE_PEEK_SHELL_REGION_PEEK } from '../../../../constants/sidePeekShellConstants';
import { buildViewModeStorageKey } from '../../../../hooks/useViewModePreference';
import { MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID } from '../../../../constants/mappingManagementSavedViewConstants';

const SAMPLE_MAPPING = {
  id: 501,
  consultantId: 11,
  clientId: 22,
  consultantName: '김상담',
  clientName: '이내담',
  status: 'ACTIVE',
  packageName: '기본 패키지',
  packagePrice: 500000,
  totalSessions: 10,
  usedSessions: 2,
  remainingSessions: 8,
  createdAt: '2026-01-15T00:00:00.000Z'
};

const noopStatusHelpers = {
  getStatusKoreanName: (status) => status,
  getStatusColor: () => 'var(--mg-success-500)',
  getStatusIcon: () => null,
  getStatusIconComponent: () => null,
  getStatusVariant: () => 'success'
};

const MappingPeekHarness = ({ mappings = [SAMPLE_MAPPING] }) => {
  const [peekMapping, setPeekMapping] = useState(null);
  const handleMappingPeek = useCallback((mapping) => {
    setPeekMapping(mapping);
  }, []);
  const handleClosePeek = useCallback(() => {
    setPeekMapping(null);
  }, []);

  return (
    <div className="mapping-management__peek-layout mapping-management__peek-layout--peek-open">
      <div className="mapping-management__main-region" data-region="R-MAIN">
        <MappingListBlock
          mappings={mappings}
          mappingStatusInfo={{}}
          {...noopStatusHelpers}
          onView={handleMappingPeek}
          onEdit={jest.fn()}
          onRefund={jest.fn()}
        />
      </div>
      <SidePeekShell
        isOpen={Boolean(peekMapping)}
        onClose={handleClosePeek}
        title="상세"
        ariaLabel={
          peekMapping
            ? `${peekMapping.clientName || '매칭'} 상세`
            : '상세'
        }
      >
        <MappingScheduleSidePeekContent mapping={peekMapping} />
      </SidePeekShell>
    </div>
  );
};

describe('MappingListBlock — SidePeekShell stub', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('default viewMode는 table (테이블 렌더)', () => {
    expect(MAPPING_LIST_DEFAULT_VIEW_MODE).toBe('table');

    render(
      <MappingListBlock
        mappings={[SAMPLE_MAPPING]}
        mappingStatusInfo={{}}
        {...noopStatusHelpers}
        onView={jest.fn()}
      />
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '카드 뷰' })).toBeInTheDocument();
  });

  test('localStorage에 저장된 viewMode를 복원한다', () => {
    const storageKey = buildViewModeStorageKey({}, MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID);
    localStorage.setItem(storageKey, 'card');

    render(
      <MappingListBlock
        mappings={[SAMPLE_MAPPING]}
        mappingStatusInfo={{}}
        {...noopStatusHelpers}
        onView={jest.fn()}
      />
    );

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(document.querySelector('.mg-v2-mapping-list-block__grid')).toBeInTheDocument();
  });

  test('table 행 클릭 → R-PEEK 패널 오픈 + stub 본문', async() => {
    render(<MappingPeekHarness />);

    const row = screen.getByText('이내담').closest('tr');
    await act(async() => {
      fireEvent.click(row);
    });

    const peekPanel = screen.getByRole('complementary', { name: '이내담 상세' });
    expect(peekPanel).toHaveAttribute('data-region', SIDE_PEEK_SHELL_REGION_PEEK);
    expect(within(peekPanel).getByText('이내담')).toBeInTheDocument();
    expect(within(peekPanel).getByText('김상담')).toBeInTheDocument();
    expect(within(peekPanel).getByText(/Side Peek MVP/)).toBeInTheDocument();
  });

  test('overflow 「상세」 → peek 오픈', async() => {
    render(<MappingPeekHarness />);

    await act(async() => {
      fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    });

    await act(async() => {
      fireEvent.click(await screen.findByRole('menuitem', { name: '상세' }));
    });

    expect(screen.getByRole('complementary', { name: '이내담 상세' })).toBeInTheDocument();
  });

  test('peek 닫기 → 패널 hidden', async() => {
    const { container } = render(<MappingPeekHarness />);

    const row = screen.getByText('이내담').closest('tr');
    await act(async() => {
      fireEvent.click(row);
    });

    await act(async() => {
      fireEvent.click(screen.getByRole('button', { name: '패널 닫기' }));
    });

    const panel = container.querySelector(`[data-region="${SIDE_PEEK_SHELL_REGION_PEEK}"]`);
    expect(panel).toHaveAttribute('hidden');
  });
});
