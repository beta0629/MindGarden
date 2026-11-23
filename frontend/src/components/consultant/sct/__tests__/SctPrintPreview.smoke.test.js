/**
 * SCT 인쇄 미리보기 컨트롤 스모크
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import SctPrintPreviewPage from '../SctPrintPreviewPage';
import { SCT_TEST_ID, SCT_UI } from '../../../../constants/sctOnline';

const mockUseSctFeatureEnabled = jest.fn();
const mockFetchSctInvitation = jest.fn();
const mockRecordSctPrintAudit = jest.fn();
const mockNavigate = jest.fn();
let mockSearch = new URLSearchParams('invitationId=55&clientName=E2E');

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearch]
}));

jest.mock('../../../../hooks/useSctFeatureEnabled', () => ({
  __esModule: true,
  default: (...args) => mockUseSctFeatureEnabled(...args)
}));

jest.mock('../../../../utils/sctApi', () => ({
  fetchSctInvitation: (...args) => mockFetchSctInvitation(...args),
  recordSctPrintAudit: (...args) => mockRecordSctPrintAudit(...args)
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
  default: ({ children, onClick, ...rest }) => (
    <button type="button" onClick={onClick} {...rest}>{children}</button>
  )
}));

jest.mock('../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: () => <div>loading</div>
}));

describe('SctPrintPreviewPage', () => {
  beforeEach(() => {
    mockSearch = new URLSearchParams('invitationId=55&clientName=E2E');
    mockUseSctFeatureEnabled.mockReturnValue({ enabled: true, loading: false });
    mockFetchSctInvitation.mockResolvedValue({
      id: 55,
      status: 'SUBMITTED',
      formType: 'ADULT',
      managementNo: 'SCT-000055',
      submittedAt: '2026-11-21T10:00:00',
      answers: [
        {
          formItemId: 1,
          itemNo: 1,
          promptText: '나는',
          answerText: '괜찮다',
          notApplicable: false,
          isBlank: false
        }
      ]
    });
    mockRecordSctPrintAudit.mockResolvedValue({});
    window.print = jest.fn();
  });

  it('renders paper/orientation/scale controls and print document', async() => {
    render(<SctPrintPreviewPage />);
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.PRINT_PREVIEW)).toBeInTheDocument();
    });
    expect(screen.getByTestId(SCT_TEST_ID.PRINT_PAPER)).toBeInTheDocument();
    expect(screen.getByTestId(SCT_TEST_ID.PRINT_ORIENT)).toBeInTheDocument();
    expect(screen.getByTestId(SCT_TEST_ID.PRINT_SCALE)).toBeInTheDocument();
    expect(screen.getByText(SCT_UI.PRINT_HEADER_NOTICE)).toBeInTheDocument();
    expect(screen.getByText(SCT_UI.PRINT_MEMO_TITLE)).toBeInTheDocument();
    expect(screen.getByText('E2E')).toBeInTheDocument();
    expect(screen.getByText('SCT-000055')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId(SCT_TEST_ID.PRINT_PAPER), {
      target: { value: 'Letter' }
    });
    fireEvent.change(screen.getByTestId(SCT_TEST_ID.PRINT_SCALE), {
      target: { value: '90' }
    });
    expect(screen.getByTestId(SCT_TEST_ID.PRINT_PAPER).value).toBe('Letter');
    expect(screen.getByTestId(SCT_TEST_ID.PRINT_SCALE).value).toBe('90');
  });

  it('records print audit then calls window.print', async() => {
    render(<SctPrintPreviewPage />);
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.PRINT_DO)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.PRINT_DO));
    await waitFor(() => {
      expect(mockRecordSctPrintAudit).toHaveBeenCalledWith('55');
    });
    expect(window.print).toHaveBeenCalled();
  });

  it('print CSS uses break-inside avoid and design tokens', () => {
    const cssPath = path.join(__dirname, '../sctPrint.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toMatch(/break-inside:\s*avoid/);
    expect(css).toMatch(/@page/);
    expect(css).toMatch(/var\(--mg-v2-/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
