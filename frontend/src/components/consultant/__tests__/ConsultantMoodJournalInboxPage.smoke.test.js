/**
 * ConsultantMoodJournalInboxPage — empty/loading smoke
 *
 * @author MindGarden
 * @since 2026-09-03
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../dashboard-v2/content', () => ({
  ContentArea: ({ children, ariaLabel }) => <main aria-label={ariaLabel}>{children}</main>,
  ContentHeader: ({ title, subtitle }) => (
    <header>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  )
}));

jest.mock('../../common/UnifiedLoading', () => () => <div data-testid="loading" />);
jest.mock('../../common/MGButton', () => ({ children, onClick }) => (
  <button type="button" onClick={onClick}>{children}</button>
));
jest.mock('../../common/SafeText', () => ({ children, fallback }) => (
  <span>{children ?? fallback ?? ''}</span>
));

jest.mock('../../../api/consultantMoodJournalInboxClient', () => ({
  fetchConsultantMoodJournalInbox: jest.fn(() => Promise.resolve([]))
}));

import ConsultantMoodJournalInboxPage from '../ConsultantMoodJournalInboxPage';
import { CONSULTANT_MOOD_JOURNAL_INBOX_STRINGS as S } from '../../../constants/consultantMoodJournalInboxStrings';

describe('ConsultantMoodJournalInboxPage', () => {
  test('renders empty state after load', async() => {
    render(
      <MemoryRouter>
        <ConsultantMoodJournalInboxPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: S.PAGE_TITLE })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(S.EMPTY)).toBeInTheDocument();
    });
    expect(screen.getByText(S.EMPTY_HINT)).toBeInTheDocument();
  });
});
