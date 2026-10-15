import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ClientOffersPage from '../ClientOffersPage';
import { listMyClientOffers } from '../../../../services/shopClientOfferService';
import { fetchConsultantMappings } from '../../../../services/clientShopService';
import { runShopCheckoutWithPortOneGuard } from '../../../../utils/shopCheckoutPortOneGuard';
import { useClientShopAuth } from '../../../../hooks/useClientShopAuth';

import { CLIENT_MALL_PHONE_COPY, CLIENT_MALL_USAGE_BANNER_EXAMPLE } from '../../../../constants/clientMallConstants';

jest.mock('react-i18next', () => {
  // eslint-disable-next-line global-require
  const ko = require('../../../../locales/ko/clientOffers.json');
  const lookup = (key) => key.split('.').reduce((o, k) => (o ? o[k] : undefined), ko);
  return {
    useTranslation: () => ({
      t: (key, vars) => {
        const raw = lookup(key);
        return typeof raw === 'string'
          ? raw.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars && vars[k] != null ? vars[k] : ''))
          : key;
      }
    })
  };
});
jest.mock('../../../../components/shop/templates/ShopClientLayout', () => ({ title, children }) => (
  <main><h1>{title}</h1>{children}</main>
));
jest.mock('../../../../components/shop/templates/ShopClientSessionLoading', () => () => <div>loading</div>);
jest.mock('../../../../contexts/SessionContext', () => ({ useSession: () => ({ checkSession: jest.fn() }) }));
jest.mock('../../../../hooks/useClientShopAuth', () => ({ useClientShopAuth: jest.fn() }));
jest.mock('../../../../hooks/useShopPaymentCancelNotice', () => () => ({ visible: false, dismiss: () => {} }));
jest.mock('../../../../services/shopClientOfferService', () => ({ listMyClientOffers: jest.fn() }));
jest.mock('../../../../services/clientShopService', () => ({
  cancelShopOrder: jest.fn(),
  cancelShopPaymentByUser: jest.fn(),
  fetchConsultantMappings: jest.fn(),
  postShopCheckout: jest.fn(),
  prepareShopPayment: jest.fn()
}));
jest.mock('../../../../utils/shopCheckoutPortOneGuard', () => ({ runShopCheckoutWithPortOneGuard: jest.fn() }));
jest.mock('../../../../utils/shopPortOneCheckout', () => ({ runShopPortOnePaymentIfReady: jest.fn() }));

const OFFER = (id, extra = {}) => ({
  id,
  offerSkuCode: `OFFER_${id}`,
  title: `상품${id}`,
  discountType: 'RATE',
  discountValue: 10,
  originalPriceMinor: 440000,
  finalPriceMinor: 396000,
  status: 'ACTIVE',
  paid: false,
  sessionCount: 4,
  validityMonths: 3,
  ...extra
});
const VERIFIED_USER = { id: 5, name: '한서윤', phone: '01011111234', phoneVerified: true, phoneVerifiedAt: '2026-10-01T00:00:00' };

const renderPage = () => render(<MemoryRouter initialEntries={['/client/offers']}><ClientOffersPage /></MemoryRouter>);

describe('ClientOffersPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    useClientShopAuth.mockReturnValue({ sessionLoading: false, isLoggedIn: true, user: VERIFIED_USER });
    fetchConsultantMappings.mockResolvedValue([{ mappingId: 1, consultantId: 9, consultantName: '박지안' }]);
  });

  test('결제 완료 건은 숨기고, 상품이 1개면 자동 선택된다', async() => {
    listMyClientOffers.mockResolvedValue([OFFER(1), OFFER(2, { paid: true })]);
    renderPage();
    expect(await screen.findByText('결제할 수 있는 상품 1개')).toBeTruthy();
    expect(screen.getAllByTestId('client-offers-card')).toHaveLength(1);
    expect(screen.getByTestId('client-offers-card').getAttribute('aria-checked')).toBe('true');
  });

  test('약관은 기본 미체크라 결제가 비활성이고 이유가 연결된다', async() => {
    listMyClientOffers.mockResolvedValue([OFFER(1)]);
    renderPage();
    const pay = await screen.findByTestId('client-offers-pay');
    expect(pay.getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByText('전체 동의 후 결제할 수 있어요')).toBeTruthy();
    fireEvent.click(pay);
    expect(runShopCheckoutWithPortOneGuard).not.toHaveBeenCalled();
  });

  test('상품 2개면 자동 선택하지 않고 「선택하기」로 고른다, 주 버튼은 하단 결제하기 하나', async() => {
    listMyClientOffers.mockResolvedValue([OFFER(1), OFFER(2)]);
    renderPage();
    await screen.findByText('결제할 수 있는 상품 2개');
    expect(screen.getByText('결제할 상품을 골라 주세요')).toBeTruthy();
    const selects = screen.getAllByRole('button', { name: '선택하기' });
    expect(selects).toHaveLength(2);
    fireEvent.click(selects[1]);
    expect(screen.getAllByTestId('client-offers-card')[1].getAttribute('aria-checked')).toBe('true');
  });

  test('상담사가 2명 이상이면 명시 선택 전까지 결제 불가', async() => {
    fetchConsultantMappings.mockResolvedValue([
      { mappingId: 1, consultantId: 9, consultantName: '박지안' },
      { mappingId: 2, consultantId: 10, consultantName: '최하린' }
    ]);
    listMyClientOffers.mockResolvedValue([OFFER(1)]);
    renderPage();
    expect(await screen.findByText('담당 상담사를 고른 뒤 결제할 수 있어요')).toBeTruthy();
    expect(screen.getByLabelText('담당 상담사').value).toBe('');
  });

  test('전체 동의 후 결제하면 지정 SKU 로 공통 체크아웃을 부른다', async() => {
    listMyClientOffers.mockResolvedValue([OFFER(1)]);
    runShopCheckoutWithPortOneGuard.mockResolvedValue({ status: 'FAILED', message: '실패' });
    renderPage();
    fireEvent.click(await screen.findByLabelText(/전체 동의/));
    const pay = screen.getByTestId('client-offers-pay');
    await waitFor(() => expect(pay.getAttribute('aria-disabled')).toBe('false'));
    fireEvent.click(pay);
    await waitFor(() => expect(runShopCheckoutWithPortOneGuard).toHaveBeenCalled());
    expect(runShopCheckoutWithPortOneGuard.mock.calls[0][0].mappingIdForCheckout).toBe('1');
  });

  test('결제창 취소 복귀 등으로 다시 열면 선택·동의가 유지된다', async() => {
    listMyClientOffers.mockResolvedValue([OFFER(1), OFFER(2)]);
    window.sessionStorage.setItem('mg.clientOffers.draft.5', JSON.stringify({
      skuCode: 'OFFER_2', agreements: { purchase: true }, mappingId: ''
    }));
    renderPage();
    await screen.findByText('결제할 수 있는 상품 2개');
    expect(screen.getAllByTestId('client-offers-card')[1].getAttribute('aria-checked')).toBe('true');
  });

  test('휴대폰 미인증이면 화면 안 몰 인증(「인증하기」) · 설정 이동 링크 없음 · 이용기간 배너', async() => {
    useClientShopAuth.mockReturnValue({ sessionLoading: false, isLoggedIn: true, user: { id: 5, name: '한서윤' } });
    listMyClientOffers.mockResolvedValue([OFFER(1)]);
    renderPage();
    expect(await screen.findByRole('button', { name: CLIENT_MALL_PHONE_COPY.START })).toBeTruthy();
    expect(screen.queryByRole('link', { name: '설정으로 이동' })).toBeNull();
    expect(screen.getByText(CLIENT_MALL_USAGE_BANNER_EXAMPLE, { exact: false })).toBeTruthy();
  });

  test('목록 실패 시 다시 시도', async() => {
    listMyClientOffers.mockRejectedValue(new Error('x'));
    renderPage();
    expect(await screen.findByText('다시 시도')).toBeTruthy();
  });

  test('결제하기는 하나이고 데스크톱·좁은 화면 모두 보이며 차단 조건은 한 곳이다', async() => {
    listMyClientOffers.mockResolvedValue([OFFER(1)]);
    renderPage();
    const pay = await screen.findByRole('button', { name: '결제하기' });
    const bar = screen.getByTestId('client-offers-bar');
    expect(screen.getAllByTestId('client-offers-pay')).toHaveLength(1);
    expect(pay.closest('[data-testid="client-offers-bar"]')).toBe(bar);
    expect(bar.classList.contains('client-mall-bar')).toBe(true);
    expect(bar.classList.contains('client-offers__paybar')).toBe(true);
    expect(pay.hidden).toBe(false);
    expect(bar.hidden).toBe(false);
    expect(pay.getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByText('전체 동의 후 결제할 수 있어요')).toBeTruthy();

    const pageSrc = fs.readFileSync(path.join(__dirname, '../ClientOffersPage.js'), 'utf8');
    const offersCss = fs.readFileSync(path.join(__dirname, '../ClientOffersPage.css'), 'utf8');
    const mallCss = fs.readFileSync(path.join(__dirname, '../../../../styles/shop/ClientMall.css'), 'utf8');

    expect(pageSrc.match(/const blockMessage =/g)).toHaveLength(1);
    expect(pageSrc.match(/const payDisabled = paying \|\| Boolean\(blockMessage\);/g)).toHaveLength(1);
    expect(pageSrc.match(/data-testid=\{T\.PAY\}/g)).toHaveLength(1);
    expect(pageSrc).toMatch(/if \(!selectedOffer\) \{\s*return t\('bar\.blockNoProduct'\);/);
    expect(pageSrc).toMatch(/if \(noMapping\) \{\s*return t\('bar\.blockNoAssign'\);/);
    expect(pageSrc).toMatch(/if \(needsConsultant\) \{\s*return t\('bar\.blockConsultant'\);/);
    expect(pageSrc).toMatch(/if \(!phoneVerified && !allAgreed\) \{\s*return t\('bar\.blockBoth'\);/);
    expect(pageSrc).toMatch(/if \(!phoneVerified\) \{\s*return t\('bar\.blockPhone'\);/);
    expect(pageSrc).toMatch(/if \(!allAgreed\) \{\s*return t\('bar\.blockAgreement'\);/);

    const ruleAt = offersCss.indexOf('.client-offers__paybar.client-mall-bar');
    const mediaAt = offersCss.indexOf('@media');
    expect(ruleAt).toBeGreaterThan(-1);
    expect(mediaAt).toBeGreaterThan(ruleAt);
    const paybarBlock = offersCss.slice(ruleAt, offersCss.indexOf('}', ruleAt));
    expect(paybarBlock).toMatch(/display:\s*block/);
    expect(paybarBlock).not.toMatch(/display:\s*none/);
    expect(paybarBlock).not.toMatch(/position\s*:/);
    expect(offersCss).not.toMatch(/\.client-offers__paybar[^{]*\{[^}]*display:\s*none/);

    expect(mallCss).toMatch(/\.client-mall-bar,\s*\.client-mall-bar-spacer\s*\{\s*display:\s*none;\s*\}/);
    const narrowAt = mallCss.indexOf('@media (max-width: 56.25rem)');
    expect(narrowAt).toBeGreaterThan(-1);
    const narrowCss = mallCss.slice(narrowAt);
    expect(narrowCss).toMatch(/\.client-mall-bar\s*\{[^}]*display:\s*block/);
    expect(narrowCss).toMatch(/\.client-mall-bar\s*\{[^}]*position:\s*fixed/);

    const offersOverrideVisible = /display:\s*block/.test(paybarBlock) && ruleAt < mediaAt;
    const genericBarVisible = (narrow) => narrow && /\.client-mall-bar\s*\{[^}]*display:\s*block/.test(narrowCss);
    expect(offersOverrideVisible || genericBarVisible(false)).toBe(true);
    expect(offersOverrideVisible || genericBarVisible(true)).toBe(true);
    expect(genericBarVisible(false)).toBe(false);
  });
});
