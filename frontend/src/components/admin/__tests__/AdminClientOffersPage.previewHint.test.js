import React from 'react';
import { act, render, within, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminClientOffersPage from '../AdminClientOffersPage';
import * as offerService from '../../../services/shopClientOfferService';

jest.mock('react-i18next', () => {
  // eslint-disable-next-line global-require
  const ko = require('../../../locales/ko/adminClientOffers.json');
  const lookup = (key) => key.split('.').reduce((o, k) => (o ? o[k] : undefined), ko);
  return {
    useTranslation: () => ({
      t: (key, vars) => {
        const raw = lookup(key);
        if (typeof raw !== 'string') {
          return key;
        }
        return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars && vars[k] != null ? vars[k] : ''));
      }
    })
  };
});
jest.mock('../../layout/AdminCommonLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('../../dashboard-v2/content', () => ({
  ContentArea: ({ children }) => <div>{children}</div>,
  ContentHeader: ({ title }) => <h1>{title}</h1>
}));
jest.mock('../../../contexts/SessionContext', () => ({
  // eslint-disable-next-line global-require
  SessionContext: require('react').createContext(null),
  useSession: () => ({ user: { id: 1, role: 'ADMIN' }, isLoggedIn: true, isLoading: false })
}));
jest.mock('../../../services/shopClientOfferService');

const renderPage = () => render(<MemoryRouter><AdminClientOffersPage /></MemoryRouter>);

const ko = require('../../../locales/ko/adminClientOffers.json');

describe('AdminClientOffersPage 미리보기 안내', () => {
  beforeEach(() => {
    offerService.searchAdminClientsPage.mockResolvedValue({
      items: [{ id: 7, name: '한서윤', phoneLast4: '1234', maskedPhone: '010-****-1234' }], page: 0, size: 20, totalElements: 1
    });
    offerService.listAdminOfferSourceOptions.mockResolvedValue([
      { skuCode: 'SRC1', title: '부부상담 4회 패키지', unitPriceMinor: 440000, sessionCount: 4 }
    ]);
    offerService.listAdminClientOffers.mockResolvedValue([]);
  });
  afterEach(() => jest.clearAllMocks());

  const pickClient = async() => {
    await waitFor(() => expect(offerService.listAdminOfferSourceOptions).toHaveBeenCalled());
    const combo = await screen.findByTestId('admin-client-offers-client');
    await waitFor(() => expect(combo.disabled).toBe(false));
    fireEvent.focus(combo);
    fireEvent.change(combo, { target: { value: '1234' } });
    fireEvent.mouseDown(await screen.findByRole('option', { name: /한서윤/ }));
    await waitFor(() => expect(offerService.listAdminClientOffers).toHaveBeenCalledWith('7'));
  };
  const hint = () => screen.getByTestId('admin-client-offers-preview-hint').textContent;

  test('상품 미선택이면 상품 선택 안내를 보여 준다', async() => {
    renderPage();
    await pickClient();
    fireEvent.click(screen.getByRole('radio', { name: '직접 입력' }));
    fireEvent.change(screen.getByLabelText('판매 금액'), { target: { value: '100000' } });
    expect(hint()).toBe(ko.form.previewSelectProduct);
  });

  test('상품 선택 후 직접 입력 금액이 바로 반영되고, 정가 초과면 안내한다', async() => {
    renderPage();
    await pickClient();
    fireEvent.change(screen.getByLabelText('상품'), { target: { value: 'SRC1' } });
    fireEvent.click(screen.getByRole('radio', { name: '직접 입력' }));
    fireEvent.change(screen.getByLabelText('판매 금액'), { target: { value: '100000' } });
    expect(screen.getAllByText('100,000원').length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText('판매 금액'), { target: { value: '440001' } });
    expect(hint()).toBe('판매 금액은 정가(440,000원) 이하로 입력해 주세요');
  });
});
