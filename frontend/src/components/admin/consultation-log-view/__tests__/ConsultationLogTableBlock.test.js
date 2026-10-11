/**
 * ConsultationLogTableBlock — 상담일·내담자·상담사·상태·요약.
 *
 * @author MindGarden
 * @since 2026-10-04
 * @updated 2026-10-10
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../../../i18n';
import ConsultationLogTableBlock from '../ConsultationLogTableBlock';

const RECORDS = [
  {
    id: 101,
    sessionDate: '2026-10-01',
    sessionNumber: 3,
    clientId: 11,
    consultantId: 22,
    isSessionCompleted: true,
    summaryPreview: '수면 점검',
    createdAt: '2026-10-01T10:00:00'
  },
  {
    id: 102,
    sessionDate: '2026-10-02',
    sessionNumber: 0,
    clientName: '',
    isSessionCompleted: false
  }
];

describe('ConsultationLogTableBlock', () => {
  it('요약 열을 포함하고 상담일 버튼이 행을 연다', () => {
    const onOpenRow = jest.fn();
    render(
      <ConsultationLogTableBlock
        records={RECORDS}
        clientNameMap={{ 11: '내담자A' }}
        consultantNameMap={{ 22: '상담사B' }}
        onOpenRow={onOpenRow}
        selectedLogId={101}
      />
    );

    expect(screen.getByText('요약')).toBeInTheDocument();
    expect(screen.getAllByText('내담자A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('상담사B').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3회기').length).toBeGreaterThan(0);
    expect(screen.getByText('수면 점검')).toBeInTheDocument();
    expect(screen.queryByText('0회기')).not.toBeInTheDocument();
    expect(screen.getAllByText('이름 없음').length).toBeGreaterThan(0);
    expect(screen.queryByText('관리자 작성·수정')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2026-10-01 내담자A 상담일지 열기' }));
    expect(onOpenRow).toHaveBeenCalledWith(101);
  });

  it('응답 이름을 명단 맵보다 먼저 쓰고, 맵이 비어도 응답 이름을 보여 준다', () => {
    render(
      <ConsultationLogTableBlock
        records={[{
          id: 201,
          sessionDate: '2026-10-03',
          sessionNumber: 1,
          clientId: 11,
          consultantId: 22,
          clientName: '응답내담',
          consultantName: '응답상담',
          isSessionCompleted: true,
          summaryPreview: '응답 요약'
        }]}
        clientNameMap={{ 11: '맵내담' }}
        consultantNameMap={{}}
        onOpenRow={jest.fn()}
      />
    );

    expect(screen.getByText('응답내담')).toBeInTheDocument();
    expect(screen.getByText('응답상담')).toBeInTheDocument();
    expect(screen.queryByText('맵내담')).not.toBeInTheDocument();
    expect(screen.queryByText('이름 없음')).not.toBeInTheDocument();
  });
});
