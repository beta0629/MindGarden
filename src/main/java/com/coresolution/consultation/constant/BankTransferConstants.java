package com.coresolution.consultation.constant;

/**
 * 은행 이체 관련 상수 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public class BankTransferConstants {
    
    // === 은행 코드 ===
    public static final String BANK_KB = "004"; // 국민은행
    public static final String BANK_SHINHAN = "088"; // 신한은행
    public static final String BANK_WOORI = "020"; // 우리은행
    public static final String BANK_HANA = "081"; // 하나은행
    public static final String BANK_NH = "011"; // 농협은행
    public static final String BANK_IBK = "003"; // 기업은행
    public static final String BANK_KDB = "002"; // 산업은행
    public static final String BANK_KEB = "023"; // 외환은행
    
    // === 은행 API 관련 ===
    public static final String BANK_API_BASE_URL = "https://api.bank.example.com";
    public static final String BANK_API_VIRTUAL_ACCOUNT_ENDPOINT = "/v1/virtual-accounts";
    public static final String BANK_API_DEPOSIT_CHECK_ENDPOINT = "/v1/deposits/check";
    public static final String BANK_API_ACCOUNT_INFO_ENDPOINT = "/v1/accounts/{accountNumber}";
    public static final String BANK_API_TRANSFER_ENDPOINT = "/v1/transfers";
    public static final String BANK_API_BALANCE_ENDPOINT = "/v1/accounts/{accountNumber}/balance";
    
    // === API 인증 ===
    public static final String BANK_API_KEY_HEADER = "X-Bank-API-Key";
    public static final String BANK_API_SECRET_HEADER = "X-Bank-API-Secret";
    public static final String BANK_API_KEY_VALUE = "bank_api_key_12345";
    public static final String BANK_API_SECRET_VALUE = "bank_api_secret_67890";
    
    // === 가상계좌 관련 ===
    public static final String VIRTUAL_ACCOUNT_PREFIX = "VA";
    public static final int VIRTUAL_ACCOUNT_LENGTH = 20;
    public static final int VIRTUAL_ACCOUNT_EXPIRY_DAYS = 7;
    public static final String VIRTUAL_ACCOUNT_DESCRIPTION = "상담비 결제";
    
    // === 입금 확인 관련 ===
    public static final int DEPOSIT_CHECK_INTERVAL_MINUTES = 5; // 5분마다 입금 확인
    public static final int DEPOSIT_CHECK_RETRY_COUNT = 3; // 최대 3회 재시도
    public static final int DEPOSIT_TIMEOUT_HOURS = 24; // 24시간 후 입금 만료
    
    // === 통계 관련 ===
    public static final String STATS_TOTAL_DEPOSITS = "totalDeposits";
    public static final String STATS_SUCCESSFUL_DEPOSITS = "successfulDeposits";
    public static final String STATS_FAILED_DEPOSITS = "failedDeposits";
    public static final String STATS_PENDING_DEPOSITS = "pendingDeposits";
    public static final String STATS_TOTAL_AMOUNT = "totalAmount";
    public static final String STATS_AVERAGE_AMOUNT = "averageAmount";
    public static final String STATS_DAILY_DEPOSITS = "dailyDeposits";
    public static final String STATS_MONTHLY_DEPOSITS = "monthlyDeposits";
    
    // === 에러 메시지 ===
    public static final String ERROR_BANK_API_FAILED = "은행 API 연동에 실패했습니다.";
    public static final String ERROR_VIRTUAL_ACCOUNT_CREATION_FAILED = "가상계좌 생성에 실패했습니다.";
    public static final String ERROR_DEPOSIT_CHECK_FAILED = "입금 확인에 실패했습니다.";
    public static final String ERROR_INVALID_ACCOUNT_NUMBER = "유효하지 않은 계좌번호입니다.";
    public static final String ERROR_ACCOUNT_NOT_FOUND = "계좌를 찾을 수 없습니다.";
    public static final String ERROR_INSUFFICIENT_BALANCE = "잔액이 부족합니다.";
    public static final String ERROR_TRANSFER_FAILED = "이체에 실패했습니다.";
    public static final String ERROR_DEPOSIT_TIMEOUT = "입금 시간이 만료되었습니다.";
    
    // === 성공 메시지 ===
    public static final String SUCCESS_VIRTUAL_ACCOUNT_CREATED = "가상계좌가 생성되었습니다.";
    public static final String SUCCESS_DEPOSIT_CONFIRMED = "입금이 확인되었습니다.";
    public static final String SUCCESS_TRANSFER_COMPLETED = "이체가 완료되었습니다.";
    public static final String SUCCESS_DEPOSIT_CHECKED = "입금 확인이 완료되었습니다.";
    
    // === 입금 상태 ===
    public static final String DEPOSIT_STATUS_PENDING = "PENDING";
    public static final String DEPOSIT_STATUS_CONFIRMED = "CONFIRMED";
    public static final String DEPOSIT_STATUS_FAILED = "FAILED";
    public static final String DEPOSIT_STATUS_EXPIRED = "EXPIRED";
    
    // === 이체 상태 ===
    public static final String TRANSFER_STATUS_PENDING = "PENDING";
    public static final String TRANSFER_STATUS_PROCESSING = "PROCESSING";
    public static final String TRANSFER_STATUS_COMPLETED = "COMPLETED";
    public static final String TRANSFER_STATUS_FAILED = "FAILED";
    public static final String TRANSFER_STATUS_CANCELLED = "CANCELLED";
    
    // === 통화 ===
    public static final String CURRENCY_KRW = "KRW";
    public static final String CURRENCY_USD = "USD";
    
    // === 수수료 ===
    public static final double TRANSFER_FEE_RATE = 0.001; // 0.1%
    public static final long MIN_TRANSFER_AMOUNT = 1000L; // 최소 이체 금액
    public static final long MAX_TRANSFER_AMOUNT = 100000000L; // 최대 이체 금액
    
    // === 시간 관련 ===
    public static final String TIME_FORMAT = "HH:mm:ss";
    public static final String DATE_FORMAT = "yyyy-MM-dd";
    public static final String DATETIME_FORMAT = "yyyy-MM-dd HH:mm:ss";
    
    // === API 응답 코드 ===
    public static final String API_SUCCESS_CODE = "0000";
    public static final String API_ERROR_CODE_INVALID_ACCOUNT = "1001";
    public static final String API_ERROR_CODE_INSUFFICIENT_BALANCE = "1002";
    public static final String API_ERROR_CODE_SYSTEM_ERROR = "9999";
}
