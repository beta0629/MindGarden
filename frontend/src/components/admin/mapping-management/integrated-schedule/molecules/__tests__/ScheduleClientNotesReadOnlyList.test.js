/**
 * ScheduleClientNotesReadOnlyList — noteType 한글 표시 테스트
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ScheduleClientNotesReadOnlyList from '../ScheduleClientNotesReadOnlyList';

jest.mock('../../../../../../hooks/useScheduleClientNoteTypeLabels', () => ({
  useScheduleClientNoteTypeLabels: () => ({
    getLabel: (code) => ({
      PAYMENT_PROMISE: '입금·비용 약속',
      OTHER: '기타'
    }[code] || code),
    labelMap: {}
  })
}));

describe('ScheduleClientNotesReadOnlyList', () => {
  it('renders noteType via common-code Korean label', () => {
    render(
      <ScheduleClientNotesReadOnlyList
        notes={[{
          id: 1,
          title: '부부상담 추가 결제',
          body: '테스트',
          noteType: 'PAYMENT_PROMISE',
          promiseDate: '2026-09-02'
        }]}
      />
    );

    expect(screen.getByText('입금·비용 약속 · 약속일 2026-09-02')).toBeInTheDocument();
    expect(screen.queryByText(/PAYMENT_PROMISE/)).not.toBeInTheDocument();
  });
});
