/**
 * ConsultantMoodJournalInboxPage — smoke
 *
 * @author MindGarden
 * @since 2026-09-03
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="loading">{text}</div>
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>{children}</button>
  )
}));

jest.mock('../../../api/consultantMoodJournalInboxClient', () => ({
  fetchConsultantMoodJournalInbox: jest.fn()
}));

import ConsultantMoodJournalInboxPage from '../ConsultantMoodJournalInboxPage';
import { fetchConsultantMoodJournalInbox } from '../../../api/consultantMoodJournalInboxClient';
import { CONSULTANT_MOOD_JOURNAL_INBOX_STRINGS as S } from '../../../constants/consultantMoodJournalInboxStrings';

describe('ConsultantMoodJournalInboxPage', () => {
  beforeEach(() => {
    fetchConsultantMoodJournalInbox.mockReset();
  });

  test('empty state shows Korean empty copy', async() => {
    fetchConsultantMoodJournalInbox.mockResolvedValueOnce([]);
    render(
      <MemoryRouter>
        <ConsultantMoodJournalInboxPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(S.EMPTY)).toBeInTheDocument();
    });
    expect(screen.getByText(S.PAGE_TITLE)).toBeInTheDocument();
  });

  test('shared inbox items render client + memo', async() => {
    fetchConsultantMoodJournalInbox.mockResolvedValueOnce([
      {
        id: '1',
        clientId: 9,
        clientName: '공유내담',
        date: '2026-09-01',
        moodValue: 4,
        emoji: '🙂',
        tags: ['평온'],
        memo: '오늘은 괜찮아요',
        sharedWithConsultant: true,
        createdAt: '2026-09-01T10:00:00'
      }
    ]);

    render(
      <MemoryRouter>
        <ConsultantMoodJournalInboxPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('공유내담')).toBeInTheDocument();
    });
    expect(screen.getByText('오늘은 괜찮아요')).toBeInTheDocument();
    expect(screen.getByText('평온')).toBeInTheDocument();
  });
});
