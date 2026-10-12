import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminClientOffersPage from '../AdminClientOffersPage';
import { adminClientsWithMappingGetAll } from '../../../api/adminListFetch';
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
jest.mock('../../../api/adminListFetch', () => ({
  adminClientsWithMappingGetAll: jest.fn()
}));
jest.mock('../../../services/shopClientOfferService');

const renderPage = () => render(<MemoryRouter><AdminClientOffersPage /></MemoryRouter>);

describe('AdminClientOffersPage', () => {
  beforeEach(() => {
    adminClientsWithMappingGetAll.mockResolvedValue([{ id: 7, name: '한서윤', phone: '010-1111-1234' }]);
    offerService.listAdminOfferSourceOptions.mockResolvedValue([
      { skuCode: 'SRC1', title: '부부상담 4회 패키지', unitPriceMinor: 440000, sessionCount: 4 }
    ]);
    offerService.listAdminClientOffers.mockResolvedValue([
      { id: 11, title: '개인상담 4회 패키지', discountType: 'RATE', discountValue: 15, finalPriceMinor: 272000, status: 'ACTIVE', paid: false, sessionCount: 4, createdAt: '2026-10-12T10:00:00' },
      { id: 12, title: '개인상담 1회', discountType: 'AMOUNT', discountValue: 10000, finalPriceMinor: 80000, status: 'ACTIVE', paid: true, sessionCount: 1, createdAt: '2026-09-14T10:00:00' }
    ]);
    offerService.createAdminClientOffer.mockResolvedValue({ id: 99 });
    offerService.cancelAdminClientOffer.mockResolvedValue({ id: 11 });
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

  test('내담자 미선택이면 지정하기가 비활성이고 안내가 보인다', async() => {
    renderPage();
    expect((await screen.findAllByText('먼저 내담자를 선택해 주세요')).length).toBe(2);
    expect(screen.getByTestId('admin-client-offers-save').disabled).toBe(true);
  });

  test('뒷자리 검색으로 선택 → 미리보기·요약 한 줄 → 지정 요청에 최종가가 없다', async() => {
    renderPage();
    await pickClient();
    fireEvent.change(screen.getByLabelText('상품'), { target: { value: 'SRC1' } });
    fireEvent.change(screen.getByLabelText('할인 값'), { target: { value: '10' } });
    expect((await screen.findAllByText('396,000원'))[0]).toBeTruthy();
    expect(screen.getByText('한서윤 님에게 396,000원으로 지정합니다')).toBeTruthy();
    fireEvent.click(screen.getByTestId('admin-client-offers-save'));
    await waitFor(() => expect(offerService.createAdminClientOffer).toHaveBeenCalledWith({
      clientId: 7, sourceSkuCode: 'SRC1', discountType: 'RATE', discountValue: 10
    }));
  });

  test('저장 실패는 서버 문구를 그대로 보여 준다', async() => {
    offerService.createAdminClientOffer.mockRejectedValue(new Error('서버가 준 중복 안내 문구'));
    renderPage();
    await pickClient();
    fireEvent.change(screen.getByLabelText('상품'), { target: { value: 'SRC1' } });
    fireEvent.change(screen.getByLabelText('할인 값'), { target: { value: '10' } });
    fireEvent.click(await screen.findByTestId('admin-client-offers-save'));
    expect(await screen.findByText('서버가 준 중복 안내 문구')).toBeTruthy();
  });

  test('「지정 취소」는 결제 대기 행에만, 눌러 확인 모달에서 돌아가기에 초점', async() => {
    renderPage();
    await pickClient();
    const cancelButtons = await screen.findAllByRole('button', { name: /지정 취소$/ });
    expect(cancelButtons).toHaveLength(1);
    expect(cancelButtons[0].getAttribute('aria-label')).toBe('개인상담 4회 패키지 지정 취소');
    fireEvent.click(cancelButtons[0]);
    const back = await screen.findByTestId('admin-client-offers-cancel-back');
    await waitFor(() => expect(document.activeElement).toBe(back));
    fireEvent.click(screen.getAllByRole('button', { name: '지정 취소' }).pop());
    await waitFor(() => expect(offerService.cancelAdminClientOffer).toHaveBeenCalledWith(11));
  });
});
