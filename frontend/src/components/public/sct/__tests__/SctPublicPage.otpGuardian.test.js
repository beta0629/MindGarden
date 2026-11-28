/**
 * SCT 공개 — 보호자 경로: IDENTITY 동의 → OTP send/confirm → GUARDIAN
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
  confirmSctIdentityOtp,
  fetchSctPublicForm,
  fetchSctPublicMeta,
  saveSctConsent,
  sendSctIdentityOtp,
  verifySctPublic
} from '../../../../utils/sctApi';

const META = Object.freeze({
  formType: 'ADOLESCENT',
  title: '문장완성 질문지',
  status: 'SENT',
  itemCount: 50,
  verifyChannelHint: 'PHONE',
  tokenExpiresAt: '2026-12-01T23:59:00',
  hasDraft: false,
  requiresGuardian: true,
  signerBand: 'UNDER_14',
  identityConsentTitle: '본인확인용 개인정보 수집·이용 동의',
  identityConsentBody: '질문지를 작성하려면 본인확인이 필요합니다.',
  identityConsentVersion: 'identity-contact-2026-11-27',
  identityConsentSatisfied: false
});

jest.mock('../../../../utils/sctApi', () => ({
  fetchSctPublicMeta: jest.fn(),
  verifySctPublic: jest.fn(),
  sendSctIdentityOtp: jest.fn(),
  confirmSctIdentityOtp: jest.fn(),
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

describe('SctPublicPage OTP guardian path', () => {
  beforeEach(() => {
    localStorage.clear();
    fetchSctPublicMeta.mockReset();
    saveSctConsent.mockReset();
    sendSctIdentityOtp.mockReset();
    confirmSctIdentityOtp.mockReset();
    verifySctPublic.mockReset();
    fetchSctPublicForm.mockReset();
    fetchSctPublicMeta.mockResolvedValue({ ...META });
    saveSctConsent.mockResolvedValue({});
    sendSctIdentityOtp.mockResolvedValue({
      accepted: true,
      maskedPhone: '010-****-5678',
      expiresInSeconds: 180,
      resendCooldownSeconds: 60
    });
    confirmSctIdentityOtp.mockResolvedValue({
      verifySessionId: 'sid-guardian-otp',
      expiresInSeconds: 1800,
      consent: {
        satisfied: false,
        guardianRequired: true,
        requiresGuardian: true,
        revoked: false
      }
    });
  });

  it('IDENTITY 동의 → OTP send/confirm → GUARDIAN (동일 OTP API)', async() => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.LANDING_START)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.LANDING_START));

    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.IDENTITY_CONSENT_STEP)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('checkbox', { name: SCT_UI.IDENTITY_CONSENT_REQUIRED }));
    fireEvent.click(screen.getByText(SCT_UI.IDENTITY_CONSENT_CONTINUE));
    await waitFor(() => {
      expect(saveSctConsent).toHaveBeenCalledWith('test-token', {
        consentType: 'IDENTITY_CONTACT',
        agreed: true
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.OTP_SEND)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(SCT_UI.PHONE_SEGMENT), {
      target: { value: '01012345678' }
    });
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.OTP_SEND));
    await waitFor(() => {
      expect(sendSctIdentityOtp).toHaveBeenCalledWith('test-token', { phone: '01012345678' });
    });
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.OTP_CODE)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId(SCT_TEST_ID.OTP_CODE), {
      target: { value: '654321' }
    });
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.OTP_CONFIRM));
    await waitFor(() => {
      expect(confirmSctIdentityOtp).toHaveBeenCalledWith('test-token', {
        phone: '01012345678',
        code: '654321'
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.GUARDIAN_STEP)).toBeInTheDocument();
    });
    expect(screen.getByText(SCT_UI.GUARDIAN_DONE)).toBeInTheDocument();
    expect(fetchSctPublicForm).not.toHaveBeenCalled();
    expect(verifySctPublic).not.toHaveBeenCalled();
  });
});
