/**
 * 공통 로거 — 운영 빌드에서 log·debug 차단, warn·error 유지.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

import logger, { isProductionBuild } from '../logger';

describe('logger', () => {
  const originalEnv = process.env.NODE_ENV;
  let logSpy;
  let debugSpy;
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  test('운영 빌드 — log·debug 는 콘솔에 나가지 않는다', () => {
    process.env.NODE_ENV = 'production';
    expect(isProductionBuild()).toBe(true);

    logger.log('a');
    logger.debug('b');

    expect(logSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
  });

  test('운영 빌드 — warn·error 는 그대로 남는다', () => {
    process.env.NODE_ENV = 'production';

    logger.warn('w');
    logger.error('e');

    expect(warnSpy).toHaveBeenCalledWith('w');
    expect(errorSpy).toHaveBeenCalledWith('e');
  });

  test('개발 빌드 — log·debug 가 콘솔로 전달된다', () => {
    process.env.NODE_ENV = 'development';

    logger.log('a');
    logger.debug('b');

    expect(logSpy).toHaveBeenCalledWith('a');
    expect(debugSpy).toHaveBeenCalledWith('b');
  });
});
