/**
 * SCT 공개 응답 — 스모크 (렌더·캡션 rem·아동 하단바)
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import fs from 'fs';
import path from 'path';
import SctPublicPage from '../SctPublicPage';
import { SCT_TEST_ID, SCT_UI } from '../../../../constants/sctOnline';

jest.mock('../../../../utils/sctApi', () => ({
  fetchSctPublicMeta: jest.fn().mockResolvedValue({
    formType: 'CHILD',
    title: '문장완성 질문지',
    status: 'SENT',
    itemCount: 50,
    verifyChannelHint: 'PHONE',
    tokenExpiresAt: '2026-12-01T23:59:00',
    hasDraft: false,
    requiresGuardian: true,
    signerBand: 'UNDER_14'
  }),
  verifySctPublic: jest.fn(),
  fetchSctPublicForm: jest.fn(),
  saveSctDraft: jest.fn(),
  saveSctConsent: jest.fn(),
  submitSct: jest.fn()
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, preventDoubleClick, loading, ...rest }) => (
    <button type="button" onClick={onClick} disabled={disabled} {...rest}>{children}</button>
  )
}));

const renderPage = () => render(
  <MemoryRouter initialEntries={['/public/sct/test-token']}>
    <Routes>
      <Route path="/public/sct/:token" element={<SctPublicPage />} />
    </Routes>
  </MemoryRouter>
);

describe('SctPublicPage smoke', () => {
  it('renders public app shell after meta load', async() => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.PUBLIC_APP)).toBeInTheDocument();
    });
    expect(screen.getByTestId(SCT_TEST_ID.THUMB_BAR)).toBeInTheDocument();
    expect(screen.getByText(SCT_UI.START)).toBeInTheDocument();
  });

  it('caption class uses rem font-size token (0.75rem floor)', () => {
    const cssPath = path.join(__dirname, '../sctPublic.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toMatch(/\.mg-v2-sct-caption[\s\S]*font-size:\s*var\(--mg-v2-font-size-caption\)/);
    const tokenPath = path.join(
      __dirname,
      '../../../../styles/tokens/design-v2-tokens.css'
    );
    const tokens = fs.readFileSync(tokenPath, 'utf8');
    expect(tokens).toMatch(/--mg-v2-font-size-caption:\s*0\.75rem/);
  });
});
