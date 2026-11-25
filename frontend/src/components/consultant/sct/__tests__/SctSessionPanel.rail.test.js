/**
 * SctSessionPanel 레일 — 미제출/만료 스트립만 · 제출 펼침/접기 · 뷰포트 · 본문 비노출
 *
 * @author MindGarden
 * @since 2026-03-25
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import SctSessionPanel from '../SctSessionPanel';
import {
  buildSctStripSubmittedCopy,
  SCT_DEFAULTS,
  SCT_FORM_TYPE_LABEL,
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
      expect(screen.getByTestId(SCT_TEST_ID.STRIP_COPY)).toBeInTheDocument();
    });
    expect(screen.getByTestId(SCT_TEST_ID.STATUS_BADGE)).toHaveTextContent(SCT_UI.STATUS_UNSENT);
    expect(screen.getByTestId(SCT_TEST_ID.STRIP_COPY)).toHaveTextContent(
      SCT_UI.STRIP_UNSENT
    );
    expect(screen.getByTestId(SCT_TEST_ID.STRIP_COPY)).toHaveTextContent(
      '질문지를 아직 보내지 않았습니다.'
    );
    expect(screen.queryByTestId(SCT_TEST_ID.SIDE)).not.toBeInTheDocument();
    expect(screen.queryByTestId(SCT_TEST_ID.SHEET)).not.toBeInTheDocument();
    expect(screen.queryByText(SECRET_ANSWER)).not.toBeInTheDocument();
    expect(screen.getByTestId(SCT_TEST_ID.SESSION_PANEL)).toHaveAttribute(
      'data-sct-side-open',
      '0'
    );
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.PEEK_TOGGLE));
    expect(screen.getByTestId(SCT_TEST_ID.PEEK_COPY)).toHaveTextContent(
      SCT_UI.PEEK_UNSENT
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
    expect(screen.getByTestId(SCT_TEST_ID.STRIP_COPY)).toHaveTextContent(
      '제출 전 본문은 열람할 수 없습니다'
    );
    expect(screen.getByTestId(SCT_TEST_ID.STRIP_COPY)).toHaveTextContent(
      SCT_UI.STRIP_PENDING
    );
    expect(screen.getByTestId(SCT_TEST_ID.STRIP_DEADLINE)).toHaveTextContent(
      SCT_UI.EXPIRES_AT
    );
    expect(screen.getByTestId(SCT_TEST_ID.STRIP_DEADLINE).textContent).toMatch(/2026/);
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.PEEK_TOGGLE));
    const peek = screen.getByTestId(SCT_TEST_ID.PEEK);
    expect(peek).toHaveTextContent(SCT_UI.PEEK_PENDING_AFTER_SUBMIT);
    expect(peek).toHaveTextContent('마지막 저장은');
    expect(screen.queryByText(SECRET_ANSWER)).not.toBeInTheDocument();
    expect(screen.queryByText(/23\s*\/\s*50/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+\s*\/\s*50문항/)).not.toBeInTheDocument();
    expect(screen.queryByText(SCT_UI.SEND)).not.toBeInTheDocument();
    expect(screen.queryByText(SCT_UI.REISSUE_LINK)).not.toBeInTheDocument();
  });

  it('pending with answeredCount: strip and peek include progress n', async() => {
    mockFetchSctSessionView.mockRejectedValue({ status: 404 });
    mockFetchSctClientInvitations.mockResolvedValue([
      {
        id: 78,
        status: 'SENT',
        formType: 'ADULT',
        answeredCount: 12,
        draftSavedAt: '2026-03-21T10:00:00Z',
        tokenExpiresAt: '2026-03-28T23:59:00Z'
      }
    ]);
    render(<SctSessionPanel clientId={33} />);
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.STRIP_COPY)).toHaveTextContent(
        `12/${SCT_DEFAULTS.TOTAL_ITEMS}문항 작성 중`
      );
    });
    expect(screen.getByTestId(SCT_TEST_ID.STRIP_COPY)).toHaveTextContent(
      '제출 전 본문은 열람할 수 없습니다'
    );
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.PEEK_TOGGLE));
    expect(screen.getByTestId(SCT_TEST_ID.PEEK_COPY)).toHaveTextContent(
      `내담자가 12 / ${SCT_DEFAULTS.TOTAL_ITEMS}문항까지 썼습니다.`
    );
    expect(screen.getByTestId(SCT_TEST_ID.PEEK_COPY)).toHaveTextContent(
      SCT_UI.PEEK_PENDING_AFTER_SUBMIT
    );
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
    expect(screen.getByTestId(SCT_TEST_ID.STRIP_COPY)).toHaveTextContent(
      SCT_UI.STRIP_EXPIRED
    );
    expect(screen.getByTestId(SCT_TEST_ID.STRIP_COPY)).toHaveTextContent(
      '작성 기한이 지났습니다. 본문은 열람할 수 없습니다.'
    );
    expect(screen.getByTestId(SCT_TEST_ID.STRIP_DEADLINE)).toBeInTheDocument();
    expect(screen.queryByTestId(SCT_TEST_ID.SIDE)).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.PEEK_TOGGLE));
    expect(screen.getByTestId(SCT_TEST_ID.PEEK)).toBeInTheDocument();
    expect(screen.getByTestId(SCT_TEST_ID.PEEK_COPY)).toHaveTextContent(
      SCT_UI.PEEK_EXPIRED
    );
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
        },
        {
          formItemId: 2,
          itemNo: 2,
          promptText: '나는',
          domainCode: 'AFFECT',
          domainLabel: '정서',
          answerText: '',
          notApplicable: false,
          isBlank: true
        },
        {
          formItemId: 3,
          itemNo: 3,
          promptText: '나는',
          domainCode: 'AFFECT',
          domainLabel: '정서',
          answerText: '',
          notApplicable: true,
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
    const expectedStrip = buildSctStripSubmittedCopy(
      SCT_FORM_TYPE_LABEL.ADULT,
      1,
      1,
      SCT_DEFAULTS.TOTAL_ITEMS
    );
    expect(screen.getByTestId(SCT_TEST_ID.STRIP_COPY)).toHaveTextContent(expectedStrip);
    expect(screen.getByTestId(SCT_TEST_ID.STRIP_COPY)).toHaveTextContent(
      '성인용 50문항 · 빈 응답 1 · 해당 없음 1'
    );
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

  it('submitted <1180: no auto sheet; expand opens sheet not side; Esc closes SCT only', async() => {
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

    // UnifiedModal-style bubble listener (등록 시점: SCT capture 이후) — Esc 가 stopPropagation 되면 미호출
    const modalOnClose = jest.fn();
    const modalBubbleListener = (e) => {
      if (e.key === 'Escape') {
        modalOnClose();
      }
    };
    document.addEventListener('keydown', modalBubbleListener);

    await act(async() => {
      fireEvent.keyDown(document, { key: 'Escape', bubbles: true });
    });
    await waitFor(() => {
      expect(screen.queryByTestId(SCT_TEST_ID.SHEET)).not.toBeInTheDocument();
    });
    expect(modalOnClose).not.toHaveBeenCalled();
    expect(screen.getByTestId(SCT_TEST_ID.EXPAND_BTN)).toBeInTheDocument();
    document.removeEventListener('keydown', modalBubbleListener);
  });

  it('submitted desktop: Esc collapses side panel and keeps expand trigger', async() => {
    mockUseMediaQuery.mockReturnValue(true);
    mockFetchSctSessionView.mockResolvedValue({
      id: 62,
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
      { id: 62, status: 'SUBMITTED', formType: 'ADULT', submittedAt: '2026-03-25T12:00:00Z' }
    ]);

    render(<SctSessionPanel clientId={6} />);
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.SIDE)).toBeInTheDocument();
    });

    const modalOnClose = jest.fn();
    const modalBubbleListener = (e) => {
      if (e.key === 'Escape') {
        modalOnClose();
      }
    };
    document.addEventListener('keydown', modalBubbleListener);

    await act(async() => {
      fireEvent.keyDown(document, { key: 'Escape', bubbles: true });
    });
    await waitFor(() => {
      expect(screen.queryByTestId(SCT_TEST_ID.SIDE)).not.toBeInTheDocument();
    });
    expect(modalOnClose).not.toHaveBeenCalled();
    expect(screen.getByTestId(SCT_TEST_ID.EXPAND_BTN)).toBeInTheDocument();
    document.removeEventListener('keydown', modalBubbleListener);
  });

  it('CSS places strip rail above journal spanning full width when side open', () => {
    const cssPath = path.join(__dirname, '../../../admin/sct/sctAdmin.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toMatch(
      /\.mg-v2-consultation-log__layout--with-sct\s*\{[\s\S]*grid-template-areas:\s*[\s\S]*'rail'[\s\S]*'journal'/
    );
    expect(css).toMatch(
      /\.is-sct-side-open\s*\{[\s\S]*grid-template-areas:\s*[\s\S]*'rail rail'[\s\S]*'journal side'/
    );
    expect(css).toMatch(
      /\.mg-v2-consultation-log__layout--with-sct\s+\.mg-v2-sct-rail\s*\{[\s\S]*grid-area:\s*rail/
    );
    expect(css).toMatch(
      /\.is-sct-side-open\s+\.mg-v2-sct-side\s*\{[\s\S]*grid-area:\s*side/
    );
  });

  it('memo-ta / memo-add use literal 16px font and touch-target height (pointer-independent)', () => {
    const cssPath = path.join(__dirname, '../../../admin/sct/sctAdmin.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    const memoTaBlock = css.match(/\.mg-v2-sct-memo-ta\s*\{[^}]+\}/);
    const memoAddBlock = css.match(/\.mg-v2-sct-memo-add\s*\{[^}]+\}/);
    expect(memoTaBlock).not.toBeNull();
    expect(memoAddBlock).not.toBeNull();
    expect(memoTaBlock[0]).toMatch(/font-size:\s*16px/);
    expect(memoTaBlock[0]).not.toMatch(/font-size:\s*var\(--mg-font-size-base/);
    expect(memoTaBlock[0]).not.toMatch(/font-size:\s*var\(--mg-v2-font-size-body-md\)/);
    expect(memoAddBlock[0]).toMatch(/font-size:\s*16px/);
    expect(memoAddBlock[0]).not.toMatch(/font-size:\s*var\(--mg-font-size-base/);
    expect(memoAddBlock[0]).toMatch(/min-height:\s*var\(--mg-v2-touch-target-min\)/);
    expect(memoAddBlock[0]).toMatch(/height:\s*var\(--mg-v2-touch-target-min\)/);
    expect(css).not.toMatch(
      /@media\s*\(\s*pointer:\s*coarse\s*\)\s*\{[^}]*\.mg-v2-sct-memo-(?:ta|add)/
    );
    // clinic-os modal generic textarea body-md 를 이기도록 특이도 상향
    expect(css).toMatch(
      /\.mg-v2-clinic-os\s+\.mg-v2-consultation-log-modal\s+\.mg-v2-sct-memo-ta[\s\S]*?font-size:\s*16px/
    );
    expect(css).toMatch(
      /\.mg-v2-clinic-os\s+\.mg-v2-consultation-log-modal\s+textarea\.mg-v2-sct-memo-ta[\s\S]*?font-size:\s*16px/
    );
    expect(css).toMatch(
      /\.mg-v2-clinic-os\s+\.mg-v2-consultation-log-modal\s+\.mg-v2-sct-memo-add[\s\S]*?font-size:\s*16px/
    );
    expect(css).toMatch(
      /\.mg-v2-sct-sheet\s+\.mg-v2-sct-memo-ta[\s\S]*?font-size:\s*16px/
    );
    const modalCssPath = path.join(__dirname, '../../ConsultationLogModal.css');
    const modalCss = fs.readFileSync(modalCssPath, 'utf8');
    expect(modalCss).toMatch(
      /\.mg-v2-clinic-os\s+\.mg-v2-consultation-log-modal\s+textarea\s*\{[\s\S]*?font-size:\s*var\(--mg-v2-font-size-body-md\)/
    );
  });

  it('narrow phone sheet root leaves top gap for strip; 820 media not used', () => {
    const cssPath = path.join(__dirname, '../../../admin/sct/sctAdmin.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toMatch(
      /@media\s*\(\s*max-width:\s*26\.25rem\s*\)\s*\{[\s\S]*?\.mg-v2-sct-sheet-root\s*\{[\s\S]*?top:\s*max\(\s*22\.125rem\s*,\s*45dvh\s*\)/
    );
    expect(css).not.toMatch(
      /@media\s*\(\s*max-width:\s*51\.25rem\s*\)\s*\{[\s\S]*?\.mg-v2-sct-sheet-root/
    );
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
