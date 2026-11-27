/**
 * SCT 공개 — 본인확인 세션 만료 후 재확인·제출 재개
 *
 * @author MindGarden
 * @since 2026-03-27
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
  fetchSctPublicForm,
  fetchSctPublicMeta,
  saveSctDraft,
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
  signerBand: 'ADULT'
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

describe('SctPublicPage verify resume', () => {
  beforeEach(() => {
    localStorage.clear();
    fetchSctPublicMeta.mockReset();
    verifySctPublic.mockReset();
    fetchSctPublicForm.mockReset();
    saveSctDraft.mockReset();
    submitSct.mockReset();
    fetchSctPublicMeta.mockResolvedValue({ ...META });
    fetchSctPublicForm.mockResolvedValue({ ...FORM, items: FORM.items.map((it) => ({ ...it })) });
    saveSctDraft.mockResolvedValue({});
    verifySctPublic.mockResolvedValue(verifyOk('sid-fresh'));
  });

  afterEach(() => {
    localStorage.clear();
  });

  const goToReview = async() => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.START)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(SCT_UI.START));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: SCT_UI.VERIFY })).toBeInTheDocument();
    });
    const phoneInput = screen.getByLabelText(SCT_UI.PHONE_SEGMENT);
    fireEvent.change(phoneInput, { target: { value: '01012345678' } });
    fireEvent.click(screen.getByText(SCT_UI.VERIFY_SUBMIT));
    await waitFor(() => {
      expect(fetchSctPublicForm).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.SUBMIT)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(SCT_UI.SUBMIT));
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.SUBMIT_CONFIRM)).toBeInTheDocument();
    });
  };

  it('submit SCT_VERIFY_REQUIRED → CTA → re-verify → submit again → DONE', async() => {
    const verifyErr = new Error('본인 확인이 필요합니다.');
    verifyErr.status = 401;
    verifyErr.response = {
      data: {
        errorCode: SCT_ERROR_CODE.VERIFY_REQUIRED,
        message: '본인 확인이 필요합니다.'
      }
    };
    submitSct
      .mockRejectedValueOnce(verifyErr)
      .mockResolvedValueOnce({});

    await goToReview();

    fireEvent.click(screen.getByText(SCT_UI.SUBMIT));

    await waitFor(() => {
      expect(screen.getByText(SCT_UI.VERIFY_TO_SUBMIT)).toBeInTheDocument();
    });
    expect(screen.getByTestId(SCT_TEST_ID.VERIFY_REQUIRED_ALERT)).toBeInTheDocument();
    const againButtons = screen.getAllByText(SCT_UI.VERIFY_AGAIN);
    expect(againButtons.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByTestId(SCT_TEST_ID.VERIFY_AGAIN));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: SCT_UI.VERIFY })).toBeInTheDocument();
    });

    verifySctPublic.mockResolvedValueOnce(verifyOk('sid-2'));
    const phoneInput = screen.getByLabelText(SCT_UI.PHONE_SEGMENT);
    fireEvent.change(phoneInput, { target: { value: '01012345678' } });
    fireEvent.click(screen.getByText(SCT_UI.VERIFY_SUBMIT));

    await waitFor(() => {
      expect(submitSct).toHaveBeenCalledTimes(2);
    });
    expect(submitSct.mock.calls[1][1]).toEqual({ verifySessionId: 'sid-2' });
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.DONE_TITLE)).toBeInTheDocument();
    });
  });

  it('leave/expire/revisit — server draft resumes at first unanswered then submit', async() => {
    const pages = [];
    for (let i = 1; i <= 6; i += 1) {
      pages.push({
        formItemId: i,
        itemNo: i,
        promptText: `문항 ${i}`,
        domainCode: 'SELF',
        domainLabel: '자기',
        allowsNotApplicable: true,
        answerText: i <= 5 ? `답 ${i}` : null,
        notApplicable: false
      });
    }
    fetchSctPublicMeta.mockResolvedValue({
      ...META,
      status: 'DRAFT',
      hasDraft: true,
      itemCount: 6
    });
    fetchSctPublicForm.mockResolvedValue({
      ...FORM,
      status: 'DRAFT',
      items: pages,
      consent: { satisfied: true, guardianRequired: false }
    });
    submitSct.mockResolvedValue({});

    renderPage();
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.RESUME)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(SCT_UI.RESUME));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: SCT_UI.VERIFY })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(SCT_UI.PHONE_SEGMENT), {
      target: { value: '01012345678' }
    });
    fireEvent.click(screen.getByText(SCT_UI.VERIFY_SUBMIT));

    await waitFor(() => {
      expect(screen.getByText('문항 6')).toBeInTheDocument();
    });
    expect(screen.queryByText('문항 1')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(SCT_UI.SUBMIT));
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.SUBMIT_CONFIRM)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(SCT_UI.SUBMIT));
    await waitFor(() => {
      expect(submitSct).toHaveBeenCalled();
      expect(screen.getByText(SCT_UI.DONE_TITLE)).toBeInTheDocument();
    });
  });
});
