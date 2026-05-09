import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PsychClientContextSummaryBlock from '../PsychClientContextSummaryBlock';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn() }
}));

describe('PsychClientContextSummaryBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clientId 없으면 DOM 없음', () => {
    const { container } = render(<PsychClientContextSummaryBlock clientId={null} variant="section" />);
    expect(container.firstChild).toBeNull();
  });

  it('hasPsychData false면 제목·목록 없음', async() => {
    StandardizedApi.get.mockResolvedValueOnce({
      hasPsychData: false,
      typesPresent: [],
      documents: []
    });
    const { container } = render(<PsychClientContextSummaryBlock clientId={42} variant="section" />);
    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalled();
    });
    expect(container.querySelector('.mg-v2-psych-context-summary__accent-title')).toBeNull();
  });

  it('hasPsychData true이면 섹션 제목 노출', async() => {
    StandardizedApi.get.mockResolvedValueOnce({
      hasPsychData: true,
      typesPresent: ['TCI'],
      documents: [
        {
          documentId: 9,
          assessmentType: 'TCI',
          originalFilename: 'tci.pdf',
          reportSummary: '요약 한 줄'
        }
      ]
    });
    render(<PsychClientContextSummaryBlock clientId={1} variant="section" />);
    await waitFor(() => {
      expect(screen.getByText('심리검사 리포트')).toBeInTheDocument();
    });
    expect(screen.getByText('요약 한 줄')).toBeInTheDocument();
  });

  it('API 실패 시 토스트 후 DOM 없음', async() => {
    StandardizedApi.get.mockRejectedValueOnce(new Error('network'));
    const { container } = render(<PsychClientContextSummaryBlock clientId={5} variant="section" />);
    await waitFor(() => {
      expect(notificationManager.show).toHaveBeenCalled();
    });
    expect(container.querySelector('.mg-v2-psych-context-summary__accent-title')).toBeNull();
  });
});
