/**
 * SCT 공개 랜딩 4상태 — invite / expired / submitted / reissued
 *
 * @author MindGarden
 * @since 2026-11-27
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SctPublicPage from '../SctPublicPage';
import { SCT_TEST_ID, SCT_UI } from '../../../../constants/sctOnline';
import { fetchSctPublicMeta } from '../../../../utils/sctApi';

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

const BASE_META = Object.freeze({
  formType: 'ADULT',
  title: '성인용 문장완성 질문지',
  status: 'SENT',
  itemCount: 50,
  verifyChannelHint: 'PHONE',
  tokenExpiresAt: '2026-12-09T23:59:00',
  hasDraft: false,
  requiresGuardian: false,
  signerBand: 'ADULT',
  recipientName: '예시 내담자',
  officePhone: '032-724-8501',
  mobilePhone: '010-4285-8570'
});

const renderPage = () => render(
  <MemoryRouter initialEntries={['/public/sct/test-token']}>
    <Routes>
      <Route path="/public/sct/:token" element={<SctPublicPage />} />
    </Routes>
  </MemoryRouter>
);

describe('SctPublicPage landing states', () => {
  beforeEach(() => {
    fetchSctPublicMeta.mockReset();
  });

  test('invite — 시작하기 + office/mobile tel', async() => {
    fetchSctPublicMeta.mockResolvedValue({ ...BASE_META });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.LANDING)).toBeInTheDocument();
    });
    expect(screen.getByTestId(SCT_TEST_ID.LANDING)).toHaveAttribute('data-landing-kind', 'invite');
    expect(screen.getByTestId(SCT_TEST_ID.LANDING_START)).toHaveTextContent(SCT_UI.START);
    expect(screen.getByText(/예시 내담자/)).toBeInTheDocument();
    const office = screen.getByTestId(SCT_TEST_ID.LANDING_TEL_OFFICE);
    const mobile = screen.getByTestId(SCT_TEST_ID.LANDING_TEL_MOBILE);
    expect(office).toHaveAttribute('href', 'tel:0327248501');
    expect(mobile).toHaveAttribute('href', 'tel:01042858570');
    expect(screen.getByText(SCT_UI.LANDING_ID_NOTE_TITLE)).toBeInTheDocument();
  });

  test('expired — 기한 지남 + 전화 CTA', async() => {
    fetchSctPublicMeta.mockResolvedValue({ ...BASE_META, status: 'EXPIRED' });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.EXPIRED_TITLE)).toBeInTheDocument();
    });
    expect(screen.getByTestId(SCT_TEST_ID.LANDING)).toHaveAttribute('data-landing-kind', 'expired');
    expect(screen.getByTestId(SCT_TEST_ID.LANDING_TEL_OFFICE)).toHaveAttribute('href', 'tel:0327248501');
    expect(screen.queryByTestId(SCT_TEST_ID.LANDING_START)).not.toBeInTheDocument();
  });

  test('submitted — 제출 시각', async() => {
    fetchSctPublicMeta.mockResolvedValue({
      ...BASE_META,
      status: 'SUBMITTED',
      submittedAt: '2026-11-25T14:40:00'
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.ALREADY_TITLE)).toBeInTheDocument();
    });
    expect(screen.getByTestId(SCT_TEST_ID.LANDING)).toHaveAttribute('data-landing-kind', 'submitted');
    expect(screen.getByText('11월 25일 14:40')).toBeInTheDocument();
  });

  test('reissued — 닫힌 주소', async() => {
    fetchSctPublicMeta.mockResolvedValue({ ...BASE_META, status: 'REISSUED' });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(SCT_UI.REISSUED_TITLE)).toBeInTheDocument();
    });
    expect(screen.getByTestId(SCT_TEST_ID.LANDING)).toHaveAttribute('data-landing-kind', 'reissued');
    expect(screen.getByTestId(SCT_TEST_ID.LANDING_TEL_OFFICE)).toBeInTheDocument();
  });

  test('phones empty — invent 번호 없이 안내', async() => {
    fetchSctPublicMeta.mockResolvedValue({
      ...BASE_META,
      officePhone: null,
      mobilePhone: ''
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId(SCT_TEST_ID.LANDING)).toBeInTheDocument();
    });
    expect(screen.queryByTestId(SCT_TEST_ID.LANDING_TEL_OFFICE)).not.toBeInTheDocument();
    expect(screen.queryByTestId(SCT_TEST_ID.LANDING_TEL_MOBILE)).not.toBeInTheDocument();
    expect(screen.getByText(SCT_UI.LANDING_CONTACT_EMPTY)).toBeInTheDocument();
  });
});
