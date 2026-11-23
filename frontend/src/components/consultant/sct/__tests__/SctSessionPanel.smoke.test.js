/**
 * SctSessionPanel — 플래그 OFF 숨김 · 메모 버튼 44px(터치 타깃)
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

const mockUseSctFeatureEnabled = jest.fn();
const mockFetchSctSessionView = jest.fn();

jest.mock('../../../../hooks/useSctFeatureEnabled', () => ({
  __esModule: true,
  default: (...args) => mockUseSctFeatureEnabled(...args)
}));

jest.mock('../../../../utils/sctApi', () => ({
  fetchSctSessionView: (...args) => mockFetchSctSessionView(...args)
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

describe('SctSessionPanel', () => {
  beforeEach(() => {
    mockFetchSctSessionView.mockReset();
    mockFetchSctSessionView.mockResolvedValue({
      status: 'SUBMITTED',
      formType: 'ADULT',
      submittedAt: '2026-11-21',
      answers: [
        {
          formItemId: 1,
          itemNo: 1,
          promptText: '나는',
          domainCode: 'EMO',
          domainLabel: '정서',
          answerText: '괜찮다',
          notApplicable: false,
          isBlank: false
        }
      ]
    });
  });

  it('hides when feature flag is OFF', () => {
    mockUseSctFeatureEnabled.mockReturnValue({ enabled: false, loading: false });
    const { container } = render(<SctSessionPanel clientId={1} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId(SCT_TEST_ID.SESSION_PANEL)).not.toBeInTheDocument();
  });

  it('renders panel and memo button uses touch-target height token (44px)', async() => {
    mockUseSctFeatureEnabled.mockReturnValue({ enabled: true, loading: false });
    render(<SctSessionPanel clientId={1} />);
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.VIEW_BY_DOMAIN)).toBeInTheDocument();
    });
    expect(screen.getByTestId(SCT_TEST_ID.SESSION_PANEL)).toBeInTheDocument();
    expect(mockFetchSctSessionView).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId(SCT_TEST_ID.MEMO_ADD));
    expect(screen.getByLabelText(SCT_UI.MEMO_LABEL)).toBeInTheDocument();

    const cssPath = path.join(__dirname, '../../../admin/sct/sctAdmin.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toMatch(
      /\.mg-v2-sct-memo-add\s*\{[\s\S]*min-height:\s*var\(--mg-v2-touch-target-min\)/
    );
    const tokenPath = path.join(
      __dirname,
      '../../../../styles/tokens/design-v2-tokens.css'
    );
    const tokens = fs.readFileSync(tokenPath, 'utf8');
    expect(tokens).toMatch(/--mg-v2-touch-target-min:\s*2\.75rem/);
  });
});
