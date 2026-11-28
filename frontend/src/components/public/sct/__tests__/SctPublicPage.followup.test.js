/**
 * SCT 공개 — 후속: 취소 링크 분리 표시, 한글 오류 매핑·남은 대기시간, 다음 버튼 중복 클릭 방지
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
  resumeSctDeviceSession,
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
  resumeSctDeviceSession: jest.fn(),
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


const resumeOk = (sid = 'sid-device') => ({
  verifySessionId: sid,
  expiresInSeconds: 86400,
  consent: { satisfied: true, guardianRequired: false, revoked: false }
});


const apiError = (status, errorCode, message, data) => {
  const err = new Error(message || 'x');
  err.status = status;
  err.response = { status, data: { errorCode, message, ...(data ? { data } : {}) } };
  return err;
};

const manyItems = (n) => Array.from({ length: n }, (_, i) => ({
  formItemId: i + 1,
  itemNo: i + 1,
  promptText: `문항${i + 1}번 문장`,
  domainCode: 'SELF',
  domainLabel: '자기',
  allowsNotApplicable: true,
  answerText: null,
  notApplicable: false
}));

describe('SctPublicPage follow-up (cancelled / errors / step guard)', () => {
  beforeEach(() => {
    localStorage.clear();
    [fetchSctPublicMeta, resumeSctDeviceSession, verifySctPublic, sendSctIdentityOtp,
      confirmSctIdentityOtp, fetchSctPublicForm, saveSctDraft, submitSct].forEach((fn) => fn.mockReset());
    fetchSctPublicMeta.mockResolvedValue({ ...META });
    resumeSctDeviceSession.mockResolvedValue({});
    fetchSctPublicForm.mockResolvedValue({ ...FORM, items: FORM.items.map((it) => ({ ...it })) });
    saveSctDraft.mockResolvedValue({});
  });

  it('취소된 초대(meta CANCELLED)는 「센터에서 취소한 링크」이며 만료 문구·기한 문구가 없다', async() => {
    fetchSctPublicMeta.mockResolvedValue({ ...META, status: 'CANCELLED' });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.CANCELLED_TITLE)).toBeInTheDocument();
    });
    expect(screen.queryByText(SCT_UI.EXPIRED_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(SCT_UI.EXPIRED_BADGE)).not.toBeInTheDocument();
    expect(screen.queryByText(/열려 있던 링크/)).not.toBeInTheDocument();
  });

  it('meta 410 + SCT_LINK_CANCELLED → 취소 안내(만료 아님)', async() => {
    fetchSctPublicMeta.mockRejectedValue(
      apiError(410, SCT_ERROR_CODE.LINK_CANCELLED, SCT_UI.CANCELLED_BODY));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.CANCELLED_TITLE)).toBeInTheDocument();
    });
    expect(screen.queryByText(SCT_UI.EXPIRED_TITLE)).not.toBeInTheDocument();
  });

  it('기한 만료(meta EXPIRED)는 기존 만료 안내 유지', async() => {
    fetchSctPublicMeta.mockResolvedValue({ ...META, status: 'EXPIRED' });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.EXPIRED_TITLE)).toBeInTheDocument();
    });
    expect(screen.queryByText(SCT_UI.CANCELLED_TITLE)).not.toBeInTheDocument();
  });

  const openVerifyAndSend = async() => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.LANDING_START)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.LANDING_START));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: SCT_UI.VERIFY })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(SCT_UI.PHONE_SEGMENT), {
      target: { value: '01012345678' }
    });
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.OTP_SEND));
  };

  it('서버 영문 원문(Session was invalidated)은 화면에 나오지 않고 한글 안내가 나온다', async() => {
    sendSctIdentityOtp.mockRejectedValue(
      apiError(400, 'ILLEGAL_STATE', 'Session was invalidated'));
    await openVerifyAndSend();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Session was invalidated/)).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/[가-힣]/);
  });

  it('SESSION_INVALIDATED 코드는 한글 문구로 매핑된다', async() => {
    sendSctIdentityOtp.mockRejectedValue(
      apiError(400, SCT_ERROR_CODE.SESSION_INVALIDATED, 'Session was invalidated'));
    await openVerifyAndSend();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(SCT_UI.ERR_SESSION_INVALIDATED);
    });
  });

  it('OTP 429 는 남은 대기 시간을 분 단위로 보여 준다(코드·번호 미노출)', async() => {
    sendSctIdentityOtp.mockRejectedValue(
      apiError(429, SCT_ERROR_CODE.OTP_RATE_LIMITED, '요청이 너무 많습니다.', { retryAfterSeconds: 1500 }));
    await openVerifyAndSend();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('약 25분 뒤');
    });
    expect(screen.getByRole('alert')).not.toHaveTextContent('01012345678');
  });

  it('다음 버튼 연속 클릭(저장 대기 중)은 한 단계만 이동하고 빈 단계가 생기지 않는다', async() => {
    resumeSctDeviceSession.mockResolvedValue(resumeOk('sid-x'));
    fetchSctPublicForm.mockResolvedValue({ ...FORM, items: manyItems(12) });
    let release;
    saveSctDraft.mockImplementation(() => new Promise((resolve) => { release = () => resolve({}); }));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('문항1번 문장')).toBeInTheDocument();
    });
    const next = screen.getByText(SCT_UI.NEXT);
    fireEvent.click(next);
    fireEvent.click(next);
    fireEvent.click(next);
    await waitFor(() => expect(release).toBeDefined());
    release();
    await waitFor(() => {
      expect(screen.getByText('문항6번 문장')).toBeInTheDocument();
    });
    // 두 번째 페이지(6~10)만 보인다 — 3페이지(11~12)로 건너뛰지 않았다
    expect(screen.queryByText('문항11번 문장')).not.toBeInTheDocument();
    expect(screen.queryByText('문항1번 문장')).not.toBeInTheDocument();
    expect(screen.getByText(SCT_UI.PREV)).toBeInTheDocument();
  });

  it('이전 버튼은 첫 페이지 이후 정상 동작한다(무반응 없음)', async() => {
    resumeSctDeviceSession.mockResolvedValue(resumeOk('sid-x'));
    fetchSctPublicForm.mockResolvedValue({ ...FORM, items: manyItems(12) });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('문항1번 문장')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(SCT_UI.NEXT));
    await waitFor(() => {
      expect(screen.getByText('문항6번 문장')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(SCT_UI.PREV));
    await waitFor(() => {
      expect(screen.getByText('문항1번 문장')).toBeInTheDocument();
    });
  });
});
