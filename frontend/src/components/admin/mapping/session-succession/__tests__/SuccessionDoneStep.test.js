/**
 * 회기 승계 DONE 스텝 — targetMapping 결과 표시.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import SuccessionDoneStep from '../SuccessionDoneStep';
import { SESSION_SUCCESSION_UI } from '../../../../../constants/sessionSuccession';

describe('SuccessionDoneStep', () => {
  it('targetMapping 정보와 사이드바 안내를 표시한다', () => {
    render(
      <SuccessionDoneStep
        result={{
          transferredCount: 3,
          sourceMapping: { remainingSessions: 2 },
          targetMapping: {
            id: 501,
            clientName: '김수혜',
            consultantName: '박상담',
            remainingSessions: 3
          }
        }}
      />
    );

    expect(screen.getByText('3회 승계가 완료되었습니다.')).toBeInTheDocument();
    expect(screen.getByText('김수혜')).toBeInTheDocument();
    expect(screen.getByText('박상담')).toBeInTheDocument();
    expect(screen.getByText('501')).toBeInTheDocument();
    expect(
      screen.getByText(
        SESSION_SUCCESSION_UI.DONE_SIDEBAR_GUIDANCE.replace('{beneficiaryName}', '김수혜')
      )
    ).toBeInTheDocument();
  });

  it('mappingId 폴백을 표시한다', () => {
    render(
      <SuccessionDoneStep
        result={{
          transferredCount: 1,
          targetMapping: {
            mappingId: 902,
            clientName: '이신규',
            consultantName: '최상담',
            remainingSessions: 1
          }
        }}
      />
    );

    expect(screen.getByText('902')).toBeInTheDocument();
  });
});
