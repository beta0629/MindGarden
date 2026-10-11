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

  it('내담자 선택이면 기간 집계 요약과 상담사 변경 라벨을 보여 주고 내담자 열을 뺀다', () => {
    render(
      <ConsultationLogTableBlock
        records={[
          {
            id: 1,
            sessionDate: '2026-08-13',
            sessionNumber: 1,
            clientId: 11,
            consultantId: 21,
            clientName: '한서윤',
            consultantName: '박지안',
            isSessionCompleted: true,
            summaryPreview: '첫 상담'
          },
          {
            id: 2,
            sessionDate: '2026-09-17',
            sessionNumber: 6,
            clientId: 11,
            consultantId: 22,
            clientName: '한서윤',
            consultantName: '최하린',
            isSessionCompleted: true,
            summaryPreview: '담당 변경'
          }
        ]}
        grouping={{
          clientId: 11,
          consultantId: null,
          periodFrom: '2026-08-01',
          periodTo: '2026-10-31',
          summary: {
            mode: 'CLIENT',
            sessionCount: 9,
            firstSessionDate: '2026-08-13',
            lastSessionDate: '2026-10-08'
          }
        }}
        onOpenRow={jest.fn()}
      />
    );

    expect(screen.getByText('조회 기간 2026-08-01 ~ 2026-10-31 기준')).toBeInTheDocument();
    expect(screen.getByText('9건')).toBeInTheDocument();
    expect(screen.getAllByText('2026-08-13').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2026-10-08').length).toBeGreaterThan(0);
    expect(screen.getByText('내담자 한서윤, 기간 내 상담 9건')).toBeInTheDocument();
    expect(screen.getByText('상담사 변경 · 최하린')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '내담자' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '상담사' })).toBeInTheDocument();
    expect(screen.queryByText('2건')).not.toBeInTheDocument();
  });

  it('같은 내담자가 이어지면 이름은 스크린리더용으로 남긴다', () => {
    render(
      <ConsultationLogTableBlock
        records={[
          {
            id: 1,
            sessionDate: '2026-10-09',
            sessionNumber: 9,
            clientId: 11,
            consultantId: 22,
            clientName: '한서윤',
            consultantName: '최하린',
            isSessionCompleted: false,
            summaryPreview: '작성 필요'
          },
          {
            id: 2,
            sessionDate: '2026-10-08',
            sessionNumber: 8,
            clientId: 11,
            consultantId: 22,
            clientName: '한서윤',
            consultantName: '최하린',
            isSessionCompleted: true,
            summaryPreview: '가족'
          }
        ]}
        grouping={{
          clientId: null,
          consultantId: null,
          periodFrom: '2026-08-01',
          periodTo: '2026-10-31',
          summary: { mode: 'NONE', clients: [] }
        }}
        onOpenRow={jest.fn()}
      />
    );

    const hidden = document.querySelectorAll('.mg-v2-consultation-log-row--repeat .sr-only');
    expect(hidden).toHaveLength(1);
    expect(hidden[0]).toHaveTextContent('한서윤');
    expect(hidden[0]).not.toHaveAttribute('aria-hidden');
    expect(document.querySelector('.mg-v2-consultation-log-repeat-tick')).toHaveAttribute('aria-hidden', 'true');
  });

  it('이름이 없으면 같은 내담자여도 이름 없음을 반복하고 보조 글자색을 쓴다', () => {
    render(
      <ConsultationLogTableBlock
        records={[
          {
            id: 1,
            sessionDate: '2026-10-07',
            sessionNumber: 2,
            clientId: 11,
            consultantId: 21,
            clientName: '',
            consultantName: '박지안',
            isSessionCompleted: false
          },
          {
            id: 2,
            sessionDate: '2026-10-06',
            sessionNumber: 1,
            clientId: 11,
            consultantId: 21,
            clientName: '',
            consultantName: '',
            isSessionCompleted: true
          }
        ]}
        grouping={{
          clientId: null,
          consultantId: null,
          summary: { mode: 'NONE', clients: [] }
        }}
        onOpenRow={jest.fn()}
      />
    );

    const missing = screen.getAllByText('이름 없음');
    expect(missing.length).toBeGreaterThanOrEqual(3);
    missing.forEach((node) => {
      expect(node).toHaveClass('mg-v2-consultation-log-name-missing');
    });
    expect(document.querySelector('.mg-v2-consultation-log-row--repeat')).not.toBeInTheDocument();
  });

  it('상담사 선택이면 내담자 묶음 머리에 기간 건수를 보여 준다', () => {
    render(
      <ConsultationLogTableBlock
        records={[
          {
            id: 1,
            sessionDate: '2026-09-24',
            sessionNumber: 1,
            clientId: 11,
            consultantId: 21,
            clientName: '한서윤',
            consultantName: '박지안',
            isSessionCompleted: true,
            summaryPreview: '긴장'
          },
          {
            id: 2,
            sessionDate: '2026-10-08',
            sessionNumber: 3,
            clientId: 11,
            consultantId: 21,
            clientName: '한서윤',
            consultantName: '박지안',
            isSessionCompleted: true,
            summaryPreview: '점검'
          }
        ]}
        grouping={{
          clientId: null,
          consultantId: 21,
          periodFrom: '2026-08-01',
          periodTo: '2026-10-31',
          summary: {
            mode: 'COUNSELOR',
            clients: [
              {
                clientId: 11,
                sessionCount: 3,
                firstSessionDate: '2026-09-24',
                lastSessionDate: '2026-10-08'
              }
            ]
          }
        }}
        onOpenRow={jest.fn()}
      />
    );

    expect(screen.getByText('한서윤')).toBeInTheDocument();
    expect(screen.getByText(/기간 내 3건/)).toBeInTheDocument();
    expect(screen.getByText(/최근 상담일 2026-10-08/)).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '내담자' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '상담사' })).not.toBeInTheDocument();
    expect(screen.queryByText('기간 내 2건')).not.toBeInTheDocument();
  });
});
