import React from 'react';
import { render, screen } from '@testing-library/react';
import ConsultationLogListBlock from '../ConsultationLogListBlock';

const ADMIN_WRITTEN = {
  id: 201,
  sessionDate: '2026-10-03',
  sessionNumber: 2,
  clientId: 11,
  consultantId: 22,
  isSessionCompleted: false,
  createdAt: '2026-10-03T10:00:00',
  writtenByAdmin: true,
  editedByAdmin: false,
  lastEditedByRole: 'ADMIN',
  lastEditedAt: '2026-10-03T10:00:00'
};

describe('ConsultationLogListBlock — 관리자 작성 배지', () => {
  it('관리자 화면에서 관리자 작성 일지 카드에 배지를 보인다', () => {
    render(
      <ConsultationLogListBlock records={[ADMIN_WRITTEN]} onCardClick={jest.fn()} showAdminWriteBadge />
    );
    const badge = screen.getByTestId('consultation-log-admin-write-badge');
    expect(badge).toHaveTextContent('관리자 작성');
    expect(badge).toHaveTextContent('관리자 · 2026-10-03 10:00');
  });

  it('상담사 화면(기본값)에서는 배지를 보이지 않는다', () => {
    render(<ConsultationLogListBlock records={[ADMIN_WRITTEN]} onCardClick={jest.fn()} />);
    expect(screen.queryByTestId('consultation-log-admin-write-badge')).not.toBeInTheDocument();
  });
});
