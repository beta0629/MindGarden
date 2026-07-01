/**
 * ConsultantOverviewTab — SidePeekShell stub 연동 테스트
 *
 * @author CoreSolution
 * @since 2026-07-01
 */

import React, { useState, useCallback } from 'react';
import { render, screen, fireEvent, within, act } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key) => {
      const map = {
        'common.actions.edit': '수정',
        'admin.actions.delete': '삭제',
        'admin:consultant.table.name': '이름',
        'admin:consultant.filter.specialization': '전문분야',
        'admin:consultant.table.email': '이메일',
        'admin:consultant.table.status': '상태',
        'admin:consultant.table.joinDate': '가입일',
        'admin:consultant.table.sessionCount': '내담자 수',
        'common.actions.actions': '작업'
      };
      return map[key] || key;
    }
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('../../../ui/Card/ConsultantCard', () => ({
  __esModule: true,
  default: () => null
}));

import ConsultantOverviewTab from '../ConsultantOverviewTab';
import SidePeekShell from '../../../common/organisms/SidePeekShell';
import ConsultantSidePeekContent from '../molecules/ConsultantSidePeekContent';
import { SIDE_PEEK_SHELL_REGION_PEEK } from '../../../../constants/sidePeekShellConstants';
import { maskEncryptedDisplay, getUserStatusKoreanNameSync } from '../../../../utils/codeHelper';
import { CONSULTANT_COMP_SIDE_PEEK } from '../../../../constants/consultantComprehensiveStrings';

const SAMPLE_CONSULTANT = {
  id: 201,
  name: '김상담',
  email: 'consultant@example.com',
  phone: '01098765432',
  status: 'ACTIVE',
  professionalProviderTypeCode: 'COUNSELOR',
  createdAt: '2026-01-15T00:00:00.000Z',
  currentClients: 3
};

const ConsultantPeekHarness = ({ consultants = [SAMPLE_CONSULTANT] }) => {
  const [peekConsultant, setPeekConsultant] = useState(null);
  const handleConsultantPeek = useCallback((consultant) => {
    setPeekConsultant(consultant);
  }, []);
  const handleClosePeek = useCallback(() => {
    setPeekConsultant(null);
  }, []);

  return (
    <div className="consultant-comprehensive__peek-layout consultant-comprehensive__peek-layout--peek-open">
      <div className="consultant-comprehensive__main-region" data-region="R-MAIN">
        <ConsultantOverviewTab
          consultants={consultants}
          onConsultantPeek={handleConsultantPeek}
          onEditConsultant={jest.fn()}
          onDeleteConsultant={jest.fn()}
          viewMode="list"
        />
      </div>
      <SidePeekShell
        isOpen={Boolean(peekConsultant)}
        onClose={handleClosePeek}
        title="상세"
        ariaLabel={
          peekConsultant
            ? `${maskEncryptedDisplay(peekConsultant.name, '상담사')} 상세`
            : '상세'
        }
      >
        <ConsultantSidePeekContent consultant={peekConsultant} />
      </SidePeekShell>
    </div>
  );
};

describe('ConsultantOverviewTab — SidePeekShell stub', () => {
  test('list 행 클릭 → R-PEEK 패널 오픈 + stub 본문(이름·상태·연락처·가동률)', async() => {
    render(<ConsultantPeekHarness />);

    const row = screen.getByRole('button', { name: /김상담/ });
    await act(async() => {
      fireEvent.click(row);
    });

    const peekPanel = screen.getByRole('complementary', { name: '김상담 상세' });
    expect(peekPanel).toHaveAttribute('data-region', SIDE_PEEK_SHELL_REGION_PEEK);
    expect(within(peekPanel).getByText('김상담')).toBeInTheDocument();
    expect(within(peekPanel).getByText(getUserStatusKoreanNameSync('ACTIVE'))).toBeInTheDocument();
    expect(within(peekPanel).getByText(/010/)).toBeInTheDocument();
    expect(within(peekPanel).getByText(CONSULTANT_COMP_SIDE_PEEK.UTILIZATION_PLACEHOLDER)).toBeInTheDocument();
    expect(within(peekPanel).getByText(/Side Peek MVP/)).toBeInTheDocument();
  });

  test('overflow 「상세」 → peek 오픈', async() => {
    render(<ConsultantPeekHarness />);

    await act(async() => {
      fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    });

    await act(async() => {
      fireEvent.click(await screen.findByRole('menuitem', { name: '상세' }));
    });

    expect(screen.getByRole('complementary', { name: '김상담 상세' })).toBeInTheDocument();
  });

  test('peek 닫기 → 패널 hidden', async() => {
    const { container } = render(<ConsultantPeekHarness />);

    await act(async() => {
      fireEvent.click(screen.getByRole('button', { name: /김상담/ }));
    });

    await act(async() => {
      fireEvent.click(screen.getByRole('button', { name: '패널 닫기' }));
    });

    const panel = container.querySelector(`[data-region="${SIDE_PEEK_SHELL_REGION_PEEK}"]`);
    expect(panel).toHaveAttribute('hidden');
  });

  test('default viewMode는 list (테이블 렌더)', () => {
    render(
      <ConsultantOverviewTab
        consultants={[SAMPLE_CONSULTANT]}
        onConsultantPeek={jest.fn()}
        onEditConsultant={jest.fn()}
        onDeleteConsultant={jest.fn()}
      />
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
