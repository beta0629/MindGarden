/**
 * SctSessionPanel 레일 — 미제출/만료 스트립만 · 제출 펼침/접기 · 뷰포트 · 본문 비노출
 *
 * @author MindGarden
 * @since 2026-03-25
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SctSessionPanel from '../SctSessionPanel';
import {
  SCT_JOURNAL_PANEL_LS_KEYS,
  SCT_TEST_ID,
  SCT_UI
} from '../../../../constants/sctOnline';

const mockUseSctFeatureEnabled = jest.fn();
const mockFetchSctSessionView = jest.fn();
const mockFetchSctClientInvitations = jest.fn();
const mockFetchSctDomainMemos = jest.fn();
const mockUseMediaQuery = jest.fn();
const mockOnSidePanelOpenChange = jest.fn();

jest.mock('react-router-dom', () => ({
  useInRouterContext: () => false,
  useNavigate: () => jest.fn()
}));

jest.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: { id: 42, role: 'CONSULTANT', tenantId: 't1' } })
}));

jest.mock('../../../../hooks/useSctFeatureEnabled', () => ({
  __esModule: true,
  default: (...args) => mockUseSctFeatureEnabled(...args)
}));

jest.mock('../../../../hooks/useMediaQuery', () => ({
  __esModule: true,
  default: (...args) => mockUseMediaQuery(...args)
}));

jest.mock('../../../../utils/sctApi', () => ({
  fetchSctSessionView: (...args) => mockFetchSctSessionView(...args),
  fetchSctClientInvitations: (...args) => mockFetchSctClientInvitations(...args),
  fetchSctDomainMemos: (...args) => mockFetchSctDomainMemos(...args),
  upsertSctDomainMemo: jest.fn()
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn(), success: jest.fn() }
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, preventDoubleClick, loading, ...rest }) => (
    <button type="button" onClick={onClick} {...rest}>{children}</button>
  )
}));

jest.mock('../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: () => <div>loading</div>
}));

const SECRET_ANSWER = '비밀응답본문노출금지';

describe('SctSessionPanel rail states', () => {
  beforeEach(() => {
    localStorage.clear();
    mockOnSidePanelOpenChange.mockReset();
    mockFetchSctDomainMemos.mockResolvedValue([]);
    mockUseSctFeatureEnabled.mockReturnValue({ enabled: true, loading: false });
    mockUseMediaQuery.mockReturnValue(true);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('feature flag off → null', () => {
    mockUseSctFeatureEnabled.mockReturnValue({ enabled: false, loading: false });
    const { container } = render(<SctSessionPanel clientId={1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('unsent: strip only, no side panel, no answer body', async() => {
    mockFetchSctSessionView.mockRejectedValue({ status: 404 });
    mockFetchSctClientInvitations.mockResolvedValue([]);
    render(
      <SctSessionPanel clientId={9} onSidePanelOpenChange={mockOnSidePanelOpenChange} />
    );
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.STRIP)).toBeInTheDocument();
    });
    expect(screen.getByTestId(SCT_TEST_ID.STATUS_BADGE)).toHaveTextContent(SCT_UI.STATUS_UNSENT);
    expect(screen.queryByTestId(SCT_TEST_ID.SIDE)).not.toBeInTheDocument();
    expect(screen.queryByTestId(SCT_TEST_ID.SHEET)).not.toBeInTheDocument();
    expect(screen.queryByText(SECRET_ANSWER)).not.toBeInTheDocument();
    expect(screen.getByTestId(SCT_TEST_ID.SESSION_PANEL)).toHaveAttribute(
      'data-sct-side-open',
      '0'
    );
    await waitFor(() => {
      expect(mockOnSidePanelOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('pending: strip + peek only; never exposes answer text; no invented progress count', async() => {
    mockFetchSctSessionView.mockRejectedValue({ status: 404 });
    mockFetchSctClientInvitations.mockResolvedValue([
      {
        id: 77,
        status: 'DRAFT',
        formType: 'ADULT',
        draftSavedAt: '2026-03-20T08:00:00Z',
        tokenExpiresAt: '2026-03-27T23:59:00Z'
      }
    ]);
    render(<SctSessionPanel clientId={3} />);
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.STATUS_BADGE)).toHaveTextContent(
        SCT_UI.STATUS_PENDING
      );
    });
    expect(screen.queryByTestId(SCT_TEST_ID.SIDE)).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.PEEK_TOGGLE));
    expect(screen.getByTestId(SCT_TEST_ID.PEEK)).toHaveTextContent(
      SCT_UI.BODY_HIDDEN_BEFORE_SUBMIT
    );
    expect(screen.getByTestId(SCT_TEST_ID.PEEK)).toHaveTextContent(SCT_UI.DRAFT_SAVED_AT);
    expect(screen.queryByText(SECRET_ANSWER)).not.toBeInTheDocument();
    expect(screen.queryByText(/23\s*\/\s*50/)).not.toBeInTheDocument();
    expect(screen.queryByText(SCT_UI.SEND)).not.toBeInTheDocument();
    expect(screen.queryByText(SCT_UI.REISSUE_LINK)).not.toBeInTheDocument();
  });

  it('expired: strip only, no body column, peek has no answers', async() => {
    mockFetchSctSessionView.mockRejectedValue({ status: 404 });
    mockFetchSctClientInvitations.mockResolvedValue([
      {
        id: 88,
        status: 'EXPIRED',
        formType: 'ADOLESCENT',
        tokenExpiresAt: '2026-01-01T00:00:00Z'
      }
    ]);
    render(<SctSessionPanel clientId={4} />);
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.STATUS_BADGE)).toHaveTextContent(
        SCT_UI.STATUS_EXPIRED
      );
    });
    expect(screen.queryByTestId(SCT_TEST_ID.SIDE)).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.PEEK_TOGGLE));
    expect(screen.getByTestId(SCT_TEST_ID.PEEK)).toBeInTheDocument();
    expect(screen.queryByText(SECRET_ANSWER)).not.toBeInTheDocument();
  });

  it('submitted desktop ≥1180: auto-expands side; collapse persists localStorage key', async() => {
    mockUseMediaQuery.mockReturnValue(true);
    mockFetchSctSessionView.mockResolvedValue({
      id: 55,
      status: 'SUBMITTED',
      formType: 'ADULT',
      submittedAt: '2026-03-25T12:00:00Z',
      answers: [
        {
          formItemId: 1,
          itemNo: 1,
          promptText: '나는',
          domainCode: 'AFFECT',
          domainLabel: '정서',
          answerText: SECRET_ANSWER,
          notApplicable: false,
          isBlank: false
        }
      ]
    });
    mockFetchSctClientInvitations.mockResolvedValue([
      { id: 55, status: 'SUBMITTED', formType: 'ADULT', submittedAt: '2026-03-25T12:00:00Z' }
    ]);

    render(
      <SctSessionPanel clientId={1} onSidePanelOpenChange={mockOnSidePanelOpenChange} />
    );
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.SIDE)).toBeInTheDocument();
    });
    expect(screen.getByText(SECRET_ANSWER)).toBeInTheDocument();
    expect(screen.getByTestId(SCT_TEST_ID.SESSION_PANEL)).toHaveAttribute(
      'data-sct-side-open',
      '1'
    );
    await waitFor(() => {
      expect(mockOnSidePanelOpenChange).toHaveBeenCalledWith(true);
    });

    const openKey = `${SCT_JOURNAL_PANEL_LS_KEYS.OPEN}:42:55`;
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.COLLAPSE_BTN));
    await waitFor(() => {
      expect(screen.queryByTestId(SCT_TEST_ID.SIDE)).not.toBeInTheDocument();
    });
    expect(localStorage.getItem(openKey)).toBe('0');
    expect(screen.queryByText(SECRET_ANSWER)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId(SCT_TEST_ID.EXPAND_BTN));
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.SIDE)).toBeInTheDocument();
    });
    expect(localStorage.getItem(openKey)).toBe('1');
  });

  it('submitted <1180: no auto sheet; expand opens sheet not side; Esc closes', async() => {
    mockUseMediaQuery.mockReturnValue(false);
    mockFetchSctSessionView.mockResolvedValue({
      id: 61,
      status: 'SUBMITTED',
      formType: 'CHILD',
      submittedAt: '2026-03-24T09:00:00Z',
      answers: [
        {
          formItemId: 1,
          itemNo: 1,
          promptText: '나는',
          domainCode: 'AFFECT',
          domainLabel: '정서',
          answerText: SECRET_ANSWER,
          notApplicable: false,
          isBlank: false
        }
      ]
    });
    mockFetchSctClientInvitations.mockResolvedValue([
      { id: 61, status: 'SUBMITTED', formType: 'CHILD', submittedAt: '2026-03-24T09:00:00Z' }
    ]);

    render(<SctSessionPanel clientId={2} />);
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.STRIP)).toBeInTheDocument();
    });
    expect(screen.queryByTestId(SCT_TEST_ID.SIDE)).not.toBeInTheDocument();
    expect(screen.queryByTestId(SCT_TEST_ID.SHEET)).not.toBeInTheDocument();
    expect(screen.queryByText(SECRET_ANSWER)).not.toBeInTheDocument();

    const expand = await screen.findByTestId(SCT_TEST_ID.EXPAND_BTN);
    expect(expand).toHaveAttribute('aria-controls');
    expect(expand.getAttribute('aria-controls')).toMatch(/sheet/);

    fireEvent.click(expand);
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.SHEET)).toBeInTheDocument();
    });
    expect(screen.queryByTestId(SCT_TEST_ID.SIDE)).not.toBeInTheDocument();
    expect(screen.getByText(SECRET_ANSWER)).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');

    await act(async() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    await waitFor(() => {
      expect(screen.queryByTestId(SCT_TEST_ID.SHEET)).not.toBeInTheDocument();
    });
  });

  it('localStorage keys are scoped consultantId × invitationId', async() => {
    mockUseMediaQuery.mockReturnValue(true);
    mockFetchSctSessionView.mockResolvedValue({
      id: 100,
      status: 'SUBMITTED',
      formType: 'ADULT',
      submittedAt: '2026-03-25T15:00:00Z',
      answers: []
    });
    mockFetchSctClientInvitations.mockResolvedValue([
      { id: 100, status: 'SUBMITTED', formType: 'ADULT', submittedAt: '2026-03-25T15:00:00Z' }
    ]);
    render(<SctSessionPanel clientId={5} />);
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.SIDE)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.COLLAPSE_BTN));
    await waitFor(() => {
      expect(localStorage.getItem(`${SCT_JOURNAL_PANEL_LS_KEYS.OPEN}:42:100`)).toBe('0');
    });
    expect(localStorage.getItem(`${SCT_JOURNAL_PANEL_LS_KEYS.SEEN_SUBMITTED}:42:100`))
      .toBe('2026-03-25T15:00:00Z');
    expect(localStorage.getItem(`${SCT_JOURNAL_PANEL_LS_KEYS.OPEN}:7:100`)).toBeNull();
  });
});
