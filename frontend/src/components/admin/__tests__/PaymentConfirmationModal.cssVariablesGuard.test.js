/**
 * PaymentConfirmationModal 회귀 테스트 — CSS_VARIABLES.SOCIAL.BUTTONS 가드.
 *
 * 운영 minified 번들에서 `CSS_VARIABLES.SOCIAL` 하위가 undefined 로 평가되어
 * "Cannot read properties of undefined (reading 'BUTTONS')" 가 발생,
 * 매칭관리(`/admin/mapping-management`) 페이지 진입 시 화면 깨짐 P0 발생.
 *
 * 본 테스트는 모듈 top-level 가드 상수(`KAKAO_BRAND_COLOR`/`NAVER_BRAND_COLOR`)
 * 평가가 `CSS_VARIABLES` 일부 또는 전부가 undefined 인 상황에서도 throw 하지 않고,
 * 컴포넌트 모듈이 정상 로드됨을 보장한다. P0 회귀 방지의 핵심은 모듈 평가 단계의
 * 안전성이며, 컴포넌트 렌더링 자체(BadgeSelect/UnifiedModal 의존성)는
 * 디자인 시스템 통합 테스트에서 별도 커버한다.
 *
 * @see frontend/src/components/admin/PaymentConfirmationModal.js
 * @see docs/standards/TESTING_STANDARD.md
 */
/* eslint-disable global-require */

jest.mock('../../../utils/commonCodeApi', () => ({
  getCommonCodes: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn(), warning: jest.fn(), info: jest.fn() },
}));

jest.mock('../../../utils/ajax', () => ({
  apiGet: jest.fn(() => Promise.resolve({ success: true, data: [] })),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: { changeLanguage: jest.fn() } }),
}));

/**
 * 격리된 모듈 그래프에서 css-variables 만 주어진 값으로 모킹하고
 * PaymentConfirmationModal 을 require 한다. React 인스턴스는 격리되지만
 * 본 테스트는 렌더링을 하지 않으므로 dispatcher 충돌이 발생하지 않는다.
 */
function loadComponentWithMockedCssVariables(cssVariables) {
  let result;
  jest.isolateModules(() => {
    jest.doMock('../../../constants/css-variables', () => ({ CSS_VARIABLES: cssVariables }));
    result = require('../PaymentConfirmationModal');
  });
  return result;
}

describe('PaymentConfirmationModal — CSS_VARIABLES 가드 (P0 회귀 방지)', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('CSS_VARIABLES 가 빈 객체여도 모듈 로드/top-level 상수 평가가 throw 하지 않는다', () => {
    let mod;
    expect(() => {
      mod = loadComponentWithMockedCssVariables({});
    }).not.toThrow();
    expect(typeof mod.default).toBe('function');
  });

  it('CSS_VARIABLES.SOCIAL 이 undefined 여도 throw 하지 않는다', () => {
    let mod;
    expect(() => {
      mod = loadComponentWithMockedCssVariables({ SOCIAL: undefined });
    }).not.toThrow();
    expect(typeof mod.default).toBe('function');
  });

  it('CSS_VARIABLES.SOCIAL.BUTTONS 가 undefined 여도 throw 하지 않는다', () => {
    let mod;
    expect(() => {
      mod = loadComponentWithMockedCssVariables({ SOCIAL: { BUTTONS: undefined } });
    }).not.toThrow();
    expect(typeof mod.default).toBe('function');
  });

  it('CSS_VARIABLES.SOCIAL.BUTTONS.KAKAO 가 undefined 여도 throw 하지 않는다', () => {
    let mod;
    expect(() => {
      mod = loadComponentWithMockedCssVariables({ SOCIAL: { BUTTONS: { KAKAO: undefined } } });
    }).not.toThrow();
    expect(typeof mod.default).toBe('function');
  });

  it('정상 CSS_VARIABLES 일 때도 모듈이 throw 없이 로드된다 (회복 케이스)', () => {
    let mod;
    expect(() => {
      mod = loadComponentWithMockedCssVariables({
        SOCIAL: {
          BUTTONS: {
            KAKAO: { COLOR: '#FEE500' },
            NAVER: { COLOR: '#03C75A' },
          },
        },
      });
    }).not.toThrow();
    expect(typeof mod.default).toBe('function');
  });
});
