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

describe('AdminClientOffersPage', () => {
  beforeEach(() => {
    offerService.searchAdminClientsPage.mockResolvedValue({
      items: [{ id: 7, name: '한서윤', phoneLast4: '1234', maskedPhone: '010-****-1234' }], page: 0, size: 20, totalElements: 1
    });
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

  const makeClients = (from, count) => Array.from({ length: count }, (_, i) => ({
    id: from + i, name: `내담자${from + i}`, phoneLast4: '0000', maskedPhone: '010-****-0000'
  }));
  const pageOf = (total) => ({ page, size }) => {
    const from = page * size;
    return Promise.resolve({
      items: makeClients(from + 1, Math.max(Math.min(size, total - from), 0)), page, size, totalElements: total
    });
  };
  const scrollToEnd = (list) => {
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: 200 });
    Object.defineProperty(list, 'scrollTop', { configurable: true, writable: true, value: 800 });
    fireEvent.scroll(list);
  };
  const openList = async() => {
    const combo = await screen.findByTestId('admin-client-offers-client');
    await waitFor(() => expect(combo.disabled).toBe(false));
    fireEvent.focus(combo);
    return combo;
  };

  test('첫 페이지를 page 0·size 20 으로 받고, 결과를 자르지 않는다', async() => {
    renderPage();
    await waitFor(() => expect(offerService.searchAdminClientsPage).toHaveBeenCalledWith({ q: undefined, page: 0, size: 20 }));
    expect(offerService.searchAdminClientsPage).not.toHaveBeenCalledWith(expect.objectContaining({ size: 1000 }));
  });

  test('목록 끝까지 스크롤하면 다음 페이지를 이어 붙인다', async() => {
    offerService.searchAdminClientsPage.mockImplementation(pageOf(45));
    renderPage();
    await openList();
    expect(await screen.findAllByRole('option', { name: /내담자\d+/ })).toHaveLength(20);
    scrollToEnd(screen.getByRole('listbox'));
    await waitFor(() => expect(offerService.searchAdminClientsPage).toHaveBeenCalledWith({ q: undefined, page: 1, size: 20 }));
    await waitFor(() => expect(screen.getAllByRole('option', { name: /내담자\d+/ })).toHaveLength(40));
  });

  test('마지막 페이지까지 받으면 더 요청하지 않는다', async() => {
    offerService.searchAdminClientsPage.mockImplementation(pageOf(25));
    renderPage();
    await openList();
    await screen.findAllByRole('option', { name: /내담자\d+/ });
    scrollToEnd(screen.getByRole('listbox'));
    await waitFor(() => expect(screen.getAllByRole('option', { name: /내담자\d+/ })).toHaveLength(25));
    const calls = offerService.searchAdminClientsPage.mock.calls.length;
    scrollToEnd(screen.getByRole('listbox'));
    scrollToEnd(screen.getByRole('listbox'));
    await new Promise((r) => setTimeout(r, 50));
    expect(offerService.searchAdminClientsPage.mock.calls.length).toBe(calls);
    expect(offerService.searchAdminClientsPage).not.toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
  });

  test('검색어가 바뀌면 첫 페이지부터 다시 받고, 늦게 온 이전 응답은 결과를 덮지 않는다', async() => {
    let releaseOld;
    offerService.searchAdminClientsPage.mockImplementation(({ q, page, size }) => {
      if (q === '한서') {
        return Promise.resolve({ items: [{ id: 7, name: '한서윤', phoneLast4: '1234', maskedPhone: '010-****-1234' }], page, size, totalElements: 1 });
      }
      if (page === 1) {
        return new Promise((resolve) => { releaseOld = () => resolve({ items: makeClients(21, 20), page, size, totalElements: 45 }); });
      }
      return pageOf(45)({ q, page, size });
    });
    renderPage();
    const combo = await openList();
    await screen.findAllByRole('option', { name: /내담자\d+/ });
    scrollToEnd(screen.getByRole('listbox'));
    await waitFor(() => expect(offerService.searchAdminClientsPage).toHaveBeenCalledWith({ q: undefined, page: 1, size: 20 }));
    expect(screen.getByText('내담자를 더 불러오고 있습니다')).toBeTruthy();
    fireEvent.change(combo, { target: { value: '한서' } });
    await waitFor(() => expect(offerService.searchAdminClientsPage).toHaveBeenLastCalledWith({ q: '한서', page: 0, size: 20 }));
    expect(await screen.findByRole('option', { name: /한서윤/ })).toBeTruthy();
    await act(async() => { releaseOld(); });
    expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(1);
    expect(screen.queryByRole('option', { name: /내담자21/ })).toBeNull();
  });

  test('내담자 미선택이면 지정하기가 비활성이고 안내가 보인다', async() => {
    renderPage();
    expect((await screen.findAllByText('먼저 내담자를 선택해 주세요')).length).toBe(2);
    expect(screen.getByTestId('admin-client-offers-save').disabled).toBe(true);
  });

  test('뒷자리 검색으로 선택 → 미리보기·요약 한 줄 → 지정 요청에 최종가가 없다', async() => {
    renderPage();
    await pickClient();
    fireEvent.change(screen.getByLabelText('상품'), { target: { value: 'SRC1' } });
    fireEvent.click(screen.getByRole('radio', { name: '비율' }));
    fireEvent.change(screen.getByLabelText('할인 값'), { target: { value: '10' } });
    expect((await screen.findAllByText('396,000원'))[0]).toBeTruthy();
    expect(screen.getByText('한서윤 님에게 396,000원으로 지정합니다')).toBeTruthy();
    fireEvent.click(screen.getByTestId('admin-client-offers-save'));
    await waitFor(() => expect(offerService.createAdminClientOffer).toHaveBeenCalledWith({
      clientId: 7, sourceSkuCode: 'SRC1', discountType: 'RATE', discountValue: 10
    }));
  });

  test('기본은 정가 그대로: 값 없이 정가로 지정한다', async() => {
    renderPage();
    await pickClient();
    fireEvent.change(screen.getByLabelText('상품'), { target: { value: 'SRC1' } });
    expect(screen.getByText('할인 없음 · 정가')).toBeTruthy();
    expect(screen.getByText('한서윤 님에게 440,000원으로 지정합니다')).toBeTruthy();
    fireEvent.click(screen.getByTestId('admin-client-offers-save'));
    await waitFor(() => expect(offerService.createAdminClientOffer).toHaveBeenCalledWith({
      clientId: 7, sourceSkuCode: 'SRC1', discountType: 'NONE', discountValue: null
    }));
  });

  test('직접 입력: 정가와 같은 금액 허용, 정가 초과는 지정하기 비활성', async() => {
    renderPage();
    await pickClient();
    fireEvent.change(screen.getByLabelText('상품'), { target: { value: 'SRC1' } });
    fireEvent.click(screen.getByRole('radio', { name: '직접 입력' }));
    fireEvent.change(screen.getByLabelText('판매 금액'), { target: { value: '440001' } });
    expect(screen.getByTestId('admin-client-offers-save').disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('판매 금액'), { target: { value: '300000' } });
    expect(screen.getByText('한서윤 님에게 300,000원으로 지정합니다')).toBeTruthy();
    fireEvent.click(screen.getByTestId('admin-client-offers-save'));
    await waitFor(() => expect(offerService.createAdminClientOffer).toHaveBeenCalledWith({
      clientId: 7, sourceSkuCode: 'SRC1', discountType: 'PRICE', discountValue: 300000
    }));
  });

  test('저장 실패는 서버 문구를 그대로 보여 준다', async() => {
    offerService.createAdminClientOffer.mockRejectedValue(new Error('서버가 준 중복 안내 문구'));
    renderPage();
    await pickClient();
    fireEvent.change(screen.getByLabelText('상품'), { target: { value: 'SRC1' } });
    fireEvent.click(screen.getByRole('radio', { name: '비율' }));
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

  describe('빈 칸으로 열면 전체 목록 + 스크롤 더 불러오기 (80명, 20명×4페이지)', () => {
    const TOTAL = 80;
    const PAGE_SIZE = 20;
    // 실제 응답: ApiResponse<AdminClientSearchPage> → StandardizedApi 가 data 를 벗긴 {items, page, size, totalElements}
    const pageOf = (page) => ({
      items: Array.from({ length: PAGE_SIZE }, (_, i) => {
        const n = page * PAGE_SIZE + i + 1;
        return { id: n, name: `내담자${n}`, phoneLast4: null, maskedPhone: null };
      }),
      page,
      size: PAGE_SIZE,
      totalElements: TOTAL
    });

    beforeEach(() => {
      offerService.searchAdminClientsPage.mockImplementation(({ q, page }) => Promise.resolve(
        q ? { items: [], page, size: PAGE_SIZE, totalElements: 0 } : pageOf(page)
      ));
    });

    const openCombo = async() => {
      const combo = await screen.findByTestId('admin-client-offers-client');
      await waitFor(() => expect(combo.disabled).toBe(false));
      fireEvent.focus(combo);
      return screen.findByRole('listbox');
    };

    const scrollToEnd = (list) => {
      Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 1000 });
      Object.defineProperty(list, 'clientHeight', { configurable: true, value: 200 });
      list.scrollTop = 800;
      fireEvent.scroll(list);
    };

    test('열자마자 목록 표시', async() => {
      renderPage();
      const list = await openCombo();
      await waitFor(() => expect(within(list).getAllByRole('option', { name: /내담자/ })).toHaveLength(PAGE_SIZE));
      expect(offerService.searchAdminClientsPage).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0, size: PAGE_SIZE })
      );
      expect(offerService.searchAdminClientsPage.mock.calls[0][0].q).toBeFalsy();
    });

    test('끝까지 스크롤하면 80건 모두 표시', async() => {
      renderPage();
      const list = await openCombo();
      for (let loaded = PAGE_SIZE; loaded <= TOTAL; loaded += PAGE_SIZE) {
        // eslint-disable-next-line no-await-in-loop
        await waitFor(() => expect(within(list).getAllByRole('option', { name: /내담자/ })).toHaveLength(loaded));
        if (loaded < TOTAL) {
          // eslint-disable-next-line no-await-in-loop
          await act(async() => { scrollToEnd(list); });
        }
      }
      await act(async() => { scrollToEnd(list); });
      expect(within(list).getAllByRole('option', { name: /내담자/ })).toHaveLength(TOTAL);
      expect(offerService.searchAdminClientsPage).toHaveBeenCalledTimes(TOTAL / PAGE_SIZE);
    });

    test('선택 후 다시 열면 라벨 문자열로 요청하지 않고 전체 목록을 보여 준다', async() => {
      renderPage();
      const list = await openCombo();
      await waitFor(() => expect(within(list).getAllByRole('option', { name: /내담자/ })).toHaveLength(PAGE_SIZE));
      fireEvent.mouseDown(within(list).getByRole('option', { name: '내담자3' }));
      const combo = screen.getByTestId('admin-client-offers-client');
      expect(combo.value).toBe('');
      expect(combo.getAttribute('placeholder')).toBe('내담자3');

      fireEvent.click(combo);
      const reopened = await screen.findByRole('listbox');
      await waitFor(() => expect(within(reopened).getAllByRole('option', { name: /내담자/ })).toHaveLength(PAGE_SIZE));
      expect(within(reopened).getByRole('option', { name: '내담자3' }).getAttribute('aria-selected')).toBe('true');
      offerService.searchAdminClientsPage.mock.calls.forEach(([params]) => {
        expect(params.q || '').not.toContain('내담자3');
      });
    });

    test('선택 후 글자를 치면 라벨 없이 친 글자만 검색어로 보낸다', async() => {
      renderPage();
      const list = await openCombo();
      await waitFor(() => expect(within(list).getAllByRole('option', { name: /내담자/ })).toHaveLength(PAGE_SIZE));
      fireEvent.mouseDown(within(list).getByRole('option', { name: '내담자3' }));
      const combo = screen.getByTestId('admin-client-offers-client');
      fireEvent.change(combo, { target: { value: '7' } });
      await waitFor(() => expect(offerService.searchAdminClientsPage).toHaveBeenCalledWith(
        expect.objectContaining({ q: '7' })
      ));
      offerService.searchAdminClientsPage.mock.calls.forEach(([params]) => {
        expect(params.q || '').not.toContain('내담자3');
      });
    });
  });
});
