/**
 * SctSessionPanel — 플래그 OFF · 메모 · 인쇄/글자크기/검색 컨트롤 스모크
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import SctSessionPanel from '../SctSessionPanel';
import { SCT_TEST_ID, SCT_UI } from '../../../../constants/sctOnline';
import { groupSctAnswersByDomain } from '../../../../constants/sctDomainGrouping';

const mockUseSctFeatureEnabled = jest.fn();
const mockFetchSctSessionView = jest.fn();
const mockFetchSctClientInvitations = jest.fn();
const mockFetchSctDomainMemos = jest.fn();
const mockUpsertSctDomainMemo = jest.fn();
const mockNavigate = jest.fn();
const mockUseMediaQuery = jest.fn();

jest.mock('react-router-dom', () => ({
  useInRouterContext: () => true,
  useNavigate: () => mockNavigate
}));

jest.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: { id: 7, role: 'CONSULTANT', tenantId: 'tenant-a' } })
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
  upsertSctDomainMemo: (...args) => mockUpsertSctDomainMemo(...args)
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    success: jest.fn()
  }
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

const submittedPayload = {
  id: 55,
  status: 'SUBMITTED',
  formType: 'ADULT',
  submittedAt: '2026-11-21T10:00:00Z',
  answers: [
    {
      formItemId: 1,
      itemNo: 1,
      promptText: '나는',
      domainCode: 'AFFECT',
      domainLabel: '정서(우울)',
      answerText: '괜찮다',
      notApplicable: false,
      isBlank: false
    },
    {
      formItemId: 9,
      itemNo: 9,
      promptText: '어머니를 떠올리면',
      domainCode: 'PARENT_FAMILY',
      domainLabel: '부모/원가족(모)',
      answerText: '',
      notApplicable: true,
      isBlank: false
    },
    {
      formItemId: 2,
      itemNo: 2,
      promptText: '기운이 바닥난 날',
      domainCode: 'AFFECT',
      domainLabel: '정서(우울)',
      answerText: '',
      notApplicable: false,
      isBlank: true
    }
  ]
};

describe('SctSessionPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockReset();
    mockFetchSctSessionView.mockReset();
    mockFetchSctClientInvitations.mockReset();
    mockFetchSctDomainMemos.mockReset();
    mockUpsertSctDomainMemo.mockReset();
    mockUseMediaQuery.mockReturnValue(true);
    mockFetchSctDomainMemos.mockResolvedValue([]);
    mockUpsertSctDomainMemo.mockResolvedValue({ domainCode: 'AFFECT', memoText: '확인' });
    mockFetchSctSessionView.mockResolvedValue(submittedPayload);
    mockFetchSctClientInvitations.mockResolvedValue([
      {
        id: 55,
        status: 'SUBMITTED',
        formType: 'ADULT',
        submittedAt: '2026-11-21T10:00:00Z'
      }
    ]);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('hides when feature flag is OFF', () => {
    mockUseSctFeatureEnabled.mockReturnValue({ enabled: false, loading: false });
    const { container } = render(<SctSessionPanel clientId={1} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId(SCT_TEST_ID.SESSION_PANEL)).not.toBeInTheDocument();
  });

  it('renders panel, loads domain memos, and memo button uses touch-target height token', async() => {
    mockUseSctFeatureEnabled.mockReturnValue({ enabled: true, loading: false });
    render(<SctSessionPanel clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.VIEW_BY_DOMAIN)).toBeInTheDocument();
    });
    expect(screen.getByTestId(SCT_TEST_ID.SESSION_PANEL)).toBeInTheDocument();
    expect(screen.getByTestId(SCT_TEST_ID.SIDE)).toBeInTheDocument();
    expect(mockFetchSctSessionView).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockFetchSctDomainMemos).toHaveBeenCalledWith(55);
    });

    const memoAdds = screen.getAllByTestId(SCT_TEST_ID.MEMO_ADD);
    expect(memoAdds.length).toBeGreaterThan(0);
    fireEvent.click(memoAdds[0]);
    expect(screen.getByLabelText(SCT_UI.MEMO_LABEL)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(SCT_UI.MEMO_LABEL), {
      target: { value: '확인' }
    });
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.MEMO_SAVE));
    await waitFor(() => {
      expect(mockUpsertSctDomainMemo).toHaveBeenCalledWith(
        55,
        expect.any(String),
        { memoText: '확인' }
      );
    });

    const cssPath = path.join(__dirname, '../../../admin/sct/sctAdmin.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toMatch(
      /\.mg-v2-sct-memo-add\s*\{[\s\S]*min-height:\s*var\(--mg-v2-touch-target-min\)/
    );
    expect(css).toMatch(/\.mg-v2-consultation-log__layout--with-sct\.is-sct-side-open/);
    expect(css).toMatch(/grid-template-areas:\s*[\s\S]*'rail'[\s\S]*'journal'/);
    expect(css).toMatch(/grid-template-areas:\s*[\s\S]*'rail rail'[\s\S]*'journal side'/);
    expect(css).toMatch(/\.mg-v2-consultation-log__layout--with-sct\s+\.mg-v2-sct-rail\s*\{[\s\S]*grid-area:\s*rail/);
    expect(css).not.toMatch(
      /\.mg-v2-consultation-log__layout--with-sct\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*5fr\)/
    );
    const tokenPath = path.join(
      __dirname,
      '../../../../styles/tokens/design-v2-tokens.css'
    );
    const tokens = fs.readFileSync(tokenPath, 'utf8');
    expect(tokens).toMatch(/--mg-v2-touch-target-min:\s*2\.75rem/);
  });

  it('shows print, font size, search controls and navigates to print preview', async() => {
    mockUseSctFeatureEnabled.mockReturnValue({ enabled: true, loading: false });
    render(<SctSessionPanel clientId={1} clientName="홍길동" />);
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.PRINT_BTN)).toBeInTheDocument();
    });
    expect(screen.getByTestId(SCT_TEST_ID.FONT_SIZE)).toBeInTheDocument();
    expect(screen.getByTestId(SCT_TEST_ID.SEARCH)).toBeInTheDocument();
    expect(screen.getByText(SCT_UI.NA_BADGE)).toBeInTheDocument();
    expect(screen.getByText(SCT_UI.BLANK_BADGE)).toBeInTheDocument();

    fireEvent.change(screen.getByTestId(SCT_TEST_ID.FONT_SIZE), {
      target: { value: 'lg' }
    });
    expect(screen.getByTestId(SCT_TEST_ID.SESSION_PANEL).className).toMatch(/font-lg/);

    fireEvent.change(screen.getByTestId(SCT_TEST_ID.SEARCH), {
      target: { value: '어머니' }
    });
    await waitFor(() => {
      expect(screen.getByText(/어머니를 떠올리면/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId(SCT_TEST_ID.PRINT_BTN));
    expect(mockNavigate).toHaveBeenCalled();
    const dest = mockNavigate.mock.calls[0][0];
    expect(dest).toContain('/consultant/sct-print');
    expect(dest).toContain('invitationId=55');
    expect(dest).not.toContain('clientName');
    const navOptions = mockNavigate.mock.calls[0][1];
    expect(navOptions?.state?.clientName).toBe('홍길동');
  });

  it('groups by domain from handoff/seed codes', () => {
    const answers = [
      { itemNo: 1, domainCode: 'SELF_CONCEPT', domainLabel: '자기개념', promptText: 'a' },
      { itemNo: 3, domainCode: 'PARENT_FAMILY', domainLabel: '부모/원가족(원가족)', promptText: 'b' },
      { itemNo: 7, domainCode: 'SELF_CONCEPT', domainLabel: '자기개념', promptText: 'c' }
    ];
    const { hasDomainSource, domains } = groupSctAnswersByDomain(answers, 'ADULT');
    expect(hasDomainSource).toBe(true);
    expect(domains[0].code).toBe('SELF_CONCEPT');
    expect(domains[0].label).toBe('자기개념');
    expect(domains[0].items).toHaveLength(2);
    expect(domains[1].code).toBe('PARENT_FAMILY');
  });
});
