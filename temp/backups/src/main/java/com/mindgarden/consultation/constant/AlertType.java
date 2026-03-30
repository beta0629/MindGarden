package com.mindgarden.consultation.constant;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 알림 타입 상수 클래스
 * 시스템에서 사용되는 모든 알림 타입을 정의
 */
public final class AlertType {
    
    // 기본 알림 타입
    public static final String SYSTEM = "SYSTEM";
    public static final String USER = "USER";
    public static final String CONSULTATION = "CONSULTATION";
    public static final String PAYMENT = "PAYMENT";
    public static final String SECURITY = "SECURITY";
    public static final String MAINTENANCE = "MAINTENANCE";
    
    // 사용자 관련 알림
    public static final String REGISTRATION = "REGISTRATION";
    public static final String LOGIN = "LOGIN";
    public static final String PASSWORD_CHANGE = "PASSWORD_CHANGE";
    public static final String PROFILE_UPDATE = "PROFILE_UPDATE";
    public static final String ACCOUNT_VERIFICATION = "ACCOUNT_VERIFICATION";
    
    // 상담 관련 알림
    public static final String CONSULTATION_REQUEST = "CONSULTATION_REQUEST";
    public static final String CONSULTATION_CONFIRMED = "CONSULTATION_CONFIRMED";
    public static final String CONSULTATION_CANCELLED = "CONSULTATION_CANCELLED";
    public static final String CONSULTATION_REMINDER = "CONSULTATION_REMINDER";
    public static final String CONSULTATION_COMPLETED = "CONSULTATION_COMPLETED";
    
    // 결제 관련 알림
    public static final String PAYMENT_SUCCESS = "PAYMENT_SUCCESS";
    public static final String PAYMENT_FAILED = "PAYMENT_FAILED";
    public static final String PAYMENT_REFUND = "PAYMENT_REFUND";
    public static final String SUBSCRIPTION_RENEWAL = "SUBSCRIPTION_RENEWAL";
    public static final String SUBSCRIPTION_EXPIRY = "SUBSCRIPTION_EXPIRY";
    
    // 보안 관련 알림
    public static final String SUSPICIOUS_LOGIN = "SUSPICIOUS_LOGIN";
    public static final String ACCOUNT_LOCKED = "ACCOUNT_LOCKED";
    public static final String PERMISSION_DENIED = "PERMISSION_DENIED";
    public static final String DATA_BREACH = "DATA_BREACH";
    
    // 시스템 유지보수 알림
    public static final String SCHEDULED_MAINTENANCE = "SCHEDULED_MAINTENANCE";
    public static final String EMERGENCY_MAINTENANCE = "EMERGENCY_MAINTENANCE";
    public static final String SYSTEM_UPDATE = "SYSTEM_UPDATE";
    public static final String FEATURE_DEPRECATION = "FEATURE_DEPRECATION";
    
    // 알림 타입 그룹
    public static final Map<String, List<String>> TYPE_GROUPS;
    
    static {
        Map<String, List<String>> groups = new HashMap<>();
        groups.put("SYSTEM_ALERTS", Arrays.asList(SYSTEM, MAINTENANCE, SYSTEM_UPDATE));
        groups.put("USER_ALERTS", Arrays.asList(USER, REGISTRATION, LOGIN, PASSWORD_CHANGE, PROFILE_UPDATE));
        groups.put("CONSULTATION_ALERTS", Arrays.asList(CONSULTATION, CONSULTATION_REQUEST, CONSULTATION_CONFIRMED));
        groups.put("PAYMENT_ALERTS", Arrays.asList(PAYMENT, PAYMENT_SUCCESS, PAYMENT_FAILED, PAYMENT_REFUND));
        groups.put("SECURITY_ALERTS", Arrays.asList(SECURITY, SUSPICIOUS_LOGIN, ACCOUNT_LOCKED, PERMISSION_DENIED));
        TYPE_GROUPS = Collections.unmodifiableMap(groups);
    }
    
    // 알림 타입 설명
    public static final Map<String, String> TYPE_DESCRIPTIONS;
    
    static {
        Map<String, String> descriptions = new HashMap<>();
        descriptions.put(SYSTEM, "시스템 알림");
        descriptions.put(USER, "사용자 관련 알림");
        descriptions.put(CONSULTATION, "상담 관련 알림");
        descriptions.put(PAYMENT, "결제 관련 알림");
        descriptions.put(SECURITY, "보안 관련 알림");
        descriptions.put(MAINTENANCE, "시스템 유지보수 알림");
        descriptions.put(REGISTRATION, "회원가입 알림");
        descriptions.put(LOGIN, "로그인 알림");
        descriptions.put(PASSWORD_CHANGE, "비밀번호 변경 알림");
        descriptions.put(PROFILE_UPDATE, "프로필 업데이트 알림");
        descriptions.put(ACCOUNT_VERIFICATION, "계정 인증 알림");
        descriptions.put(CONSULTATION_REQUEST, "상담 요청 알림");
        descriptions.put(CONSULTATION_CONFIRMED, "상담 확정 알림");
        descriptions.put(CONSULTATION_CANCELLED, "상담 취소 알림");
        descriptions.put(CONSULTATION_REMINDER, "상담 리마인더");
        descriptions.put(CONSULTATION_COMPLETED, "상담 완료 알림");
        descriptions.put(PAYMENT_SUCCESS, "결제 성공 알림");
        descriptions.put(PAYMENT_FAILED, "결제 실패 알림");
        descriptions.put(PAYMENT_REFUND, "환불 알림");
        descriptions.put(SUBSCRIPTION_RENEWAL, "구독 갱신 알림");
        descriptions.put(SUBSCRIPTION_EXPIRY, "구독 만료 알림");
        descriptions.put(SUSPICIOUS_LOGIN, "의심스러운 로그인 알림");
        descriptions.put(ACCOUNT_LOCKED, "계정 잠금 알림");
        descriptions.put(PERMISSION_DENIED, "권한 거부 알림");
        descriptions.put(DATA_BREACH, "데이터 유출 알림");
        descriptions.put(SCHEDULED_MAINTENANCE, "예정된 유지보수 알림");
        descriptions.put(EMERGENCY_MAINTENANCE, "긴급 유지보수 알림");
        descriptions.put(SYSTEM_UPDATE, "시스템 업데이트 알림");
        descriptions.put(FEATURE_DEPRECATION, "기능 폐지 알림");
        TYPE_DESCRIPTIONS = Collections.unmodifiableMap(descriptions);
    }
    
    // 알림 타입별 우선순위
    public static final Map<String, Integer> TYPE_PRIORITIES;
    
    static {
        Map<String, Integer> priorities = new HashMap<>();
        priorities.put(EMERGENCY_MAINTENANCE, 1);
        priorities.put(DATA_BREACH, 1);
        priorities.put(ACCOUNT_LOCKED, 2);
        priorities.put(PAYMENT_FAILED, 2);
        priorities.put(SUSPICIOUS_LOGIN, 2);
        priorities.put(CONSULTATION_REQUEST, 3);
        priorities.put(PAYMENT_SUCCESS, 3);
        priorities.put(CONSULTATION_CONFIRMED, 3);
        priorities.put(SYSTEM_UPDATE, 4);
        priorities.put(SCHEDULED_MAINTENANCE, 4);
        priorities.put(REGISTRATION, 5);
        priorities.put(LOGIN, 5);
        priorities.put(PROFILE_UPDATE, 5);
        TYPE_PRIORITIES = Collections.unmodifiableMap(priorities);
    }
    
    // 알림 타입별 아이콘
    public static final Map<String, String> TYPE_ICONS;
    
    static {
        Map<String, String> icons = new HashMap<>();
        icons.put(SYSTEM, "bi-gear");
        icons.put(USER, "bi-person");
        icons.put(CONSULTATION, "bi-chat");
        icons.put(PAYMENT, "bi-credit-card");
        icons.put(SECURITY, "bi-shield");
        icons.put(MAINTENANCE, "bi-tools");
        icons.put(REGISTRATION, "bi-person-plus");
        icons.put(LOGIN, "bi-box-arrow-in-right");
        icons.put(PASSWORD_CHANGE, "bi-key");
        icons.put(PROFILE_UPDATE, "bi-person-gear");
        icons.put(ACCOUNT_VERIFICATION, "bi-check-circle");
        icons.put(CONSULTATION_REQUEST, "bi-chat-dots");
        icons.put(CONSULTATION_CONFIRMED, "bi-check-circle");
        icons.put(CONSULTATION_CANCELLED, "bi-x-circle");
        icons.put(CONSULTATION_REMINDER, "bi-clock");
        icons.put(CONSULTATION_COMPLETED, "bi-check-circle-fill");
        icons.put(PAYMENT_SUCCESS, "bi-check-circle-fill");
        icons.put(PAYMENT_FAILED, "bi-x-circle-fill");
        icons.put(PAYMENT_REFUND, "bi-arrow-return-left");
        icons.put(SUBSCRIPTION_RENEWAL, "bi-arrow-clockwise");
        icons.put(SUBSCRIPTION_EXPIRY, "bi-exclamation-triangle");
        icons.put(SUSPICIOUS_LOGIN, "bi-exclamation-triangle-fill");
        icons.put(ACCOUNT_LOCKED, "bi-lock-fill");
        icons.put(PERMISSION_DENIED, "bi-slash-circle");
        icons.put(DATA_BREACH, "bi-exclamation-triangle-fill");
        icons.put(SCHEDULED_MAINTENANCE, "bi-calendar-event");
        icons.put(EMERGENCY_MAINTENANCE, "bi-exclamation-triangle-fill");
        icons.put(SYSTEM_UPDATE, "bi-arrow-up-circle");
        icons.put(FEATURE_DEPRECATION, "bi-exclamation-diamond");
        TYPE_ICONS = Collections.unmodifiableMap(icons);
    }
    
    // 알림 타입별 색상
    public static final Map<String, String> TYPE_COLORS;
    
    static {
        Map<String, String> colors = new HashMap<>();
        colors.put(EMERGENCY_MAINTENANCE, "danger");
        colors.put(DATA_BREACH, "danger");
        colors.put(ACCOUNT_LOCKED, "warning");
        colors.put(PAYMENT_FAILED, "warning");
        colors.put(SUSPICIOUS_LOGIN, "warning");
        colors.put(CONSULTATION_REQUEST, "info");
        colors.put(PAYMENT_SUCCESS, "success");
        colors.put(CONSULTATION_CONFIRMED, "success");
        colors.put(SYSTEM_UPDATE, "primary");
        colors.put(SCHEDULED_MAINTENANCE, "primary");
        colors.put(REGISTRATION, "secondary");
        colors.put(LOGIN, "secondary");
        colors.put(PROFILE_UPDATE, "secondary");
        TYPE_COLORS = Collections.unmodifiableMap(colors);
    }
    
    // 유틸리티 메서드
    public static boolean isValidType(String type) {
        return TYPE_DESCRIPTIONS.containsKey(type);
    }
    
    public static List<String> getAllTypes() {
        return List.copyOf(TYPE_DESCRIPTIONS.keySet());
    }
    
    public static List<String> getTypesByGroup(String group) {
        return TYPE_GROUPS.getOrDefault(group, List.of());
    }
    
    public static String getDescription(String type) {
        return TYPE_DESCRIPTIONS.getOrDefault(type, "알 수 없는 알림 타입");
    }
    
    public static int getPriority(String type) {
        return TYPE_PRIORITIES.getOrDefault(type, 5);
    }
    
    public static String getIcon(String type) {
        return TYPE_ICONS.getOrDefault(type, "bi-bell");
    }
    
    public static String getColor(String type) {
        return TYPE_COLORS.getOrDefault(type, "secondary");
    }
    
    public static List<String> getHighPriorityTypes() {
        return TYPE_PRIORITIES.entrySet().stream()
            .filter(entry -> entry.getValue() <= 2)
            .map(Map.Entry::getKey)
            .toList();
    }
    
    public static List<String> getLowPriorityTypes() {
        return TYPE_PRIORITIES.entrySet().stream()
            .filter(entry -> entry.getValue() >= 4)
            .map(Map.Entry::getKey)
            .toList();
    }
    
    // 생성자 방지
    private AlertType() {
        throw new UnsupportedOperationException("이 클래스는 인스턴스화할 수 없습니다.");
    }
}
