import React from 'react';
import { render, screen } from '@testing-library/react';
import ConsultationLogAdminWriteBadge from '../ConsultationLogAdminWriteBadge';
import {
  formatConsultationLogEditedAt,
  resolveConsultationLogAdminWriteMeta
} from '../../../../utils/consultationLogAdminWriteMeta';

describe('ConsultationLogAdminWriteBadge', () => {
  it('관리자 작성 이력이면 「관리자 작성」과 역할·시각을 표시한다', () => {
    render(
      <ConsultationLogAdminWriteBadge
        record={{ writtenByAdmin: true, editedByAdmin: false, lastEditedByRole: 'STAFF', lastEditedAt: '2026-10-05T09:05:30' }}
      />
    );
    const badge = screen.getByTestId('consultation-log-admin-write-badge');
    expect(badge).toHaveAttribute('data-kind', 'written');
    expect(badge).toHaveTextContent('관리자 작성');
    expect(badge).toHaveTextContent('사무원 · 2026-10-05 09:05');
  });

  it('관리자 수정 이력이 작성 이력보다 우선한다', () => {
    render(
      <ConsultationLogAdminWriteBadge
        record={{ writtenByAdmin: true, editedByAdmin: true, lastEditedByRole: 'ADMIN', lastEditedAt: '2026-10-06T18:00:00' }}
      />
    );
    expect(screen.getByTestId('consultation-log-admin-write-badge')).toHaveTextContent('관리자 수정');
  });

  it('상담사가 작성·수정한 일지(관리자 이력 없음)는 렌더하지 않는다', () => {
    const { container } = render(
      <ConsultationLogAdminWriteBadge
        record={{ writtenByAdmin: false, editedByAdmin: false, lastEditedByRole: 'CONSULTANT' }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('record 가 없거나 객체가 아니면 렌더하지 않는다', () => {
    const { container } = render(<ConsultationLogAdminWriteBadge record={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('알 수 없는 역할·시각 누락에도 객체를 그대로 렌더하지 않고 기본 라벨을 쓴다', () => {
    render(
      <ConsultationLogAdminWriteBadge
        record={{ editedByAdmin: true, lastEditedByRole: { bad: true }, lastEditedAt: null }}
      />
    );
    const badge = screen.getByTestId('consultation-log-admin-write-badge');
    expect(badge).toHaveTextContent('관리자 수정');
    expect(badge).not.toHaveTextContent('[object Object]');
  });
});

describe('consultationLogAdminWriteMeta', () => {
  it('formatConsultationLogEditedAt 은 문자열이 아니면 빈 문자열', () => {
    expect(formatConsultationLogEditedAt(undefined)).toBe('');
    expect(formatConsultationLogEditedAt(123)).toBe('');
    expect(formatConsultationLogEditedAt('2026-10-05T09:05:30.123')).toBe('2026-10-05 09:05');
  });

  it('본문 필드는 결과에 포함하지 않는다', () => {
    const meta = resolveConsultationLogAdminWriteMeta({ editedByAdmin: true, mainIssues: '본문' });
    expect(JSON.stringify(meta)).not.toContain('본문');
  });
});
