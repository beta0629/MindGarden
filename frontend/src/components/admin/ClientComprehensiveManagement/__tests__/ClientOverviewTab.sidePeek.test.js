/**
 * ClientOverviewTab — SidePeekShell stub 연동 테스트
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
        'admin.actions.delete': '삭제'
      };
      return map[key] || key;
    }
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('../../../ui/Card/index', () => ({
  __esModule: true,
  ProfileCard: () => null
}));

import ClientOverviewTab from '../ClientOverviewTab';
import SidePeekShell from '../../../common/organisms/SidePeekShell';
import ClientSidePeekContent from '../molecules/ClientSidePeekContent';
import { SIDE_PEEK_SHELL_REGION_PEEK } from '../../../../constants/sidePeekShellConstants';
import { maskEncryptedDisplay, getUserStatusKoreanNameSync } from '../../../../utils/codeHelper';

const SAMPLE_CLIENT = {
  id: 101,
  name: '김내담',
  email: 'client@example.com',
  phone: '01012345678',
  status: 'ACTIVE',
  grade: 'BRONZE',
  createdAt: '2026-01-15T00:00:00.000Z'
};

const ClientPeekHarness = ({ clients = [SAMPLE_CLIENT] }) => {
  const [peekClient, setPeekClient] = useState(null);
  const handleClientPeek = useCallback((client) => {
    setPeekClient(client);
  }, []);
  const handleClosePeek = useCallback(() => {
    setPeekClient(null);
  }, []);

  return (
    <div className="client-comprehensive__peek-layout client-comprehensive__peek-layout--peek-open">
      <div className="client-comprehensive__main-region" data-region="R-MAIN">
        <ClientOverviewTab
          clients={clients}
          onClientPeek={handleClientPeek}
          onEditClient={jest.fn()}
          onDeleteClient={jest.fn()}
          consultants={[]}
          mappings={[]}
          consultations={[]}
          viewMode="list"
        />
      </div>
      <SidePeekShell
        isOpen={Boolean(peekClient)}
        onClose={handleClosePeek}
        title="상세"
        ariaLabel={
          peekClient
            ? `${maskEncryptedDisplay(peekClient.name, '내담자')} 상세`
            : '상세'
        }
      >
        <ClientSidePeekContent client={peekClient} />
      </SidePeekShell>
    </div>
  );
};

describe('ClientOverviewTab — SidePeekShell stub', () => {
  test('list 행 클릭 → R-PEEK 패널 오픈 + stub 본문(이름·상태·연락처)', async() => {
    render(<ClientPeekHarness />);

    const row = screen.getByRole('button', { name: /김내담/ });
    await act(async() => {
      fireEvent.click(row);
    });

    const peekPanel = screen.getByRole('complementary', { name: '김내담 상세' });
    expect(peekPanel).toHaveAttribute('data-region', SIDE_PEEK_SHELL_REGION_PEEK);
    expect(within(peekPanel).getByText('김내담')).toBeInTheDocument();
    expect(within(peekPanel).getByText(getUserStatusKoreanNameSync('ACTIVE'))).toBeInTheDocument();
    expect(within(peekPanel).getByText(/010/)).toBeInTheDocument();
    expect(within(peekPanel).getByText(/Side Peek MVP/)).toBeInTheDocument();
  });

  test('overflow 「상세」 → peek 오픈', async() => {
    render(<ClientPeekHarness />);

    await act(async() => {
      fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    });

    await act(async() => {
      fireEvent.click(await screen.findByRole('menuitem', { name: '상세' }));
    });

    expect(screen.getByRole('complementary', { name: '김내담 상세' })).toBeInTheDocument();
  });

  test('peek 닫기 → 패널 hidden', async() => {
    const { container } = render(<ClientPeekHarness />);

    await act(async() => {
      fireEvent.click(screen.getByRole('button', { name: /김내담/ }));
    });

    await act(async() => {
      fireEvent.click(screen.getByRole('button', { name: '패널 닫기' }));
    });

    const panel = container.querySelector(`[data-region="${SIDE_PEEK_SHELL_REGION_PEEK}"]`);
    expect(panel).toHaveAttribute('hidden');
  });

  test('default viewMode는 smallCard (작은 카드 그리드 렌더)', () => {
    const { container } = render(
      <ClientOverviewTab
        clients={[SAMPLE_CLIENT]}
        onClientPeek={jest.fn()}
        onEditClient={jest.fn()}
        onDeleteClient={jest.fn()}
        consultants={[]}
        mappings={[]}
        consultations={[]}
      />
    );

    expect(container.querySelector('.mg-v2-list-block__grid--small')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
