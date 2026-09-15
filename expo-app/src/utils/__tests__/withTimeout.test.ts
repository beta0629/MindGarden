/**
 * withTimeout — hang 방지 Promise race 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { TimeoutError, withTimeout } from '@/utils/withTimeout';

describe('withTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('timeoutMs <= 0 이면 원본 Promise 를 그대로 반환한다', async () => {
    const value = await withTimeout(Promise.resolve('ok'), 0, 'noop');
    expect(value).toBe('ok');
  });

  it('제한 시간 내 완료되면 값을 반환한다', async () => {
    const promise = withTimeout(
      new Promise<string>((resolve) => {
        setTimeout(() => resolve('done'), 100);
      }),
      1000,
      'fast',
    );

    await jest.advanceTimersByTimeAsync(100);
    await expect(promise).resolves.toBe('done');
  });

  it('제한 시간을 초과하면 TimeoutError 로 reject 한다', async () => {
    const hanging = new Promise<string>(() => {
      /* never resolves */
    });
    const promise = withTimeout(hanging, 500, 'hang-op');

    const expectation = expect(promise).rejects.toBeInstanceOf(TimeoutError);
    await jest.advanceTimersByTimeAsync(500);
    await expectation;
  });
});
