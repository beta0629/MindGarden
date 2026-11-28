/**
 * SCT 공개 — 같은 단말 재진입(단말 쿠키) 시 재인증 없이 이어쓰기, 쿠키 없으면 본인확인
 *
 * @author MindGarden
 * @since 2026-11-28
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SctPublicPage from '../SctPublicPage';
import {
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

describe('SctPublicPage device resume', () => {
  beforeEach(() => {
    localStorage.clear();
    [fetchSctPublicMeta, resumeSctDeviceSession, verifySctPublic, sendSctIdentityOtp,
      confirmSctIdentityOtp, fetchSctPublicForm, saveSctDraft, submitSct].forEach((fn) => fn.mockReset());
    fetchSctPublicMeta.mockResolvedValue({ ...META });
    fetchSctPublicForm.mockResolvedValue({ ...FORM, items: FORM.items.map((it) => ({ ...it })) });
    saveSctDraft.mockResolvedValue({});
    submitSct.mockResolvedValue({});
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('단말 쿠키 세션이 유효하면 OTP 없이 문항 화면으로 이어지고 세션 ID 를 저장소에 남기지 않는다', async() => {
    resumeSctDeviceSession.mockResolvedValue(resumeOk('sid-device-secret'));
    renderPage();
    await waitFor(() => {
      expect(fetchSctPublicForm).toHaveBeenCalledWith('test-token', 'sid-device-secret');
    });
    await waitFor(() => {
      expect(screen.getByText('나는')).toBeInTheDocument();
    });
    expect(sendSctIdentityOtp).not.toHaveBeenCalled();
    expect(confirmSctIdentityOtp).not.toHaveBeenCalled();
    const stored = [localStorage, sessionStorage]
      .map((st) => Object.keys(st).map((k) => st.getItem(k)).join('')).join('');
    expect(stored).not.toContain('sid-device-secret');
  });

  it('쿠키 없음(다른 단말·링크만 가진 사람) → 세션 없음 응답이면 시작 화면(본인확인 필요)', async() => {
    resumeSctDeviceSession.mockResolvedValue({});
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.LANDING_START)).toBeInTheDocument();
    });
    expect(fetchSctPublicForm).not.toHaveBeenCalled();
  });

  it('resume 호출 실패 시에도 본인확인으로 되돌린다(fail-closed)', async() => {
    resumeSctDeviceSession.mockRejectedValue(new Error('boom'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.LANDING_START)).toBeInTheDocument();
    });
    expect(fetchSctPublicForm).not.toHaveBeenCalled();
  });
});
