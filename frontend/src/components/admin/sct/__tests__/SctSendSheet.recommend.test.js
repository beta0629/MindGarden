/**
 * SCT 발송 시트 — 나이에 맞는 한쪽만 「· 추천」
 *
 * @author MindGarden
 * @since 2026-11-27
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SctSendSheet from '../SctSendSheet';
import { SCT_FORM_TYPE, SCT_UI } from '../../../../constants/sctOnline';
import { fetchSctForms, fetchSctSettings } from '../../../../utils/sctApi';

jest.mock('../../../../contexts/SessionContext', () => ({
  __esModule: true,
  SessionContext: { Consumer: ({ children }) => children({}) },
  useSession: () => ({ user: { role: 'ADMIN' } })
}));

jest.mock('../../../../utils/sctApi', () => ({
  fetchSctForms: jest.fn(),
  fetchSctSettings: jest.fn(),
  createSctInvitation: jest.fn()
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn(), success: jest.fn() }
}));

jest.mock('../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children, actions }) => (isOpen ? (
    <div data-testid="unified-modal">
      <div data-testid="unified-modal-body">{children}</div>
      <div data-testid="unified-modal-actions">{actions}</div>
    </div>
  ) : null)
}));

describe('SctSendSheet recommend label', () => {
  beforeEach(() => {
    fetchSctForms.mockResolvedValue([
      { formType: SCT_FORM_TYPE.ADULT },
      { formType: SCT_FORM_TYPE.ADOLESCENT }
    ]);
    fetchSctSettings.mockResolvedValue({ linkExpiryDays: 14 });
  });

  it('age 25 shows · 추천 only on ADULT', async() => {
    render(
      <SctSendSheet
        isOpen
        onClose={() => {}}
        client={{ id: 1, name: '성인', age: 25, phone: '010' }}
      />
    );
    await waitFor(() => {
      expect(screen.getByText(`성인용 · ${SCT_UI.RECOMMENDED}`)).toBeInTheDocument();
    });
    expect(screen.getByText('청소년용')).toBeInTheDocument();
    expect(screen.queryByText(`청소년용 · ${SCT_UI.RECOMMENDED}`)).not.toBeInTheDocument();
  });

  it('age 18 shows · 추천 only on ADOLESCENT', async() => {
    render(
      <SctSendSheet
        isOpen
        onClose={() => {}}
        client={{ id: 2, name: '청소년', age: 18, phone: '010' }}
      />
    );
    await waitFor(() => {
      expect(screen.getByText(`청소년용 · ${SCT_UI.RECOMMENDED}`)).toBeInTheDocument();
    });
    expect(screen.getByText('성인용')).toBeInTheDocument();
    expect(screen.queryByText(`성인용 · ${SCT_UI.RECOMMENDED}`)).not.toBeInTheDocument();
  });

  it('no age shows neither · 추천', async() => {
    render(
      <SctSendSheet
        isOpen
        onClose={() => {}}
        client={{ id: 3, name: '미상', phone: '010' }}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('성인용')).toBeInTheDocument();
    });
    expect(screen.getByText('청소년용')).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`· ${SCT_UI.RECOMMENDED}`))).not.toBeInTheDocument();
  });
});
