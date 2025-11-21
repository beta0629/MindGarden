/**
 * 결제 게이트웨이 (PG) SDK 유틸리티
 * 
 * 이 파일은 PG SDK 연동을 위한 추상화 레이어를 제공합니다.
 * 여러 PG사를 지원하며, 각 PG사별 구현체를 컴포넌트화하여 관리합니다.
 * 
 * 지원 PG사:
 * - 토스페이먼츠 (TOSS)
 * - 스트라이프 (STRIPE) - 추후 구현
 * - 아임포트 (IAMPORT) - 추후 구현
 * - 기타 PG사 - 추후 구현
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-20
 */

// ============================================
// 상수 정의
// ============================================

/**
 * PG 제공자 타입
 */
export const PG_PROVIDER = {
  TOSS: 'TOSS',
  STRIPE: 'STRIPE',
  IAMPORT: 'IAMPORT',
  KAKAO: 'KAKAO',
  NAVER: 'NAVER',
  PAYPAL: 'PAYPAL',
  OTHER: 'OTHER',
};

/**
 * 기본 PG 제공자 (환경 변수 또는 설정에서 가져옴)
 */
const DEFAULT_PG_PROVIDER = process.env.REACT_APP_DEFAULT_PG_PROVIDER || PG_PROVIDER.TOSS;

/**
 * 테스트 모드 여부
 */
const TEST_MODE = process.env.REACT_APP_PAYMENT_TEST_MODE === 'true' || false;

// ============================================
// 인터페이스 및 타입 정의
// ============================================

/**
 * 카드 정보 객체
 * @typedef {Object} CardInfo
 * @property {string} cardNumber - 카드 번호 (숫자만, 공백 제거)
 * @property {string} expiryMonth - 만료 월 (MM)
 * @property {string} expiryYear - 만료 년도 (YY)
 * @property {string} cvc - CVC 코드
 * @property {string} [cardholderName] - 카드 소유자 이름
 */

/**
 * PG 토큰 생성 결과
 * @typedef {Object} PaymentTokenResult
 * @property {string} token - PG에서 받은 토큰
 * @property {string} [cardBrand] - 카드 브랜드 (VISA, MASTERCARD 등)
 * @property {string} [cardLast4] - 카드 마지막 4자리
 * @property {number} [expiryMonth] - 만료 월
 * @property {number} [expiryYear] - 만료 년도
 */

/**
 * PG SDK 초기화 옵션
 * @typedef {Object} PgSdkInitOptions
 * @property {string} [clientKey] - PG 클라이언트 키
 * @property {boolean} [testMode] - 테스트 모드 여부
 */

/**
 * 자동결제(빌링) 등록 파라미터
 * @typedef {Object} BillingAuthParams
 * @property {string} customerKey - 고객 고유 ID (UUID)
 * @property {string} [customerName] - 고객명
 * @property {string} [customerEmail] - 고객 이메일
 * @property {string} successUrl - 성공 시 리다이렉트 URL
 * @property {string} failUrl - 실패 시 리다이렉트 URL
 */

// ============================================
// PG SDK 인터페이스 (추상화)
// ============================================

/**
 * PG SDK 인터페이스
 * 모든 PG사 구현체는 이 인터페이스를 따라야 합니다.
 */
class PaymentGatewaySdk {
  /**
   * SDK 초기화
   * @param {PgSdkInitOptions} options - 초기화 옵션
   * @returns {Promise<void>}
   */
  async init(options) {
    throw new Error('init() 메서드를 구현해야 합니다.');
  }

  /**
   * 카드 정보를 토큰으로 변환
   * @param {CardInfo} cardInfo - 카드 정보
   * @returns {Promise<PaymentTokenResult>}
   */
  async createToken(cardInfo) {
    throw new Error('createToken() 메서드를 구현해야 합니다.');
  }

  /**
   * 토큰 검증
   * @param {string} token - 검증할 토큰
   * @returns {Promise<boolean>}
   */
  async verifyToken(token) {
    throw new Error('verifyToken() 메서드를 구현해야 합니다.');
  }

  /**
   * 자동결제(빌링) 등록창 열기 (선택적)
   * @param {BillingAuthParams} params - 자동결제 등록 파라미터
   * @returns {Promise<void>}
   */
  async requestBillingAuth(params) {
    throw new Error('requestBillingAuth() 메서드를 구현해야 합니다.');
  }
}

// ============================================
// 테스트 모드 PG SDK 구현
// ============================================

/**
 * 테스트 모드 PG SDK 구현
 * 실제 PG SDK가 없을 때 사용하는 모의 구현
 */
class TestPaymentGatewaySdk extends PaymentGatewaySdk {
  async init(options) {
    console.log('[Test Mode] PG SDK 초기화 (모의)');
  }

  async createToken(cardInfo) {
    const cardNumber = cardInfo.cardNumber.replace(/\s/g, '');
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      throw new Error('카드 번호가 올바르지 않습니다.');
    }

    const currentYear = new Date().getFullYear() % 100;
    const expiryYear = parseInt(cardInfo.expiryYear);
    if (expiryYear < currentYear) {
      throw new Error('카드 만료일이 지났습니다.');
    }

    if (cardInfo.cvc.length < 3 || cardInfo.cvc.length > 4) {
      throw new Error('CVC 코드가 올바르지 않습니다.');
    }

    const testToken = `tok_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const cardBrand = this.detectCardBrand(cardNumber);

    return {
      token: testToken,
      cardBrand,
      cardLast4: cardNumber.slice(-4),
      expiryMonth: parseInt(cardInfo.expiryMonth),
      expiryYear: 2000 + expiryYear,
    };
  }

  async verifyToken(token) {
    return token.startsWith('tok_test_');
  }

  async requestBillingAuth(params) {
    console.log('[Test Mode] 자동결제 등록 시뮬레이션:', params);
    // 테스트 모드에서는 실제 리다이렉트 없이 시뮬레이션
    return Promise.resolve();
  }

  detectCardBrand(cardNumber) {
    const firstDigit = cardNumber[0];
    const firstTwoDigits = cardNumber.substring(0, 2);

    if (firstDigit === '4') return 'VISA';
    if (firstTwoDigits >= '51' && firstTwoDigits <= '55') return 'MASTERCARD';
    if (firstTwoDigits === '34' || firstTwoDigits === '37') return 'AMEX';
    if (firstTwoDigits >= '30' && firstTwoDigits <= '35') return 'DINERS';
    if (firstTwoDigits === '35') return 'JCB';
    return 'UNKNOWN';
  }
}

// ============================================
// 토스페이먼츠 SDK v2 구현
// ============================================

/**
 * 토스페이먼츠 SDK v2 구현
 * 
 * 참고: https://docs.tosspayments.com/sdk/v2/js
 */
class TossPaymentGatewaySdk extends PaymentGatewaySdk {
  constructor() {
    super();
    this.clientKey = null;
    this.tossPayments = null;
  }

  async init(options) {
    this.clientKey = options.clientKey || process.env.REACT_APP_TOSS_CLIENT_KEY || '';

    if (!this.clientKey) {
      throw new Error('토스페이먼츠 클라이언트 키가 설정되지 않았습니다. REACT_APP_TOSS_CLIENT_KEY 환경 변수를 확인하세요.');
    }

    if (typeof window === 'undefined') {
      throw new Error('TossPayments SDK는 브라우저 환경에서만 사용할 수 있습니다.');
    }

    if (typeof window.TossPayments === 'undefined') {
      throw new Error('TossPayments SDK가 로드되지 않았습니다. index.html에 스크립트 태그가 추가되었는지 확인하세요.');
    }

    this.tossPayments = window.TossPayments(this.clientKey);
    console.log('[TossPayments] SDK 초기화 완료');
  }

  async createToken(cardInfo) {
    throw new Error('토스페이먼츠 SDK v2는 리다이렉트 방식만 지원합니다. requestBillingAuth()를 직접 사용하세요.');
  }

  async verifyToken(token) {
    return token.startsWith('billing_') || token.length > 0;
  }

  async requestBillingAuth(params) {
    if (!this.tossPayments) {
      throw new Error('TossPayments SDK가 초기화되지 않았습니다. init()을 먼저 호출하세요.');
    }

    const payment = this.tossPayments.payment();

    await payment.requestBillingAuth({
      method: 'CARD',
      customerKey: params.customerKey,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      successUrl: params.successUrl,
      failUrl: params.failUrl,
      windowTarget: 'self',
    });
  }
}

// ============================================
// 스트라이프 SDK 구현 (추후 구현)
// ============================================

/**
 * 스트라이프 SDK 구현
 * 
 * TODO: 실제 Stripe SDK 연동 시 구현
 * 참고: https://stripe.com/docs/js
 */
class StripePaymentGatewaySdk extends PaymentGatewaySdk {
  constructor() {
    super();
    this.stripe = null;
  }

  async init(options) {
    // TODO: Stripe SDK 로드 및 초기화
    // import { loadStripe } from '@stripe/stripe-js';
    // this.stripe = await loadStripe(options.clientKey || '');
    throw new Error('Stripe SDK는 아직 구현되지 않았습니다.');
  }

  async createToken(cardInfo) {
    // TODO: Stripe Elements 사용
    throw new Error('Stripe SDK는 아직 구현되지 않았습니다.');
  }

  async verifyToken(token) {
    // TODO: Stripe API로 토큰 검증
    return false;
  }

  async requestBillingAuth(params) {
    // TODO: Stripe Setup Intent 사용
    throw new Error('Stripe SDK는 아직 구현되지 않았습니다.');
  }
}

// ============================================
// 아임포트 SDK 구현 (추후 구현)
// ============================================

/**
 * 아임포트 SDK 구현
 * 
 * TODO: 실제 아임포트 SDK 연동 시 구현
 * 참고: https://developers.iamport.kr/
 */
class IamportPaymentGatewaySdk extends PaymentGatewaySdk {
  async init(options) {
    throw new Error('아임포트 SDK는 아직 구현되지 않았습니다.');
  }

  async createToken(cardInfo) {
    throw new Error('아임포트 SDK는 아직 구현되지 않았습니다.');
  }

  async verifyToken(token) {
    return false;
  }

  async requestBillingAuth(params) {
    throw new Error('아임포트 SDK는 아직 구현되지 않았습니다.');
  }
}

// ============================================
// PG SDK 팩토리
// ============================================

/**
 * PG SDK 팩토리
 * 설정에 따라 적절한 SDK 인스턴스를 반환합니다.
 */
class PaymentGatewaySdkFactory {
  static instance = null;

  /**
   * PG SDK 인스턴스 가져오기
   * @param {string} provider - PG 제공자 (기본값: 설정값)
   * @returns {Promise<PaymentGatewaySdk>}
   */
  static async getInstance(provider = DEFAULT_PG_PROVIDER) {
    if (this.instance) {
      return this.instance;
    }

    if (TEST_MODE) {
      this.instance = new TestPaymentGatewaySdk();
    } else {
      switch (provider) {
        case PG_PROVIDER.TOSS:
          this.instance = new TossPaymentGatewaySdk();
          await this.instance.init({
            clientKey: process.env.REACT_APP_TOSS_CLIENT_KEY || '',
            testMode: false,
          });
          break;
        case PG_PROVIDER.STRIPE:
          console.warn('[PaymentGateway] Stripe SDK는 아직 구현되지 않았습니다. 테스트 모드를 사용합니다.');
          this.instance = new TestPaymentGatewaySdk();
          break;
        case PG_PROVIDER.IAMPORT:
          console.warn('[PaymentGateway] 아임포트 SDK는 아직 구현되지 않았습니다. 테스트 모드를 사용합니다.');
          this.instance = new TestPaymentGatewaySdk();
          break;
        default:
          throw new Error(`지원하지 않는 PG 제공자입니다: ${provider}`);
      }
    }

    await this.instance.init({ testMode: TEST_MODE });
    return this.instance;
  }

  /**
   * SDK 인스턴스 리셋 (테스트용)
   */
  static reset() {
    this.instance = null;
  }
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 카드 정보를 토큰으로 변환하는 헬퍼 함수
 * @param {CardInfo} cardInfo - 카드 정보
 * @param {string} provider - PG 제공자 (선택적)
 * @returns {Promise<PaymentTokenResult>}
 */
export async function createPaymentToken(cardInfo, provider = DEFAULT_PG_PROVIDER) {
  const sdk = await PaymentGatewaySdkFactory.getInstance(provider);
  return sdk.createToken(cardInfo);
}

/**
 * 토큰 검증 헬퍼 함수
 * @param {string} token - 검증할 토큰
 * @param {string} provider - PG 제공자 (선택적)
 * @returns {Promise<boolean>}
 */
export async function verifyPaymentToken(token, provider = DEFAULT_PG_PROVIDER) {
  const sdk = await PaymentGatewaySdkFactory.getInstance(provider);
  return sdk.verifyToken(token);
}

/**
 * 자동결제(빌링) 등록창 열기
 * @param {BillingAuthParams} params - 자동결제 등록 파라미터
 * @param {string} provider - PG 제공자 (선택적)
 * @returns {Promise<void>}
 */
export async function requestBillingAuth(params, provider = DEFAULT_PG_PROVIDER) {
  const sdk = await PaymentGatewaySdkFactory.getInstance(provider);
  if (sdk.requestBillingAuth) {
    return sdk.requestBillingAuth(params);
  }
  throw new Error(`${provider}는 자동결제 등록을 지원하지 않습니다.`);
}

/**
 * PG SDK 인스턴스 가져오기
 * @param {string} provider - PG 제공자 (선택적)
 * @returns {Promise<PaymentGatewaySdk>}
 */
export async function getPaymentGatewaySdk(provider = DEFAULT_PG_PROVIDER) {
  return PaymentGatewaySdkFactory.getInstance(provider);
}

// ============================================
// 내보내기
// ============================================

export {
  PaymentGatewaySdk,
  TestPaymentGatewaySdk,
  TossPaymentGatewaySdk,
  StripePaymentGatewaySdk,
  IamportPaymentGatewaySdk,
  PaymentGatewaySdkFactory,
  DEFAULT_PG_PROVIDER,
  TEST_MODE,
};

