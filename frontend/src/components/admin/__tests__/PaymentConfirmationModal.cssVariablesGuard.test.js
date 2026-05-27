/**
 * PaymentConfirmationModal 회귀 테스트 — TABLET_LOGIN_CONSTANTS.SOCIAL.BUTTONS 가드.
 *
 * 배경:
 *  - PR #16(6b5563729) P0 핫픽스는 존재하지 않는 `CSS_VARIABLES.SOCIAL.BUTTONS`
 *    체인을 참조했고, nullish 가드 + fallback hex 로만 운영 P0 화면 깨짐을 복구.
 *  - 디버거(`p0-mapping-mgmt-buttons-debug`) 진단 결과 실제 SSOT 는
 *    `TABLET_LOGIN_CONSTANTS.SOCIAL.BUTTONS` 임이 확정되어, follow-up 으로
 *    정상 식별자로 교체. nullish 가드 + fallback hex 는 defense in depth 로 유지.
 *
 * 본 테스트는 다음을 보장한다.
 *  1) 모듈 top-level 가드 상수가 `TABLET_LOGIN_CONSTANTS` 가 부분/전부
 *     undefined 인 상황에서도 throw 하지 않고 모듈이 정상 로드된다.
 *  2) 정상 값이 주어졌을 때 fallback 없이 모듈이 로드된다 (회복 케이스).
 *  3) 실제 `frontend/src/constants/css-variables` 에서
 *     `TABLET_LOGIN_CONSTANTS` 가 export 되며, KAKAO/NAVER COLOR 가
 *     브랜드 가이드 hex(`#FEE500`, `#03C75A`) 와 일치한다.
 *
 * @see frontend/src/components/admin/PaymentConfirmationModal.js
 * @see docs/standards/TESTING_STANDARD.md
 */
/* eslint-disable global-require */

jest.mock('../../../utils/commonCodeApi', () => ({
  getCommonCodes: jest.fn(() => Promise.resolve([]))
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn(), warning: jest.fn(), info: jest.fn() }
}));

jest.mock('../../../utils/ajax', () => ({
  apiGet: jest.fn(() => Promise.resolve({ success: true, data: [] }))
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: { changeLanguage: jest.fn() } })
}));

const KAKAO_BRAND_HEX = '#FEE500';
const NAVER_BRAND_HEX = '#03C75A';

/**
 * 격리된 모듈 그래프에서 css-variables 만 주어진 값으로 모킹하고
 * PaymentConfirmationModal 을 require 한다. React 인스턴스는 격리되지만
 * 본 테스트는 렌더링을 하지 않으므로 dispatcher 충돌이 발생하지 않는다.
 */
function loadComponentWithMockedTabletLoginConstants(tabletLoginConstants) {
  let result;
  jest.isolateModules(() => {
    jest.doMock('../../../constants/css-variables', () => ({
      TABLET_LOGIN_CONSTANTS: tabletLoginConstants
    }));
    result = require('../PaymentConfirmationModal');
  });
  return result;
}

describe('PaymentConfirmationModal — TABLET_LOGIN_CONSTANTS 가드 (P0 회귀 방지)', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('TABLET_LOGIN_CONSTANTS 가 빈 객체여도 모듈 로드/top-level 상수 평가가 throw 하지 않는다', () => {
    let mod;
    expect(() => {
      mod = loadComponentWithMockedTabletLoginConstants({});
    }).not.toThrow();
    expect(typeof mod.default).toBe('function');
  });

  it('TABLET_LOGIN_CONSTANTS.SOCIAL 이 undefined 여도 throw 하지 않는다', () => {
    let mod;
    expect(() => {
      mod = loadComponentWithMockedTabletLoginConstants({ SOCIAL: undefined });
    }).not.toThrow();
    expect(typeof mod.default).toBe('function');
  });

  it('TABLET_LOGIN_CONSTANTS.SOCIAL.BUTTONS 가 undefined 여도 throw 하지 않는다', () => {
    let mod;
    expect(() => {
      mod = loadComponentWithMockedTabletLoginConstants({ SOCIAL: { BUTTONS: undefined } });
    }).not.toThrow();
    expect(typeof mod.default).toBe('function');
  });

  it('TABLET_LOGIN_CONSTANTS.SOCIAL.BUTTONS.KAKAO 가 undefined 여도 throw 하지 않는다', () => {
    let mod;
    expect(() => {
      mod = loadComponentWithMockedTabletLoginConstants({ SOCIAL: { BUTTONS: { KAKAO: undefined } } });
    }).not.toThrow();
    expect(typeof mod.default).toBe('function');
  });

  it('정상 TABLET_LOGIN_CONSTANTS 일 때도 모듈이 throw 없이 로드된다 (회복 케이스)', () => {
    let mod;
    expect(() => {
      mod = loadComponentWithMockedTabletLoginConstants({
        SOCIAL: {
          BUTTONS: {
            KAKAO: { COLOR: KAKAO_BRAND_HEX },
            NAVER: { COLOR: NAVER_BRAND_HEX }
          }
        }
      });
    }).not.toThrow();
    expect(typeof mod.default).toBe('function');
  });
});

describe('TABLET_LOGIN_CONSTANTS SSOT 정합 (브랜드 hex)', () => {
  it('css-variables 모듈에서 TABLET_LOGIN_CONSTANTS 가 export 된다', () => {
    const cssVariablesModule = require('../../../constants/css-variables');
    expect(cssVariablesModule.TABLET_LOGIN_CONSTANTS).toBeDefined();
    expect(typeof cssVariablesModule.TABLET_LOGIN_CONSTANTS).toBe('object');
  });

  it('TABLET_LOGIN_CONSTANTS.SOCIAL.BUTTONS.KAKAO.COLOR 가 브랜드 hex 와 일치한다', () => {
    const { TABLET_LOGIN_CONSTANTS } = require('../../../constants/css-variables');
    expect(TABLET_LOGIN_CONSTANTS.SOCIAL.BUTTONS.KAKAO.COLOR).toBe(KAKAO_BRAND_HEX);
  });

  it('TABLET_LOGIN_CONSTANTS.SOCIAL.BUTTONS.NAVER.COLOR 가 브랜드 hex 와 일치한다', () => {
    const { TABLET_LOGIN_CONSTANTS } = require('../../../constants/css-variables');
    expect(TABLET_LOGIN_CONSTANTS.SOCIAL.BUTTONS.NAVER.COLOR).toBe(NAVER_BRAND_HEX);
  });
});
