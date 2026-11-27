/**
 * SCT 공개 — 본인확인용 개인정보 동의 스텝
 *
 * @author MindGarden
 * @since 2026-11-27
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SctPublicPage from '../SctPublicPage';
import { SCT_TEST_ID, SCT_UI } from '../../../../constants/sctOnline';
import {
  fetchSctPublicMeta,
  saveSctConsent,
  verifySctPublic
} from '../../../../utils/sctApi';

const META = Object.freeze({
  formType: 'ADULT',
  title: '문장완성 질문지',
  status: 'SENT',
  itemCount: 50,
  verifyChannelHint: 'PHONE',
  tokenExpiresAt: '2026-12-01T23:59:00',
  hasDraft: false,
  requiresGuardian: false,
  signerBand: 'ADULT',
  identityConsentTitle: '본인확인용 개인정보 수집·이용 동의',
  identityConsentBody: '질문지를 작성하려면 본인확인이 필요합니다.',
  identityConsentVersion: 'identity-contact-2026-11-27',
  identityConsentSatisfied: false
});

jest.mock('../../../../utils/sctApi', () => ({
  fetchSctPublicMeta: jest.fn(),
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

describe('SctPublicPage identity consent', () => {
  beforeEach(() => {
    fetchSctPublicMeta.mockReset();
    saveSctConsent.mockReset();
    verifySctPublic.mockReset();
    fetchSctPublicMeta.mockResolvedValue({ ...META });
    saveSctConsent.mockResolvedValue({});
  });

  it('ENTRY → IDENTITY_CONSENT: primary disabled until checked', async() => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.START)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(SCT_UI.START));
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.IDENTITY_CONSENT_STEP)).toBeInTheDocument();
    });
    expect(screen.getByText(META.identityConsentTitle)).toBeInTheDocument();
    expect(screen.getByText(META.identityConsentBody)).toBeInTheDocument();
    const continueBtn = screen.getByText(SCT_UI.IDENTITY_CONSENT_CONTINUE);
    expect(continueBtn).toBeDisabled();
    expect(verifySctPublic).not.toHaveBeenCalled();
  });

  it('agree records IDENTITY_CONTACT without verifySessionId then opens VERIFY', async() => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.START)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(SCT_UI.START));
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.IDENTITY_CONSENT_STEP)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('checkbox', { name: SCT_UI.IDENTITY_CONSENT_REQUIRED }));
    const continueBtn = screen.getByText(SCT_UI.IDENTITY_CONSENT_CONTINUE);
    expect(continueBtn).not.toBeDisabled();
    fireEvent.click(continueBtn);
    await waitFor(() => {
      expect(saveSctConsent).toHaveBeenCalledWith('test-token', {
        consentType: 'IDENTITY_CONTACT',
        agreed: true
      });
    });
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.VERIFY_SUBMIT)).toBeInTheDocument();
    });
    expect(screen.queryByTestId(SCT_TEST_ID.IDENTITY_CONSENT_STEP)).not.toBeInTheDocument();
  });

  it('meta already satisfied skips IDENTITY_CONSENT to VERIFY', async() => {
    fetchSctPublicMeta.mockResolvedValue({
      ...META,
      identityConsentSatisfied: true
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.START)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(SCT_UI.START));
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.VERIFY_SUBMIT)).toBeInTheDocument();
    });
    expect(screen.queryByTestId(SCT_TEST_ID.IDENTITY_CONSENT_STEP)).not.toBeInTheDocument();
    expect(saveSctConsent).not.toHaveBeenCalled();
  });
});
