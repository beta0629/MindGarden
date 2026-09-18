/**
 * softRefresh / runResourceLoad 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import { runResourceLoad, softRefresh } from '../softRefresh';

describe('runResourceLoad', () => {
  it('silent 가 아니면 setLoading true → loader → false', async() => {
    const setLoading = jest.fn();
    const loader = jest.fn().mockResolvedValue('ok');

    const result = await runResourceLoad({}, setLoading, loader);

    expect(result).toBe('ok');
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('silent=true 이면 setLoading 을 호출하지 않는다', async() => {
    const setLoading = jest.fn();
    const loader = jest.fn().mockResolvedValue(42);

    const result = await runResourceLoad({ silent: true }, setLoading, loader);

    expect(result).toBe(42);
    expect(setLoading).not.toHaveBeenCalled();
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('loader 실패 시에도 silent=false 이면 setLoading(false) 를 호출한다', async() => {
    const setLoading = jest.fn();
    const err = new Error('fail');
    const loader = jest.fn().mockRejectedValue(err);

    await expect(runResourceLoad({}, setLoading, loader)).rejects.toThrow('fail');
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('setLoading 이 함수가 아니면 loader 만 실행한다', async() => {
    const loader = jest.fn().mockResolvedValue('x');
    await expect(runResourceLoad({}, null, loader)).resolves.toBe('x');
    expect(loader).toHaveBeenCalledTimes(1);
  });
});

describe('softRefresh', () => {
  it('loadFn 에 silent:true 를 병합해 호출한다', async() => {
    const loadFn = jest.fn().mockResolvedValue('refreshed');

    const result = await softRefresh(loadFn, { page: 2 });

    expect(result).toBe('refreshed');
    expect(loadFn).toHaveBeenCalledWith({ page: 2, silent: true });
  });

  it('options 생략 시 { silent: true } 만 전달한다', async() => {
    const loadFn = jest.fn().mockResolvedValue(undefined);
    await softRefresh(loadFn);
    expect(loadFn).toHaveBeenCalledWith({ silent: true });
  });

  it('호출자가 silent:false 를 넘겨도 강제 silent:true', async() => {
    const loadFn = jest.fn().mockResolvedValue(undefined);
    await softRefresh(loadFn, { silent: false, page: 0 });
    expect(loadFn).toHaveBeenCalledWith({ silent: true, page: 0 });
  });
});
