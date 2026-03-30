package com.coresolution.consultation.constant;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 결제 상태 상수 클래스
 * 시스템에서 사용되는 모든 결제 상태를 정의
 */
public final class PaymentStatus {
    
    // 기본 결제 상태
    public static final String PENDING = "PENDING";
    public static final String PROCESSING = "PROCESSING";
    public static final String COMPLETED = "COMPLETED";
    public static final String FAILED = "FAILED";
    public static final String CANCELLED = "CANCELLED";
    public static final String REFUNDED = "REFUNDED";
    public static final String PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED";
    public static final String EXPIRED = "EXPIRED";
    
    // 카드 결제 상태
    public static final String CARD_AUTHORIZED = "CARD_AUTHORIZED";
    public static final String CARD_CAPTURED = "CARD_CAPTURED";
    public static final String CARD_DECLINED = "CARD_DECLINED";
    public static final String CARD_PENDING_3DS = "CARD_PENDING_3DS";
    public static final String CARD_3DS_FAILED = "CARD_3DS_FAILED";
    
    // 계좌이체 상태
    public static final String BANK_TRANSFER_PENDING = "BANK_TRANSFER_PENDING";
    public static final String BANK_TRANSFER_COMPLETED = "BANK_TRANSFER_COMPLETED";
    public static final String BANK_TRANSFER_FAILED = "BANK_TRANSFER_FAILED";
    public static final String BANK_TRANSFER_EXPIRED = "BANK_TRANSFER_EXPIRED";
    
    // 가상계좌 상태
    public static final String VIRTUAL_ACCOUNT_ISSUED = "VIRTUAL_ACCOUNT_ISSUED";
    public static final String VIRTUAL_ACCOUNT_PENDING = "VIRTUAL_ACCOUNT_PENDING";
    public static final String VIRTUAL_ACCOUNT_COMPLETED = "VIRTUAL_ACCOUNT_COMPLETED";
    public static final String VIRTUAL_ACCOUNT_EXPIRED = "VIRTUAL_ACCOUNT_EXPIRED";
    
    // 간편결제 상태
    public static final String EASY_PAY_PENDING = "EASY_PAY_PENDING";
    public static final String EASY_PAY_COMPLETED = "EASY_PAY_COMPLETED";
    public static final String EASY_PAY_FAILED = "EASY_PAY_FAILED";
    public static final String EASY_PAY_CANCELLED = "EASY_PAY_CANCELLED";
    
    // 정기결제 상태
    public static final String SUBSCRIPTION_ACTIVE = "SUBSCRIPTION_ACTIVE";
    public static final String SUBSCRIPTION_PAUSED = "SUBSCRIPTION_PAUSED";
    public static final String SUBSCRIPTION_CANCELLED = "SUBSCRIPTION_CANCELLED";
    public static final String SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED";
    public static final String SUBSCRIPTION_PAYMENT_FAILED = "SUBSCRIPTION_PAYMENT_FAILED";
    
    // 결제 상태 그룹
    public static final Map<String, List<String>> STATUS_GROUPS;
    
    static {
        Map<String, List<String>> groups = new HashMap<>();
        groups.put("BASIC_STATUS", Arrays.asList(PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, REFUNDED, PARTIALLY_REFUNDED, EXPIRED));
        groups.put("CARD_STATUS", Arrays.asList(CARD_AUTHORIZED, CARD_CAPTURED, CARD_DECLINED, CARD_PENDING_3DS, CARD_3DS_FAILED));
        groups.put("BANK_STATUS", Arrays.asList(BANK_TRANSFER_PENDING, BANK_TRANSFER_COMPLETED, BANK_TRANSFER_FAILED, BANK_TRANSFER_EXPIRED));
        groups.put("VIRTUAL_ACCOUNT_STATUS", Arrays.asList(VIRTUAL_ACCOUNT_ISSUED, VIRTUAL_ACCOUNT_PENDING, VIRTUAL_ACCOUNT_COMPLETED, VIRTUAL_ACCOUNT_EXPIRED));
        groups.put("EASY_PAY_STATUS", Arrays.asList(EASY_PAY_PENDING, EASY_PAY_COMPLETED, EASY_PAY_FAILED, EASY_PAY_CANCELLED));
        groups.put("SUBSCRIPTION_STATUS", Arrays.asList(SUBSCRIPTION_ACTIVE, SUBSCRIPTION_PAUSED, SUBSCRIPTION_CANCELLED, SUBSCRIPTION_EXPIRED, SUBSCRIPTION_PAYMENT_FAILED));
        STATUS_GROUPS = Collections.unmodifiableMap(groups);
    }
    
    // 결제 상태 설명
    public static final Map<String, String> STATUS_DESCRIPTIONS;
    
    static {
        Map<String, String> descriptions = new HashMap<>();
        descriptions.put(PENDING, "결제 대기 중");
        descriptions.put(PROCESSING, "결제 처리 중");
        descriptions.put(COMPLETED, "결제 완료");
        descriptions.put(FAILED, "결제 실패");
        descriptions.put(CANCELLED, "결제 취소");
        descriptions.put(REFUNDED, "전액 환불");
        descriptions.put(PARTIALLY_REFUNDED, "부분 환불");
        descriptions.put(EXPIRED, "결제 만료");
        descriptions.put(CARD_AUTHORIZED, "카드 승인됨");
        descriptions.put(CARD_CAPTURED, "카드 결제 완료");
        descriptions.put(CARD_DECLINED, "카드 결제 거절");
        descriptions.put(CARD_PENDING_3DS, "3D Secure 인증 대기");
        descriptions.put(CARD_3DS_FAILED, "3D Secure 인증 실패");
        descriptions.put(BANK_TRANSFER_PENDING, "계좌이체 대기 중");
        descriptions.put(BANK_TRANSFER_COMPLETED, "계좌이체 완료");
        descriptions.put(BANK_TRANSFER_FAILED, "계좌이체 실패");
        descriptions.put(BANK_TRANSFER_EXPIRED, "계좌이체 만료");
        descriptions.put(VIRTUAL_ACCOUNT_ISSUED, "가상계좌 발급됨");
        descriptions.put(VIRTUAL_ACCOUNT_PENDING, "가상계좌 입금 대기");
        descriptions.put(VIRTUAL_ACCOUNT_COMPLETED, "가상계좌 입금 완료");
        descriptions.put(VIRTUAL_ACCOUNT_EXPIRED, "가상계좌 만료");
        descriptions.put(EASY_PAY_PENDING, "간편결제 대기 중");
        descriptions.put(EASY_PAY_COMPLETED, "간편결제 완료");
        descriptions.put(EASY_PAY_FAILED, "간편결제 실패");
        descriptions.put(EASY_PAY_CANCELLED, "간편결제 취소");
        descriptions.put(SUBSCRIPTION_ACTIVE, "정기결제 활성");
        descriptions.put(SUBSCRIPTION_PAUSED, "정기결제 일시정지");
        descriptions.put(SUBSCRIPTION_CANCELLED, "정기결제 취소");
        descriptions.put(SUBSCRIPTION_EXPIRED, "정기결제 만료");
        descriptions.put(SUBSCRIPTION_PAYMENT_FAILED, "정기결제 실패");
        STATUS_DESCRIPTIONS = Collections.unmodifiableMap(descriptions);
    }
    
    // 결제 상태별 우선순위
    public static final Map<String, Integer> STATUS_PRIORITIES;
    
    static {
        Map<String, Integer> priorities = new HashMap<>();
        priorities.put(FAILED, 1);
        priorities.put(EXPIRED, 1);
        priorities.put(CARD_DECLINED, 2);
        priorities.put(CARD_3DS_FAILED, 2);
        priorities.put(BANK_TRANSFER_FAILED, 2);
        priorities.put(EASY_PAY_FAILED, 2);
        priorities.put(SUBSCRIPTION_PAYMENT_FAILED, 2);
        priorities.put(PROCESSING, 3);
        priorities.put(PENDING, 4);
        priorities.put(COMPLETED, 5);
        priorities.put(REFUNDED, 5);
        priorities.put(PARTIALLY_REFUNDED, 5);
        STATUS_PRIORITIES = Collections.unmodifiableMap(priorities);
    }
    
    // 결제 상태별 색상
    public static final Map<String, String> STATUS_COLORS;
    
    static {
        Map<String, String> colors = new HashMap<>();
        colors.put(PENDING, "warning");
        colors.put(PROCESSING, "info");
        colors.put(COMPLETED, "success");
        colors.put(FAILED, "danger");
        colors.put(CANCELLED, "secondary");
        colors.put(REFUNDED, "info");
        colors.put(PARTIALLY_REFUNDED, "info");
        colors.put(EXPIRED, "danger");
        colors.put(CARD_AUTHORIZED, "primary");
        colors.put(CARD_CAPTURED, "success");
        colors.put(CARD_DECLINED, "danger");
        colors.put(CARD_PENDING_3DS, "warning");
        colors.put(CARD_3DS_FAILED, "danger");
        colors.put(BANK_TRANSFER_PENDING, "warning");
        colors.put(BANK_TRANSFER_COMPLETED, "success");
        colors.put(BANK_TRANSFER_FAILED, "danger");
        colors.put(BANK_TRANSFER_EXPIRED, "danger");
        colors.put(VIRTUAL_ACCOUNT_ISSUED, "primary");
        colors.put(VIRTUAL_ACCOUNT_PENDING, "warning");
        colors.put(VIRTUAL_ACCOUNT_COMPLETED, "success");
        colors.put(VIRTUAL_ACCOUNT_EXPIRED, "danger");
        colors.put(EASY_PAY_PENDING, "warning");
        colors.put(EASY_PAY_COMPLETED, "success");
        colors.put(EASY_PAY_FAILED, "danger");
        colors.put(EASY_PAY_CANCELLED, "secondary");
        colors.put(SUBSCRIPTION_ACTIVE, "success");
        colors.put(SUBSCRIPTION_PAUSED, "warning");
        colors.put(SUBSCRIPTION_CANCELLED, "secondary");
        colors.put(SUBSCRIPTION_EXPIRED, "danger");
        colors.put(SUBSCRIPTION_PAYMENT_FAILED, "danger");
        STATUS_COLORS = Collections.unmodifiableMap(colors);
    }
    
    // 결제 상태별 아이콘
    public static final Map<String, String> STATUS_ICONS;
    
    static {
        Map<String, String> icons = new HashMap<>();
        icons.put(PENDING, "bi-clock");
        icons.put(PROCESSING, "bi-arrow-clockwise");
        icons.put(COMPLETED, "bi-check-circle-fill");
        icons.put(FAILED, "bi-x-circle-fill");
        icons.put(CANCELLED, "bi-x-circle");
        icons.put(REFUNDED, "bi-arrow-return-left");
        icons.put(PARTIALLY_REFUNDED, "bi-arrow-return-left");
        icons.put(EXPIRED, "bi-exclamation-triangle");
        icons.put(CARD_AUTHORIZED, "bi-credit-card");
        icons.put(CARD_CAPTURED, "bi-credit-card-fill");
        icons.put(CARD_DECLINED, "bi-credit-card");
        icons.put(CARD_PENDING_3DS, "bi-shield-lock");
        icons.put(CARD_3DS_FAILED, "bi-shield-exclamation");
        icons.put(BANK_TRANSFER_PENDING, "bi-bank");
        icons.put(BANK_TRANSFER_COMPLETED, "bi-bank2");
        icons.put(BANK_TRANSFER_FAILED, "bi-bank");
        icons.put(BANK_TRANSFER_EXPIRED, "bi-bank");
        icons.put(VIRTUAL_ACCOUNT_ISSUED, "bi-wallet");
        icons.put(VIRTUAL_ACCOUNT_PENDING, "bi-wallet2");
        icons.put(VIRTUAL_ACCOUNT_COMPLETED, "bi-wallet-fill");
        icons.put(VIRTUAL_ACCOUNT_EXPIRED, "bi-wallet");
        icons.put(EASY_PAY_PENDING, "bi-phone");
        icons.put(EASY_PAY_COMPLETED, "bi-phone-fill");
        icons.put(EASY_PAY_FAILED, "bi-phone");
        icons.put(EASY_PAY_CANCELLED, "bi-phone");
        icons.put(SUBSCRIPTION_ACTIVE, "bi-arrow-repeat");
        icons.put(SUBSCRIPTION_PAUSED, "bi-pause-circle");
        icons.put(SUBSCRIPTION_CANCELLED, "bi-stop-circle");
        icons.put(SUBSCRIPTION_EXPIRED, "bi-exclamation-triangle");
        icons.put(SUBSCRIPTION_PAYMENT_FAILED, "bi-exclamation-triangle-fill");
        STATUS_ICONS = Collections.unmodifiableMap(icons);
    }
    
    // 유틸리티 메서드
    public static boolean isValidStatus(String status) {
        return STATUS_DESCRIPTIONS.containsKey(status);
    }
    
    public static List<String> getAllStatuses() {
        return List.copyOf(STATUS_DESCRIPTIONS.keySet());
    }
    
    public static List<String> getStatusesByGroup(String group) {
        return STATUS_GROUPS.getOrDefault(group, List.of());
    }
    
    public static String getDescription(String status) {
        return STATUS_DESCRIPTIONS.getOrDefault(status, "알 수 없는 결제 상태");
    }
    
    public static int getPriority(String status) {
        return STATUS_PRIORITIES.getOrDefault(status, 5);
    }
    
    public static String getColor(String status) {
        return STATUS_COLORS.getOrDefault(status, "secondary");
    }
    
    public static String getIcon(String status) {
        return STATUS_ICONS.getOrDefault(status, "bi-question-circle");
    }
    
    public static List<String> getHighPriorityStatuses() {
        return STATUS_PRIORITIES.entrySet().stream()
            .filter(entry -> entry.getValue() <= 2)
            .map(Map.Entry::getKey)
            .toList();
    }
    
    public static List<String> getLowPriorityStatuses() {
        return STATUS_PRIORITIES.entrySet().stream()
            .filter(entry -> entry.getValue() >= 4)
            .map(Map.Entry::getKey)
            .toList();
    }
    
    public static boolean isFinalStatus(String status) {
        return Arrays.asList(COMPLETED, FAILED, CANCELLED, REFUNDED, PARTIALLY_REFUNDED, EXPIRED).contains(status);
    }
    
    public static boolean isPendingStatus(String status) {
        return Arrays.asList(PENDING, PROCESSING, CARD_PENDING_3DS, BANK_TRANSFER_PENDING, 
                           VIRTUAL_ACCOUNT_PENDING, EASY_PAY_PENDING).contains(status);
    }
    
    public static boolean isFailedStatus(String status) {
        return Arrays.asList(FAILED, CARD_DECLINED, CARD_3DS_FAILED, BANK_TRANSFER_FAILED, 
                           EASY_PAY_FAILED, SUBSCRIPTION_PAYMENT_FAILED).contains(status);
    }
    
    // 생성자 방지
    private PaymentStatus() {
        throw new UnsupportedOperationException("이 클래스는 인스턴스화할 수 없습니다.");
    }
}
