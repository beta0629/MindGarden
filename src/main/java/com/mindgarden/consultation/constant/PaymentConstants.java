package com.mindgarden.consultation.constant;

/**
 * 결제 관련 상수 클래스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
public final class PaymentConstants {
    
    // 결제 상태 상수
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_PROCESSING = "PROCESSING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_CANCELLED = "CANCELLED";
    public static final String STATUS_REFUNDED = "REFUNDED";
    public static final String STATUS_EXPIRED = "EXPIRED";
    
    // 결제 방법 상수
    public static final String METHOD_CARD = "CARD";
    public static final String METHOD_BANK_TRANSFER = "BANK_TRANSFER";
    public static final String METHOD_VIRTUAL_ACCOUNT = "VIRTUAL_ACCOUNT";
    public static final String METHOD_MOBILE = "MOBILE";
    public static final String METHOD_CASH = "CASH";
    
    // 결제 대행사 상수
    public static final String PROVIDER_TOSS = "TOSS";
    public static final String PROVIDER_IAMPORT = "IAMPORT";
    public static final String PROVIDER_KAKAO = "KAKAO";
    public static final String PROVIDER_NAVER = "NAVER";
    public static final String PROVIDER_PAYPAL = "PAYPAL";
    
    // 결제 관련 설정
    public static final int PAYMENT_TIMEOUT_MINUTES = 30; // 결제 만료 시간 (분)
    public static final int WEBHOOK_RETRY_COUNT = 3; // Webhook 재시도 횟수
    public static final int WEBHOOK_TIMEOUT_SECONDS = 30; // Webhook 타임아웃 (초)
    
    // 결제 금액 제한
    public static final long MIN_PAYMENT_AMOUNT = 1000L; // 최소 결제 금액 (원)
    public static final long MAX_PAYMENT_AMOUNT = 10000000L; // 최대 결제 금액 (원)
    
    // 환불 관련
    public static final int REFUND_DEADLINE_DAYS = 7; // 환불 가능 기간 (일)
    public static final double REFUND_FEE_RATE = 0.05; // 환불 수수료율 (5%)
    
    // 암호화 관련
    public static final String ENCRYPTION_ALGORITHM = "AES-256-GCM";
    public static final String HASH_ALGORITHM = "SHA-256";
    
    // API 관련
    public static final String WEBHOOK_SIGNATURE_HEADER = "X-Webhook-Signature";
    public static final String WEBHOOK_TIMESTAMP_HEADER = "X-Webhook-Timestamp";
    
    // 에러 메시지
    public static final String ERROR_INVALID_AMOUNT = "유효하지 않은 결제 금액입니다.";
    public static final String ERROR_PAYMENT_EXPIRED = "결제가 만료되었습니다.";
    public static final String ERROR_PAYMENT_ALREADY_PROCESSED = "이미 처리된 결제입니다.";
    public static final String ERROR_INSUFFICIENT_PERMISSION = "결제 처리 권한이 없습니다.";
    public static final String ERROR_WEBHOOK_VERIFICATION_FAILED = "Webhook 검증에 실패했습니다.";
    
    private PaymentConstants() {
        // 유틸리티 클래스이므로 인스턴스 생성 방지
        throw new UnsupportedOperationException("유틸리티 클래스입니다.");
    }
}
