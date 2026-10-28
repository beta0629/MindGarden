/**
 * 상담사 태블릿 일지 목록 스모크 — 칩 · 터치 행 · 빈 상태
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '../../../../i18n';
import ConsultantJournalTabletList, {
  chipKeyToStatus,
  statusToChipKey
} from '../ConsultantJournalTabletList';
import {
  CONSULTANT_JOURNAL_STATUS_CHIP,
  CONSULTANT_JOURNAL_TABLET_TEST_ID
} from '../consultantJournalTabletConstants';
import {
  CONSULTATION_LOG_STATUS_ALL,
  CONSULTATION_LOG_STATUS_DONE,
  CONSULTATION_LOG_STATUS_PENDING
} from '../../../admin/consultation-log-view/consultationLogQuery';

const RECORDS = [
  {
    id: 1,
    clientName: '윤하늘별빛심리상담희망자',
    sessionDate: '2026-10-28',
    sessionNumber: 7,
    sessionType: '화상',
    isSessionCompleted: false
  },
  {
    id: 2,
    clientName: '김서연',
    sessionDate: '2026-10-28',
    sessionNumber: 3,
    consultationType: '대면',
    isSessionCompleted: true
  }
];

describe('ConsultantJournalTabletList', () => {
  it('status ↔ chip 키 매핑', () => {
    expect(statusToChipKey(CONSULTATION_LOG_STATUS_ALL)).toBe(CONSULTANT_JOURNAL_STATUS_CHIP.ALL);
    expect(statusToChipKey(CONSULTATION_LOG_STATUS_PENDING)).toBe(CONSULTANT_JOURNAL_STATUS_CHIP.PENDING);
    expect(statusToChipKey(CONSULTATION_LOG_STATUS_DONE)).toBe(CONSULTANT_JOURNAL_STATUS_CHIP.DONE);
    expect(chipKeyToStatus(CONSULTANT_JOURNAL_STATUS_CHIP.PENDING)).toBe(CONSULTATION_LOG_STATUS_PENDING);
  });

  it('전체/미작성/작성완료 칩 · 터치 행 · 배지', () => {
    const onStatusChange = jest.fn();
    const onOpenRecord = jest.fn();
    render(
      <ConsultantJournalTabletList
        records={RECORDS}
        status={CONSULTATION_LOG_STATUS_ALL}
        onStatusChange={onStatusChange}
        onOpenRecord={onOpenRecord}
      />
    );

    expect(screen.getByTestId(CONSULTANT_JOURNAL_TABLET_TEST_ID.LIST)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '미작성' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '작성완료' })).toBeInTheDocument();
    expect(screen.getAllByText('미작성').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('작성완료').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/윤하늘별빛/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '미작성' }));
    expect(onStatusChange).toHaveBeenCalledWith(CONSULTATION_LOG_STATUS_PENDING);

    const rows = screen.getAllByTestId(CONSULTANT_JOURNAL_TABLET_TEST_ID.ROW);
    fireEvent.click(rows[0]);
    expect(onOpenRecord).toHaveBeenCalledWith(RECORDS[0]);
  });

  it('미작성 빈 상태 + 전체 보기', () => {
    const onStatusChange = jest.fn();
    render(
      <ConsultantJournalTabletList
        records={[]}
        status={CONSULTATION_LOG_STATUS_PENDING}
        onStatusChange={onStatusChange}
        onOpenRecord={jest.fn()}
      />
    );
    expect(screen.getByText('미작성 일지가 없습니다')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '전체 보기' }));
    expect(onStatusChange).toHaveBeenCalledWith(CONSULTATION_LOG_STATUS_ALL);
  });
});
