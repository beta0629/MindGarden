/**
 * SCT 공개 — PHONE OTP 발송→확인 세션 흐름
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
  sendSctIdentityOtp,
  verifySctPublic
} from '../../../../utils/sctApi';

const META = Object.freeze({
  formType: 'ADULT',
  title: '문장완성 질문지',
  status: 'SENT',
  itemCount: 2,
  verifyChannelHint: 'PHONE',
  tokenExpiresAt: '2026-12-01T23:59:00',
  hasDraft: false,
  requiresGuardian: false,
  signerBand: 'ADULT',
  identityConsentSatisfied: true
});

const FORM = Object.freeze({
  formType: 'ADULT',
  title: '문장완성 질문지',
  status: 'SENT',
  items: [
    {
      formItemId: 1,
      itemNo: 1,
      promptText: '나는',
      domainCode: 'SELF',
      domainLabel: '자기',
      allowsNotApplicable: true,
      answerText: null,
      notApplicable: false
    }
  ],
  consent: { satisfied: true, guardianRequired: false }
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

describe('SctPublicPage PHONE OTP flow', () => {
  beforeEach(() => {
    localStorage.clear();
    fetchSctPublicMeta.mockReset();
    sendSctIdentityOtp.mockReset();
    confirmSctIdentityOtp.mockReset();
    verifySctPublic.mockReset();
    fetchSctPublicForm.mockReset();
    fetchSctPublicMeta.mockResolvedValue({ ...META });
    fetchSctPublicForm.mockResolvedValue({ ...FORM, items: FORM.items.map((it) => ({ ...it })) });
    sendSctIdentityOtp.mockResolvedValue({
      accepted: true,
      maskedPhone: '010-****-5678',
      expiresInSeconds: 180,
      resendCooldownSeconds: 60
    });
    confirmSctIdentityOtp.mockResolvedValue({
      verifySessionId: 'sid-otp',
      expiresInSeconds: 1800,
      consent: { satisfied: true, guardianRequired: false, revoked: false }
    });
  });

  it('PHONE: send → code → confirm → session (verifySctPublic 미호출)', async() => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.START)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(SCT_UI.START));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: SCT_UI.VERIFY })).toBeInTheDocument();
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
      target: { value: '123456' }
    });
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.OTP_CONFIRM));

    await waitFor(() => {
      expect(confirmSctIdentityOtp).toHaveBeenCalledWith('test-token', {
        phone: '01012345678',
        code: '123456'
      });
    });
    await waitFor(() => {
      expect(fetchSctPublicForm).toHaveBeenCalled();
    });
    expect(verifySctPublic).not.toHaveBeenCalled();
  });
});
