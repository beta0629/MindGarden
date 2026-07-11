/**
 * AiLogMonitorWidget — callsToday===0 빈 상태 UX
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import AiLogMonitorWidget from '../widgets/AiLogMonitorWidget';
import { API_PERFORMANCE_WIDGET } from '../../../constants/widgetConstants';

describe('AiLogMonitorWidget', () => {
  it('callsToday===0 이면 빈 상태 안내를 표시한다', () => {
    render(
      <AiLogMonitorWidget
        loading={false}
        error={false}
        stats={{
          callsToday: 0,
          successRate: 0,
          averageDurationMs: 0,
          totalTokens: 0
        }}
      />
    );

    expect(screen.getByTestId('ai-log-empty-state')).toBeInTheDocument();
    expect(screen.getByText(API_PERFORMANCE_WIDGET.MESSAGES.AI_LOG_EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByText(API_PERFORMANCE_WIDGET.MESSAGES.AI_LOG_EMPTY_HINT)).toBeInTheDocument();
  });

  it('callsToday>0 이면 빈 상태를 표시하지 않는다', () => {
    render(
      <AiLogMonitorWidget
        loading={false}
        error={false}
        stats={{
          callsToday: 3,
          successRate: 100,
          averageDurationMs: 200,
          totalTokens: 1200
        }}
      />
    );

    expect(screen.queryByTestId('ai-log-empty-state')).not.toBeInTheDocument();
    expect(screen.getByText('3건')).toBeInTheDocument();
  });
});
