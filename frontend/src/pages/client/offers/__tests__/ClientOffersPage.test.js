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
jest.mock('../../../../components/shop/templates/ShopClientLayout', () => ({ title, children, aside, className, testId }) => (
  <main className={className} data-testid={testId}>
    <h1>{title}</h1>
    <div data-testid="shop-main">{children}</div>
    {aside ? <aside data-testid="shop-aside">{aside}</aside> : null}
  </main>
));
jest.mock('../../../../components/shop/templates/ShopClientSessionLoading', () => () => <div>loading</div>);
jest.mock('../../../../contexts/SessionContext', () => {
  const React = require('react');
  return {
    SessionContext: React.createContext(null),
    useSession: () => ({ checkSession: jest.fn() })
  };
});
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
    const pays = await screen.findAllByTestId('client-offers-pay');
    pays.forEach((pay) => {
      expect(pay.disabled).toBe(true);
      expect(pay.getAttribute('aria-disabled')).toBe('true');
      expect(pay.getAttribute('aria-describedby')).toBeTruthy();
      expect(pay.className).toContain('client-offers__pay-cta');
      fireEvent.click(pay);
    });
    expect(screen.getAllByText('전체 동의 후 결제할 수 있어요').length).toBeGreaterThan(0);
    expect(runShopCheckoutWithPortOneGuard).not.toHaveBeenCalled();
  });

  test('상품 2개면 자동 선택하지 않고 「선택하기」로 고른다, 주 버튼은 하단 결제하기 하나', async() => {
    listMyClientOffers.mockResolvedValue([OFFER(1), OFFER(2)]);
    renderPage();
    await screen.findByText('결제할 수 있는 상품 2개');
    expect(screen.getAllByText('결제할 상품을 골라 주세요').length).toBeGreaterThan(0);
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
    expect((await screen.findAllByText('담당 상담사를 고른 뒤 결제할 수 있어요')).length).toBeGreaterThan(0);
    expect(screen.getByLabelText('담당 상담사').value).toBe('');
  });

  test('전체 동의 후 결제하면 지정 SKU 로 공통 체크아웃을 부른다', async() => {
    listMyClientOffers.mockResolvedValue([OFFER(1)]);
    runShopCheckoutWithPortOneGuard.mockResolvedValue({ status: 'FAILED', message: '실패' });
    renderPage();
    const agreeAll = await screen.findAllByLabelText(/전체 동의/);
    fireEvent.click(agreeAll[0]);
    const pays = screen.getAllByTestId('client-offers-pay');
    await waitFor(() => expect(pays[0].getAttribute('aria-disabled')).toBe('false'));
    expect(pays[0].disabled).toBe(false);
    fireEvent.click(pays[0]);
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

  test('PC는 aside 요약 카드, 390은 하단 고정 바와 7.5rem 여백', async() => {
    listMyClientOffers.mockResolvedValue([OFFER(1)]);
    renderPage();
    const card = await screen.findByTestId('client-offers-pay-card');
    const bar = screen.getByTestId('client-offers-bar');
    const aside = screen.getByTestId('shop-aside');
    expect(aside.contains(card)).toBe(true);
    expect(card.classList.contains('client-offers__pay')).toBe(true);
    expect(bar.classList.contains('client-mall-bar')).toBe(true);
    expect(bar.classList.contains('client-offers__paybar')).toBe(true);
    expect(screen.getAllByTestId('client-offers-pay')).toHaveLength(2);
    expect(card.querySelector('[data-testid="client-offers-pay"]')).toBeTruthy();
    expect(bar.querySelector('[data-testid="client-offers-pay"]')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /내용 보기/ })).toHaveLength(3);

    const offersCss = fs.readFileSync(path.join(__dirname, '../ClientOffersPage.css'), 'utf8');
    const tokensCss = fs.readFileSync(path.join(__dirname, '../../../../styles/tokens/shop-offer-tokens.css'), 'utf8');
    const mallCss = fs.readFileSync(path.join(__dirname, '../../../../styles/shop/ClientMall.css'), 'utf8');
    expect(offersCss).toMatch(/\.client-offers__pay\s*\{[^}]*position:\s*sticky/);
    expect(tokensCss).toMatch(/--mg-offer-bar-reserve:\s*7\.5rem/);
    expect(tokensCss).toMatch(/--mg-offer-pay-aside-w:\s*22\.5rem/);
    expect(tokensCss).toMatch(/--mg-offer-pay-stage-max:\s*75rem/);
    expect(tokensCss).toMatch(/--mg-offer-card-min:\s*13\.5rem/);
    expect(offersCss).toMatch(/repeat\(auto-fill,\s*minmax\(min\(100%,\s*var\(--mg-offer-card-min\)\),\s*1fr\)\)/);
    expect(offersCss).not.toMatch(/repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
    expect(offersCss).toMatch(/max-inline-size:\s*var\(--mg-offer-pay-stage-max\)/);
    expect(tokensCss).toMatch(/--mg-offer-pay-disabled-bg:\s*var\(--cs-slate-100\)/);
    expect(tokensCss).toMatch(/--mg-offer-pay-disabled-fg:\s*var\(--cs-slate-700\)/);
    expect(tokensCss).toMatch(/--mg-offer-pay-disabled-border:\s*var\(--cs-slate-400\)/);
    expect(tokensCss).toMatch(/--mg-offer-terms-body-max:\s*24rem/);
    expect(offersCss).toMatch(/@media \(min-width: 56\.26rem\)[\s\S]*var\(--mg-offer-pay-aside-w\)/);
    expect(offersCss).toMatch(/border-style:\s*dashed/);
    expect(offersCss).toMatch(/\[aria-disabled="true"\]:not\(\[aria-busy="true"\]\)/);
    expect(offersCss).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    const paybarAt = offersCss.indexOf('.client-offers__paybar.client-mall-bar');
    const paybarBlock = offersCss.slice(paybarAt, offersCss.indexOf('}', paybarAt));
    expect(paybarBlock).not.toMatch(/display\s*:/);
    expect(paybarBlock).not.toMatch(/position\s*:/);
    const narrowOffers = offersCss.slice(offersCss.indexOf('@media (max-width: 56.25rem)'));
    expect(narrowOffers).toMatch(/client-web-page-shell__aside\s*\{\s*display:\s*none/);
    expect(narrowOffers).toMatch(/client-mall-bar-spacer\s*\{[^}]*var\(--mg-offer-bar-reserve\)/);
    expect(narrowOffers).toMatch(/\.client-offers__agreements-flow\s*\{\s*display:\s*block/);
    expect(offersCss).toMatch(/\.client-offers__agreements-flow\s*\{\s*display:\s*none/);
    const narrowMall = mallCss.slice(mallCss.indexOf('@media (max-width: 56.25rem)'));
    expect(narrowMall).toMatch(/\.client-mall-bar\s*\{[^}]*display:\s*block/);
    expect(narrowMall).toMatch(/\.client-mall-bar\s*\{[^}]*position:\s*fixed/);
  });

  test.each([1280, 1400, 1920])('PC %ipx 에서 상품 6개도 카드 최소 폭을 지킨다', (viewportPx) => {
    const tokensCss = fs.readFileSync(path.join(__dirname, '../../../../styles/tokens/shop-offer-tokens.css'), 'utf8');
    const shellCss = fs.readFileSync(path.join(__dirname, '../../../../components/client/ClientWebPageShell.css'), 'utf8');
    const spaceCss = fs.readFileSync(path.join(__dirname, '../../../../styles/tokens/design-v2-tokens.css'), 'utf8');
    const rem = (name, css) => {
      const match = css.match(new RegExp(`${name}:\\s*([0-9.]+)rem`));
      expect(match).toBeTruthy();
      return Number(match[1]) * 16;
    };
    const stageMax = rem('--mg-offer-pay-stage-max', tokensCss);
    const aside = rem('--mg-offer-pay-aside-w', tokensCss);
    const cardMin = rem('--mg-offer-card-min', tokensCss);
    const padMatch = shellCss.match(/--client-web-pad-x:\s*var\([^,]+,\s*([0-9.]+)rem\)/);
    expect(padMatch).toBeTruthy();
    const padX = Number(padMatch[1]) * 16;
    const shellGap = rem('--mg-v2-space-6', spaceCss);
    const cardGap = rem('--mg-v2-space-4', spaceCss);
    const stage = Math.min(viewportPx, stageMax);
    const main = stage - padX * 2 - aside - shellGap;
    const columns = Math.floor((main + cardGap) / (cardMin + cardGap));
    const cardWidth = (main - cardGap * (columns - 1)) / columns;
    expect(columns).toBeGreaterThanOrEqual(2);
    expect(cardWidth).toBeGreaterThanOrEqual(cardMin);
    expect(columns).toBe(3);
  });

  test('약관 모달이 열려 있으면 뒤 화면은 스크롤되지 않는다', async() => {
    listMyClientOffers.mockResolvedValue([OFFER(1)]);
    renderPage();
    const more = await screen.findAllByRole('button', { name: /내용 보기/ });
    fireEvent.click(more[0]);
    const page = screen.getByTestId('client-offers');
    expect(page.getAttribute('inert')).toBe('');
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByTestId('client-offers-terms-dismiss'));
    await waitFor(() => expect(page.hasAttribute('inert')).toBe(false));
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
