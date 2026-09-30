/**
 * MallPayFailedAlert — 카드 거절 첫 회에 390 폭 첫 화면 안에 빨간 사유가 보이도록 즉시(instant) 스크롤 + 다음 프레임 보정.
 * 전역 scroll-behavior:smooth 에서도 즉시 이동하도록 behavior 'instant', 상단 바 밑에 깔리지 않도록 scrollIntoView 미사용.
 *
 * @author MindGarden
 * @since 2026-09-30
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import MallPayFailedAlert from '../MallPayFailedAlert';
import { CLIENT_MALL_TEST_IDS } from '../../../../constants/clientMallConstants';

const VIEWPORT_WIDTH = 390;
const VIEWPORT_HEIGHT = 844;
const ALERT_DOC_TOP = 247;
const STALLED_SCROLL_Y = 608;
const INITIAL_SCROLL_Y = 619;
const REASON = '카드사 승인 거절 (한도 초과)';
/** 상단 바(--client-web-chrome-h 4rem) — 알림이 그 아래에 보여야 한다 */
const TOP_BAR_HEIGHT = 64;

describe('MallPayFailedAlert 스크롤 — 390 첫 화면 노출', () => {
  const original = {};
  let scrollY;
  let stallCount;

  beforeEach(() => {
    original.scrollTo = window.scrollTo;
    original.innerWidth = window.innerWidth;
    original.innerHeight = window.innerHeight;
    original.scrollIntoView = Element.prototype.scrollIntoView;
    original.requestAnimationFrame = window.requestAnimationFrame;
    original.cancelAnimationFrame = window.cancelAnimationFrame;

    window.innerWidth = VIEWPORT_WIDTH;
    window.innerHeight = VIEWPORT_HEIGHT;
    scrollY = INITIAL_SCROLL_Y;
    stallCount = 0;

    window.scrollTo = jest.fn(({ top }) => {
      if (stallCount > 0) {
        stallCount -= 1;
        scrollY = STALLED_SCROLL_Y;
        return;
      }
      scrollY = top;
    });
    Element.prototype.scrollIntoView = jest.fn(() => {
      scrollY = ALERT_DOC_TOP;
    });
    window.requestAnimationFrame = jest.fn((cb) => {
      cb(0);
      return 1;
    });
    window.cancelAnimationFrame = jest.fn();
    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
      top: ALERT_DOC_TOP - scrollY,
      bottom: ALERT_DOC_TOP - scrollY + 80,
      left: 0,
      right: VIEWPORT_WIDTH,
      width: VIEWPORT_WIDTH,
      height: 80,
      x: 0,
      y: ALERT_DOC_TOP - scrollY
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.scrollTo = original.scrollTo;
    window.innerWidth = original.innerWidth;
    window.innerHeight = original.innerHeight;
    Element.prototype.scrollIntoView = original.scrollIntoView;
    window.requestAnimationFrame = original.requestAnimationFrame;
    window.cancelAnimationFrame = original.cancelAnimationFrame;
  });

  const expectAlertInFirstScreen = () => {
    const rect = screen.getByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_PAY_FAILED).getBoundingClientRect();
    expect(rect.top).toBeGreaterThanOrEqual(0);
    expect(rect.top).toBeLessThan(VIEWPORT_HEIGHT);
  };

  const expectAllScrollsInstant = () => {
    expect(window.scrollTo.mock.calls.length).toBeGreaterThan(0);
    window.scrollTo.mock.calls.forEach(([opts]) => {
      expect(opts).toEqual({ top: 0, behavior: 'instant' });
    });
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  };

  it('거절 사유 표시 시 즉시(instant) 스크롤로 첫 화면 안, 상단 바 아래에 보인다', () => {
    render(<MallPayFailedAlert reason={REASON} />);

    expect(screen.getByText(REASON)).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
    expect(window.scrollTo).not.toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
    expect(window.scrollTo).not.toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expectAllScrollsInstant();
    expectAlertInFirstScreen();
    expect(
      screen.getByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_PAY_FAILED).getBoundingClientRect().top
    ).toBeGreaterThanOrEqual(TOP_BAR_HEIGHT);
  });

  it('첫 스크롤이 도중에 멈춰도(top -361) 다음 프레임에 다시 맞춘다', () => {
    stallCount = 1;
    render(<MallPayFailedAlert reason={REASON} />);

    expect(window.scrollTo).toHaveBeenCalledTimes(2);
    expectAllScrollsInstant();
    expectAlertInFirstScreen();
  });

  it('페이지 top 재시도도 멈춰도 scrollIntoView(block:start)로 알림을 상단 바 밑 top 0 에 붙이지 않는다', () => {
    stallCount = 2;
    render(<MallPayFailedAlert reason={REASON} />);

    expect(window.scrollTo).toHaveBeenCalledTimes(2);
    expectAllScrollsInstant();
  });

  it('사유가 없으면 스크롤하지 않는다', () => {
    render(<MallPayFailedAlert reason="" />);

    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(screen.queryByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_PAY_FAILED)).not.toBeInTheDocument();
  });
});
