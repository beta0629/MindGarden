/**
 * StaffOverviewTab — SidePeekShell stub 연동 테스트
 *
 * @author CoreSolution
 * @since 2026-07-01
 */

import React, { useState, useCallback } from 'react';
import { render, screen, fireEvent, within, act } from '@testing-library/react';

import StaffOverviewTab from '../StaffOverviewTab';
import SidePeekShell from '../../../common/organisms/SidePeekShell';
import StaffSidePeekContent from '../molecules/StaffSidePeekContent';
import { SIDE_PEEK_SHELL_REGION_PEEK } from '../../../../constants/sidePeekShellConstants';
import { maskEncryptedDisplay } from '../../../../utils/codeHelper';
import {
  STAFF_MGMT_ROLE_LABELS,
  STAFF_MGMT_SIDE_PEEK,
  STAFF_MGMT_STATUS
} from '../../../../constants/staffManagementStrings';
import { USER_ROLES } from '../../../../constants/roles';

const SAMPLE_STAFF = {
  id: 301,
  name: '김스태ff',
  email: 'staff@example.com',
  phone: '01011112222',
  role: USER_ROLES.STAFF,
  isActive: true,
  createdAt: '2026-01-15T00:00:00.000Z'
};

const StaffPeekHarness = ({ staffList = [SAMPLE_STAFF] }) => {
  const [peekStaff, setPeekStaff] = useState(null);
  const handleStaffPeek = useCallback((staff) => {
    setPeekStaff(staff);
  }, []);
  const handleClosePeek = useCallback(() => {
    setPeekStaff(null);
  }, []);

  return (
    <div className="staff-management__peek-layout staff-management__peek-layout--peek-open">
      <div className="staff-management__main-region" data-region="R-MAIN">
        <StaffOverviewTab
          staffList={staffList}
          onStaffPeek={handleStaffPeek}
          onEditStaff={jest.fn()}
          onRoleChange={jest.fn()}
          onDeleteStaff={jest.fn()}
          viewMode="list"
        />
      </div>
      <SidePeekShell
        isOpen={Boolean(peekStaff)}
        onClose={handleClosePeek}
        title="상세"
        ariaLabel={
          peekStaff
            ? `${maskEncryptedDisplay(peekStaff.name, '이름')} 상세`
            : '상세'
        }
      >
        <StaffSidePeekContent staff={peekStaff} />
      </SidePeekShell>
    </div>
  );
};

describe('StaffOverviewTab — SidePeekShell stub', () => {
  test('list 행 클릭 → R-PEEK 패널 오픈 + stub 본문(이름·역할·상태·연락처)', async() => {
    render(<StaffPeekHarness />);

    const row = screen.getByRole('button', { name: /김스태ff/ });
    await act(async() => {
      fireEvent.click(row);
    });

    const peekPanel = screen.getByRole('complementary', { name: '김스태ff 상세' });
    expect(peekPanel).toHaveAttribute('data-region', SIDE_PEEK_SHELL_REGION_PEEK);
    expect(within(peekPanel).getByText('김스태ff')).toBeInTheDocument();
    expect(within(peekPanel).getByText(STAFF_MGMT_ROLE_LABELS[USER_ROLES.STAFF])).toBeInTheDocument();
    expect(within(peekPanel).getByText(STAFF_MGMT_STATUS.ACTIVE)).toBeInTheDocument();
    expect(within(peekPanel).getByText(/010/)).toBeInTheDocument();
    expect(within(peekPanel).getByText(STAFF_MGMT_SIDE_PEEK.PERMISSION_STAFF)).toBeInTheDocument();
    expect(within(peekPanel).getByText(/Side Peek MVP/)).toBeInTheDocument();
  });

  test('overflow 「상세」 → peek 오픈', async() => {
    render(<StaffPeekHarness />);

    await act(async() => {
      fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    });

    await act(async() => {
      fireEvent.click(await screen.findByRole('menuitem', { name: '상세' }));
    });

    expect(screen.getByRole('complementary', { name: '김스태ff 상세' })).toBeInTheDocument();
  });

  test('peek 닫기 → 패널 hidden', async() => {
    const { container } = render(<StaffPeekHarness />);

    await act(async() => {
      fireEvent.click(screen.getByRole('button', { name: /김스태ff/ }));
    });

    await act(async() => {
      fireEvent.click(screen.getByRole('button', { name: '패널 닫기' }));
    });

    const panel = container.querySelector(`[data-region="${SIDE_PEEK_SHELL_REGION_PEEK}"]`);
    expect(panel).toHaveAttribute('hidden');
  });

  test('default viewMode는 list (테이블 렌더)', () => {
    render(
      <StaffOverviewTab
        staffList={[SAMPLE_STAFF]}
        onStaffPeek={jest.fn()}
        onEditStaff={jest.fn()}
        onRoleChange={jest.fn()}
        onDeleteStaff={jest.fn()}
      />
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
