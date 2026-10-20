/**
 * serverClock — offset 보정·온라인/오프라인·재동기화
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

import {
  computeServerClockOffset,
  getNow,
  parseServerTimePayload,
  resetServerClock,
  setServerClockOffsetForTest,
  syncServerClock,
  isServerClockSynced
} from '../serverClock';
import { SYSTEM_TIME_API } from '../../constants/api';

describe('computeServerClockOffset', () => {
  it('RTT 절반을 보정한다', () => {
    const t0 = 1_000_000;
    const t1 = 1_000_200; // rtt 200ms
    const serverEpoch = 5_000_100;
    // offset = 5000100 - (1000000 + 100) = 4000000
    expect(computeServerClockOffset(serverEpoch, t0, t1)).toBe(4_000_000);
  });
});

describe('parseServerTimePayload', () => {
  it('ApiResponse 래퍼에서 epochMillis·zone 을 읽는다', () => {
    expect(parseServerTimePayload({
      success: true,
      data: { epochMillis: 123, zone: 'Asia/Seoul' }
    })).toEqual({ epochMillis: 123, zone: 'Asia/Seoul' });
  });

  it('평문 body 도 허용한다', () => {
    expect(parseServerTimePayload({ epochMillis: 99, zone: 'Asia/Seoul' }))
      .toEqual({ epochMillis: 99, zone: 'Asia/Seoul' });
  });
});

describe('getNow', () => {
  const originalOnLine = navigator.onLine;

  afterEach(() => {
    resetServerClock();
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => originalOnLine
    });
    jest.restoreAllMocks();
  });

  it('온라인 + 동기화 성공 시 기기 시계가 5분 틀려도 서버 시각을 쓴다', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
    const deviceSkewMs = 5 * 60 * 1000;
    const deviceNow = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(deviceNow);
    // 서버는 기기보다 5분 앞 → offset = +5min 으로 보정하면 getNow ≈ deviceNow+offset
    setServerClockOffsetForTest(deviceSkewMs, { synced: true, zone: 'Asia/Seoul' });
    expect(getNow().getTime()).toBe(deviceNow + deviceSkewMs);
  });

  it('오프라인이면 기기 Date.now() 를 쓴다', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
    const deviceNow = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(deviceNow);
    setServerClockOffsetForTest(999_999, { synced: true });
    expect(getNow().getTime()).toBe(deviceNow);
  });

  it('동기화 실패(미동기화)면 기기 시각을 쓴다', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
    const deviceNow = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(deviceNow);
    resetServerClock();
    expect(isServerClockSynced()).toBe(false);
    expect(getNow().getTime()).toBe(deviceNow);
  });
});

describe('syncServerClock', () => {
  const originalOnLine = navigator.onLine;
  const originalFetch = global.fetch;

  afterEach(() => {
    resetServerClock();
    global.fetch = originalFetch;
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => originalOnLine
    });
    jest.restoreAllMocks();
  });

  it('online 이벤트 재동기화 mock — fetch 성공 시 offset 반영', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
    const deviceNow = 2_000_000_000_000;
    jest.spyOn(Date, 'now')
      .mockReturnValueOnce(deviceNow) // t0
      .mockReturnValueOnce(deviceNow + 40); // t1
    const serverEpoch = deviceNow + 40 / 2 + 300_000; // +5분

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { epochMillis: serverEpoch, zone: 'Asia/Seoul' }
      })
    });

    const ok = await syncServerClock();
    expect(ok).toBe(true);
    expect(isServerClockSynced()).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(SYSTEM_TIME_API.NOW),
      expect.objectContaining({ method: 'GET', cache: 'no-store', credentials: 'omit' })
    );

    Date.now.mockReturnValue(deviceNow + 1000);
    expect(getNow().getTime()).toBe(deviceNow + 1000 + 300_000);
  });

  it('오프라인이면 sync 를 건너뛴다', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
    global.fetch = jest.fn();
    expect(await syncServerClock()).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
