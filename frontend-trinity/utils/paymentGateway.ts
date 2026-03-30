/**
 * 결제 게이트웨이 (PG) SDK 유틸리티
 * 
 * 이 파일은 PG SDK 연동을 위한 추상화 레이어를 제공합니다.
 * 현재는 테스트 모드로 동작하며, 실제 PG SDK 연동 시 이 파일만 수정하면 됩니다.
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */

import { TRINITY_CONSTANTS } from '../constants/trinity';

/**
 * PG 제공자 타입
 * 백엔드 PgProvider enum과 일치시킴
 */
export type PgProvider = 'TOSS' | 'STRIPE' | 'IAMPORT' | 'KAKAO' | 'NAVER' | 'PAYPAL' | 'OTHER';

/**
 * 카드 정보 인터페이스
 */
export interface CardInfo {
  cardNumber: string; // 카드 번호 (숫자만, 공백 제거)
  expiryMonth: string; // 만료 월 (MM)
  expiryYear: string; // 만료 년도 (YY)
  cvc: string; // CVC 코드
  cardholderName?: string; // 카드 소유자 이름
}

/**
 * PG 토큰 생성 결과
 */
export interface PaymentTokenResult {
  token: string; // PG에서 받은 토큰
  cardBrand?: string; // 카드 브랜드 (VISA, MASTERCARD 등)
  cardLast4?: string; // 카드 마지막 4자리
  expiryMonth?: number; // 만료 월
  expiryYear?: number; // 만료 년도
}

/**
 * PG SDK 초기화 옵션
 */
export interface PgSdkInitOptions {
  clientKey?: string; // PG 클라이언트 키 (환경 변수에서 가져옴)
  testMode?: boolean; // 테스트 모드 여부
}

/**
 * PG SDK 인터페이스 (추상화)
 */
export interface PaymentGatewaySdk {
  /**
   * SDK 초기화
   */
  init(options: PgSdkInitOptions): Promise<void>;
  
  /**
   * 카드 정보를 토큰으로 변환
   * 
   * 참고: 토스페이먼츠 SDK v2는 리다이렉트 방식만 지원하므로,
   * 이 메서드는 테스트 모드에서만 사용됩니다.
   */
  createToken(cardInfo: CardInfo): Promise<PaymentTokenResult>;
  
  /**
   * 토큰 검증
   */
  verifyToken(token: string): Promise<boolean>;
  
  /**
   * 자동결제(빌링) 등록창 열기 (토스페이먼츠 전용, 리다이렉트 방식)
   * 
   * 참고: 토스페이먼츠 SDK v2는 requestBillingAuth()를 사용하여
   * 리다이렉트 방식으로 자동결제를 등록합니다.
   */
  requestBillingAuth?(params: {
    customerKey: string;
    customerName?: string;
    customerEmail?: string;
    successUrl: string;
    failUrl: string;
  }): Promise<void>;
  
  /**
   * 즉시 결제 요청 (일회성 결제)
   * 
   * 참고: 토스페이먼츠 SDK v2는 requestPayment()를 사용하여
   * 리다이렉트 방식으로 즉시 결제를 진행합니다.
   */
  requestPayment?(params: {
    customerKey: string;
    amount: number;
    orderId: string;
    orderName: string;
    customerName?: string;
    customerEmail?: string;
    successUrl: string;
    failUrl: string;
  }): Promise<void>;
}

/**
 * 테스트 모드 PG SDK 구현
 * 실제 PG SDK가 없을 때 사용하는 모의 구현
 */
class TestPaymentGatewaySdk implements PaymentGatewaySdk {
  async init(options: PgSdkInitOptions): Promise<void> {
    // 테스트 모드에서는 초기화 불필요
    console.log('[Test Mode] PG SDK 초기화 (모의)');
  }
  
  async createToken(cardInfo: CardInfo): Promise<PaymentTokenResult> {
    // 카드 번호 유효성 검사 (간단한 체크)
    const cardNumber = cardInfo.cardNumber.replace(/\s/g, '');
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      throw new Error('카드 번호가 올바르지 않습니다.');
    }
    
    // 만료일 유효성 검사
    const currentYear = new Date().getFullYear() % 100;
    const expiryYear = parseInt(cardInfo.expiryYear);
    if (expiryYear < currentYear) {
      throw new Error('카드 만료일이 지났습니다.');
    }
    
    // CVC 유효성 검사
    if (cardInfo.cvc.length < 3 || cardInfo.cvc.length > 4) {
      throw new Error('CVC 코드가 올바르지 않습니다.');
    }
    
    // 테스트 모드: 시뮬레이션 토큰 생성
    const testToken = `tok_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // 카드 브랜드 감지 (간단한 체크)
    const cardBrand = this.detectCardBrand(cardNumber);
    
    return {
      token: testToken,
      cardBrand,
      cardLast4: cardNumber.slice(-4),
      expiryMonth: parseInt(cardInfo.expiryMonth),
      expiryYear: 2000 + expiryYear, // YY -> YYYY 변환
    };
  }
  
  async verifyToken(token: string): Promise<boolean> {
    // 테스트 모드: 토큰 형식만 확인
    return token.startsWith('tok_test_');
  }
  
  /**
   * 자동결제(빌링) 등록창 열기 (테스트 모드 시뮬레이션)
   * 실제로는 리다이렉트되지 않고 콜백 URL로 직접 이동 (테스트용)
   */
  async requestBillingAuth(params: {
    customerKey: string;
    customerName?: string;
    customerEmail?: string;
    successUrl: string;
    failUrl: string;
  }): Promise<void> {
    // 테스트 모드: 시뮬레이션 billingKey 생성
    const testBillingKey = `billing_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // 테스트 모드에서는 성공 URL로 리다이렉트 (실제 토스페이먼츠 페이지 대신)
    // 실제 환경에서는 이 메서드가 호출되지 않고 실제 SDK가 사용됨
    console.warn('[Test Mode] 실제 토스페이먼츠 SDK를 사용하세요. 테스트 모드에서는 시뮬레이션만 제공됩니다.');
    
    // 테스트용: 성공 URL에 authKey 파라미터 추가하여 리다이렉트
    const successUrlWithKey = `${params.successUrl}${params.successUrl.includes('?') ? '&' : '?'}authKey=${encodeURIComponent(testBillingKey)}`;
    window.location.href = successUrlWithKey;
  }
  
  /**
   * 카드 브랜드 감지 (간단한 구현)
   */
  private detectCardBrand(cardNumber: string): string {
    const firstDigit = cardNumber[0];
    const firstTwoDigits = cardNumber.substring(0, 2);
    
    if (firstDigit === '4') {
      return 'VISA';
    } else if (firstTwoDigits >= '51' && firstTwoDigits <= '55') {
      return 'MASTERCARD';
    } else if (firstTwoDigits === '34' || firstTwoDigits === '37') {
      return 'AMEX';
    } else if (firstTwoDigits >= '30' && firstTwoDigits <= '35') {
      return 'DINERS';
    } else if (firstTwoDigits === '35') {
      return 'JCB';
    } else {
      return 'UNKNOWN';
    }
  }
}

/**
 * 토스페이먼츠 SDK v2 구현
 * 
 * 참고: https://docs.tosspayments.com/sdk/v2/js
 * 
 * 토스페이먼츠 SDK v2는 HTML 스크립트 태그로 로드되며,
 * 전역 객체(window)에 TossPayments 함수가 생성됩니다.
 * 
 * 자동결제(빌링) 등록은 payment.requestBillingAuth()를 사용하며,
 * 리다이렉트 방식으로 동작합니다.
 */
class TossPaymentGatewaySdk implements PaymentGatewaySdk {
  private clientKey: string | null = null;
  private tossPayments: any = null;
  
  async init(options: PgSdkInitOptions): Promise<void> {
    this.clientKey = options.clientKey || process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';
    
    if (!this.clientKey) {
      throw new Error('토스페이먼츠 클라이언트 키가 설정되지 않았습니다. NEXT_PUBLIC_TOSS_CLIENT_KEY 환경 변수를 확인하세요.');
    }
    
    // 브라우저 환경 확인
    if (typeof window === 'undefined') {
      throw new Error('TossPayments SDK는 브라우저 환경에서만 사용할 수 있습니다.');
    }
    
    // npm 패키지에서 loadTossPayments 함수를 동적으로 import
    // 동적 import를 사용하여 서버 사이드 렌더링 시 오류 방지
    const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
    
    // SDK 로드 및 초기화
    console.log('[TossPayments] SDK 로드 시작...');
    const tossPaymentsSdk = await loadTossPayments(this.clientKey);
    this.tossPayments = tossPaymentsSdk;
    
    console.log('[TossPayments] SDK 초기화 완료');
  }
  
  /**
   * 카드 정보를 토큰으로 변환
   * 
   * 참고: 토스페이먼츠 SDK v2의 requestBillingAuth()는 리다이렉트 방식이므로,
   * 이 메서드는 테스트 모드에서만 사용됩니다.
   * 실제 프로덕션에서는 requestBillingAuth()를 직접 호출하여 리다이렉트를 처리해야 합니다.
   */
  async createToken(cardInfo: CardInfo): Promise<PaymentTokenResult> {
    if (!this.tossPayments) {
      throw new Error('TossPayments SDK가 초기화되지 않았습니다. init()을 먼저 호출하세요.');
    }
    
    // 토스페이먼츠 SDK v2는 requestBillingAuth()를 사용하지만,
    // 이는 리다이렉트 방식이므로 현재 인라인 카드 입력 방식과는 호환되지 않습니다.
    // 
    // 두 가지 옵션:
    // 1. 리다이렉트 방식으로 변경 (권장): requestBillingAuth() 사용
    // 2. 테스트 모드에서만 인라인 방식 사용
    
    // 현재는 테스트 모드와 동일하게 처리 (실제 연동 시 리다이렉트 방식으로 변경 필요)
    throw new Error('토스페이먼츠 SDK v2는 리다이렉트 방식만 지원합니다. requestBillingAuth()를 직접 사용하세요.');
  }
  
  async verifyToken(token: string): Promise<boolean> {
    // 토스페이먼츠 API로 토큰 검증 (백엔드에서 처리)
    // 프론트엔드에서는 토큰 형식만 확인
    return token.startsWith('billing_') || token.length > 0;
  }
  
  /**
   * 자동결제(빌링) 등록창 열기 (리다이렉트 방식)
   * 
   * 참고: https://docs.tosspayments.com/sdk/v2/js#paymentrequestbillingauth
   * 
   * 주의: 모달 방식은 PaymentMethodModal 컴포넌트에서 직접 처리합니다.
   * 이 메서드는 리다이렉트 방식으로 사용됩니다.
   * 
   * @param params 자동결제 등록 파라미터
   */
  async requestBillingAuth(params: {
    customerKey: string;
    customerName?: string;
    customerEmail?: string;
    successUrl: string;
    failUrl: string;
  }): Promise<void> {
    if (!this.tossPayments) {
      throw new Error('TossPayments SDK가 초기화되지 않았습니다. init()을 먼저 호출하세요.');
    }
    
    // payment 객체 가져오기 (customerKey 필요)
    const payment = this.tossPayments.payment({
      customerKey: params.customerKey,
    });
    
    // 자동결제 등록창 열기 (리다이렉트 방식)
    // 주의: requestBillingAuth에는 customerKey를 전달하지 않음 (payment() 초기화 시 이미 전달됨)
    await payment.requestBillingAuth({
      method: 'CARD', // 카드 자동결제
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      successUrl: params.successUrl,
      failUrl: params.failUrl,
      windowTarget: 'self', // 현재 창에서 리다이렉트
    });
  }
  
  /**
   * 즉시 결제 요청 (일회성 결제, 리다이렉트 방식)
   * 
   * 참고: https://docs.tosspayments.com/sdk/v2/js#paymentrequestpayment
   * 
   * @param params 결제 요청 파라미터
   */
  async requestPayment(params: {
    customerKey: string;
    amount: number;
    orderId: string;
    orderName: string;
    customerName?: string;
    customerEmail?: string;
    successUrl: string;
    failUrl: string;
  }): Promise<void> {
    if (!this.tossPayments) {
      throw new Error('TossPayments SDK가 초기화되지 않았습니다. init()을 먼저 호출하세요.');
    }
    
    // payment 객체 가져오기 (customerKey 필요)
    const payment = this.tossPayments.payment({
      customerKey: params.customerKey,
    });
    
    // 즉시 결제 요청 (리다이렉트 방식)
    await payment.requestPayment({
      method: 'CARD', // 카드 결제
      amount: {
        currency: 'KRW',
        value: params.amount,
      },
      orderId: params.orderId,
      orderName: params.orderName,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      successUrl: params.successUrl,
      failUrl: params.failUrl,
      windowTarget: 'self', // 현재 창에서 리다이렉트
    });
  }
}

/**
 * Stripe SDK 구현 (추후 구현)
 * 
 * 참고: https://stripe.com/docs/js
 */
class StripePaymentGatewaySdk implements PaymentGatewaySdk {
  private stripe: any = null;
  
  async init(options: PgSdkInitOptions): Promise<void> {
    // TODO: Stripe SDK 로드 및 초기화
    // import { loadStripe } from '@stripe/stripe-js';
    // this.stripe = await loadStripe(options.clientKey || '');
    throw new Error('Stripe SDK는 아직 구현되지 않았습니다.');
  }
  
  async createToken(cardInfo: CardInfo): Promise<PaymentTokenResult> {
    // TODO: Stripe Elements 사용
    throw new Error('Stripe SDK는 아직 구현되지 않았습니다.');
  }
  
  async verifyToken(token: string): Promise<boolean> {
    // TODO: Stripe API로 토큰 검증
    return false;
  }
  
  async requestBillingAuth?(params: {
    customerKey: string;
    customerName?: string;
    customerEmail?: string;
    successUrl: string;
    failUrl: string;
  }): Promise<void> {
    // TODO: Stripe Setup Intent 사용
    throw new Error('Stripe SDK는 아직 구현되지 않았습니다.');
  }
}

/**
 * 아임포트 SDK 구현 (추후 구현)
 * 
 * 참고: https://developers.iamport.kr/
 */
class IamportPaymentGatewaySdk implements PaymentGatewaySdk {
  async init(options: PgSdkInitOptions): Promise<void> {
    throw new Error('아임포트 SDK는 아직 구현되지 않았습니다.');
  }
  
  async createToken(cardInfo: CardInfo): Promise<PaymentTokenResult> {
    throw new Error('아임포트 SDK는 아직 구현되지 않았습니다.');
  }
  
  async verifyToken(token: string): Promise<boolean> {
    return false;
  }
  
  async requestBillingAuth?(params: {
    customerKey: string;
    customerName?: string;
    customerEmail?: string;
    successUrl: string;
    failUrl: string;
  }): Promise<void> {
    throw new Error('아임포트 SDK는 아직 구현되지 않았습니다.');
  }
}

/**
 * PG SDK 팩토리
 * 설정에 따라 적절한 SDK 인스턴스를 반환합니다.
 */
export class PaymentGatewaySdkFactory {
  private static instance: PaymentGatewaySdk | null = null;
  
  /**
   * PG SDK 인스턴스 가져오기
   */
  static async getInstance(provider: PgProvider = TRINITY_CONSTANTS.PAYMENT.DEFAULT_PG_PROVIDER as PgProvider): Promise<PaymentGatewaySdk> {
    if (this.instance) {
      return this.instance;
    }
    
    const testMode = TRINITY_CONSTANTS.PAYMENT.TEST_MODE;
    
    // 실제 PG SDK 사용 (테스트 모드에서도 실제 SDK 사용, 테스트 키 사용)
    switch (provider) {
      case 'TOSS':
        // 토스페이먼츠 SDK 초기화 (테스트 모드에서도 실제 SDK 사용)
        this.instance = new TossPaymentGatewaySdk();
        await this.instance.init({
          clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '',
          testMode: testMode, // 테스트 모드 플래그 전달
        });
        break;
      case 'STRIPE':
        if (testMode) {
          console.warn('[PaymentGateway] Stripe SDK는 아직 구현되지 않았습니다. 테스트 모드를 사용합니다.');
          this.instance = new TestPaymentGatewaySdk();
        } else {
          throw new Error('Stripe SDK는 아직 구현되지 않았습니다.');
        }
        break;
      case 'IAMPORT':
        if (testMode) {
          console.warn('[PaymentGateway] 아임포트 SDK는 아직 구현되지 않았습니다. 테스트 모드를 사용합니다.');
          this.instance = new TestPaymentGatewaySdk();
        } else {
          throw new Error('아임포트 SDK는 아직 구현되지 않았습니다.');
        }
        break;
      default:
        throw new Error(`지원하지 않는 PG 제공자입니다: ${provider}`);
    }
    
    // SDK 초기화 (이미 위에서 초기화했으므로 중복 초기화 방지)
    if (!(this.instance instanceof TossPaymentGatewaySdk)) {
      await this.instance.init({
        testMode,
      });
    }
    
    return this.instance;
  }
  
  /**
   * SDK 인스턴스 리셋 (테스트용)
   */
  static reset(): void {
    this.instance = null;
  }
}

/**
 * 카드 정보를 토큰으로 변환하는 헬퍼 함수
 * 
 * @param cardInfo 카드 정보
 * @param provider PG 제공자 (선택적, 기본값: 설정값)
 * @returns PG 토큰 생성 결과
 */
export async function createPaymentToken(
  cardInfo: CardInfo,
  provider: PgProvider = TRINITY_CONSTANTS.PAYMENT.DEFAULT_PG_PROVIDER as PgProvider
): Promise<PaymentTokenResult> {
  const sdk = await PaymentGatewaySdkFactory.getInstance(provider);
  return sdk.createToken(cardInfo);
}

/**
 * 토큰 검증 헬퍼 함수
 * 
 * @param token 검증할 토큰
 * @param provider PG 제공자 (선택적, 기본값: 설정값)
 * @returns 검증 결과
 */
export async function verifyPaymentToken(
  token: string,
  provider: PgProvider = TRINITY_CONSTANTS.PAYMENT.DEFAULT_PG_PROVIDER as PgProvider
): Promise<boolean> {
  const sdk = await PaymentGatewaySdkFactory.getInstance(provider);
  return sdk.verifyToken(token);
}

/**
 * 자동결제(빌링) 등록창 열기 헬퍼 함수
 * 
 * @param params 자동결제 등록 파라미터
 * @param provider PG 제공자 (선택적, 기본값: 설정값)
 */
export async function requestBillingAuth(
  params: {
    customerKey: string;
    customerName?: string;
    customerEmail?: string;
    successUrl: string;
    failUrl: string;
  },
  provider: PgProvider = TRINITY_CONSTANTS.PAYMENT.DEFAULT_PG_PROVIDER as PgProvider
): Promise<void> {
  const sdk = await PaymentGatewaySdkFactory.getInstance(provider);
  if (sdk.requestBillingAuth) {
    return sdk.requestBillingAuth(params);
  }
  throw new Error(`${provider}는 자동결제 등록을 지원하지 않습니다.`);
}

/**
 * PG SDK 인스턴스 가져오기 헬퍼 함수
 * 
 * @param provider PG 제공자 (선택적, 기본값: 설정값)
 * @returns PG SDK 인스턴스
 */
export async function getPaymentGatewaySdk(
  provider: PgProvider = TRINITY_CONSTANTS.PAYMENT.DEFAULT_PG_PROVIDER as PgProvider
): Promise<PaymentGatewaySdk> {
  return PaymentGatewaySdkFactory.getInstance(provider);
}

