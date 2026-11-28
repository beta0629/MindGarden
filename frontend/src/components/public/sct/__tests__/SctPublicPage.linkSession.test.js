/**
 * SCT 공개 — 단축 링크 교환 코드 만료(410)·없음(404) 구분, 저장 실패 시 제출 차단
 *
 * @author MindGarden
 * @since 2026-11-28
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SctPublicPage from '../SctPublicPage';
import {
  SCT_ERROR_CODE,
  SCT_TEST_ID,
  SCT_UI
} from '../../../../constants/sctOnline';
import {
  confirmSctIdentityOtp,
  fetchSctPublicForm,
  fetchSctPublicMeta,
  saveSctDraft,
  sendSctIdentityOtp,
  submitSct,
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
  // 재개 경로 테스트는 IDENTITY_CONSENT 를 이미 충족한 상태로 고정
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
    },
    {
      formItemId: 2,
      itemNo: 2,
      promptText: '우리 집은',
      domainCode: 'FAMILY',
      domainLabel: '가족',
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

const verifyOk = (sid = 'sid-1') => ({
  verifySessionId: sid,
  expiresInSeconds: 1800,
  consent: { satisfied: true, guardianRequired: false, revoked: false }
});

const completePhoneOtp = async(sid = 'sid-fresh') => {
  sendSctIdentityOtp.mockResolvedValueOnce({
    accepted: true,
    maskedPhone: '010-****-5678',
    expiresInSeconds: 180,
    resendCooldownSeconds: 60
  });
  confirmSctIdentityOtp.mockResolvedValueOnce(verifyOk(sid));
  const phoneInput = screen.getByLabelText(SCT_UI.PHONE_SEGMENT);
  fireEvent.change(phoneInput, { target: { value: '01012345678' } });
  fireEvent.click(screen.getByText(SCT_UI.OTP_SEND));
  await waitFor(() => {
    expect(screen.getByTestId(SCT_TEST_ID.OTP_CODE)).toBeInTheDocument();
  });
  fireEvent.change(screen.getByTestId(SCT_TEST_ID.OTP_CODE), {
    target: { value: '123456' }
  });
  fireEvent.click(screen.getByText(SCT_UI.OTP_CONFIRM));
};

const linkExpiredError = () => {
  const err = new Error(SCT_UI.LINK_SESSION_EXPIRED);
  err.status = 410;
  err.response = {
    status: 410,
    data: { errorCode: SCT_ERROR_CODE.LINK_SESSION_EXPIRED, message: SCT_UI.LINK_SESSION_EXPIRED }
  };
  return err;
};

describe('SctPublicPage link session', () => {
  beforeEach(() => {
    localStorage.clear();
    [fetchSctPublicMeta, verifySctPublic, sendSctIdentityOtp, confirmSctIdentityOtp,
      fetchSctPublicForm, saveSctDraft, submitSct].forEach((fn) => fn.mockReset());
    fetchSctPublicMeta.mockResolvedValue({ ...META });
    fetchSctPublicForm.mockResolvedValue({ ...FORM, items: FORM.items.map((it) => ({ ...it })) });
    saveSctDraft.mockResolvedValue({});
    submitSct.mockResolvedValue({});
  });

  afterEach(() => {
    localStorage.clear();
  });

  const goToReview = async() => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.LANDING_START)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.LANDING_START));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: SCT_UI.VERIFY })).toBeInTheDocument();
    });
    await completePhoneOtp('sid-fresh');
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.SUBMIT)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(SCT_UI.SUBMIT));
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.SUBMIT_CONFIRM)).toBeInTheDocument();
    });
  };

  it('제출 직전 저장이 410(링크 사용 시간 초과)이면 제출하지 않고 안내, 답은 localStorage 에 남기지 않음', async() => {
    await goToReview();
    saveSctDraft.mockRejectedValue(linkExpiredError());

    fireEvent.click(screen.getByText(SCT_UI.SUBMIT));

    await waitFor(() => {
      expect(screen.getAllByText(SCT_UI.LINK_SESSION_EXPIRED).length).toBeGreaterThanOrEqual(1);
    });
    expect(submitSct).not.toHaveBeenCalled();
    expect(screen.queryByText(SCT_UI.DONE_TITLE)).not.toBeInTheDocument();
    const stored = Object.keys(localStorage).map((k) => localStorage.getItem(k)).join('');
    expect(stored).not.toContain('나는');
  });

  it('제출 직전 저장이 네트워크 등으로 실패하면 제출 차단 안내', async() => {
    await goToReview();
    const netErr = new Error('network');
    netErr.isNetworkError = true;
    saveSctDraft.mockRejectedValue(netErr);

    fireEvent.click(screen.getByText(SCT_UI.SUBMIT));

    await waitFor(() => {
      expect(screen.getByText(SCT_UI.SAVE_BEFORE_SUBMIT_FAIL)).toBeInTheDocument();
    });
    expect(submitSct).not.toHaveBeenCalled();
  });

  it('meta 410 + SCT_LINK_SESSION_EXPIRED → 링크 사용 시간 안내(작성 기한 만료와 구분)', async() => {
    fetchSctPublicMeta.mockRejectedValue(linkExpiredError());
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.LINK_SESSION_EXPIRED_TITLE)).toBeInTheDocument();
    });
    expect(screen.queryByText(SCT_UI.EXPIRED_TITLE)).not.toBeInTheDocument();
  });

  it('meta 404 → 링크 없음 안내', async() => {
    const err = new Error('SCT 링크를 찾을 수 없습니다.');
    err.status = 404;
    fetchSctPublicMeta.mockRejectedValue(err);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.INVALID_LINK_TITLE)).toBeInTheDocument();
    });
    expect(screen.queryByText(SCT_UI.LINK_SESSION_EXPIRED_TITLE)).not.toBeInTheDocument();
  });
});
