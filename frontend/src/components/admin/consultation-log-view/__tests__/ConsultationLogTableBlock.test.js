/**
 * ConsultationLogTableBlock — 목록은 식별자·일자·작성자·상태만 표시(본문 요약 컬럼 없음).
 *
 * @author MindGarden
 * @since 2026-10-04
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConsultationLogTableBlock from '../ConsultationLogTableBlock';

const RECORDS = [
  {
    id: 101,
    sessionDate: '2026-10-01',
    sessionNumber: 3,
    clientId: 11,
    consultantId: 22,
    isSessionCompleted: true,
    createdAt: '2026-10-01T10:00:00'
  }
];

describe('ConsultationLogTableBlock', () => {
  it('요약 컬럼 없이 메타 컬럼만 렌더하고 행 클릭 시 id 전달', () => {
    const onRowClick = jest.fn();
    render(
      <ConsultationLogTableBlock
        records={RECORDS}
        clientNameMap={{ 11: '내담자A' }}
        consultantNameMap={{ 22: '상담사B' }}
        onRowClick={onRowClick}
      />
    );

    expect(screen.queryByText('요약')).not.toBeInTheDocument();
    expect(screen.getAllByText('내담자A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('상담사B').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3회기').length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByText('내담자A')[0]);
    expect(onRowClick).toHaveBeenCalledWith(101);
  });
});
