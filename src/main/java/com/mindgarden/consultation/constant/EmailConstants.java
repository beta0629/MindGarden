package com.mindgarden.consultation.constant;

/**
 * 이메일 관련 상수 클래스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
public final class EmailConstants {
    
    // === 이메일 템플릿 타입 ===
    public static final String TEMPLATE_WELCOME = "WELCOME";
    public static final String TEMPLATE_CONSULTANT_APPROVAL = "CONSULTANT_APPROVAL";
    public static final String TEMPLATE_CONSULTANT_REJECTION = "CONSULTANT_REJECTION";
    public static final String TEMPLATE_ADMIN_APPROVAL = "ADMIN_APPROVAL";
    public static final String TEMPLATE_PASSWORD_RESET = "PASSWORD_RESET";
    public static final String TEMPLATE_ACCOUNT_ACTIVATION = "ACCOUNT_ACTIVATION";
    public static final String TEMPLATE_APPOINTMENT_CONFIRMATION = "APPOINTMENT_CONFIRMATION";
    public static final String TEMPLATE_APPOINTMENT_REMINDER = "APPOINTMENT_REMINDER";
    public static final String TEMPLATE_PAYMENT_CONFIRMATION = "PAYMENT_CONFIRMATION";
    public static final String TEMPLATE_PAYMENT_FAILED = "PAYMENT_FAILED";
    public static final String TEMPLATE_SYSTEM_NOTIFICATION = "SYSTEM_NOTIFICATION";
    
    // === 이메일 제목 ===
    public static final String SUBJECT_WELCOME = "[마음정원] 회원가입을 환영합니다";
    public static final String SUBJECT_CONSULTANT_APPROVAL = "[마음정원] 상담사 승인 완료";
    public static final String SUBJECT_CONSULTANT_REJECTION = "[마음정원] 상담사 신청 결과 안내";
    public static final String SUBJECT_ADMIN_APPROVAL = "[마음정원] 관리자 승인 완료";
    public static final String SUBJECT_PASSWORD_RESET = "[마음정원] 비밀번호 재설정";
    public static final String SUBJECT_ACCOUNT_ACTIVATION = "[마음정원] 계정 활성화";
    public static final String SUBJECT_APPOINTMENT_CONFIRMATION = "[마음정원] 상담 예약 확인";
    public static final String SUBJECT_APPOINTMENT_REMINDER = "[마음정원] 상담 예약 알림";
    public static final String SUBJECT_PAYMENT_CONFIRMATION = "[마음정원] 결제 완료 안내";
    public static final String SUBJECT_PAYMENT_FAILED = "[마음정원] 결제 실패 안내";
    public static final String SUBJECT_SYSTEM_NOTIFICATION = "[마음정원] 시스템 알림";
    
    // === 이메일 설정 ===
    public static final String FROM_EMAIL = "noreply@mindgarden.com";
    public static final String FROM_NAME = "마음정원";
    public static final String REPLY_TO_EMAIL = "support@mindgarden.com";
    public static final String SUPPORT_EMAIL = "support@mindgarden.com";
    
    // === 이메일 템플릿 경로 ===
    public static final String TEMPLATE_PATH_WELCOME = "email/welcome.html";
    public static final String TEMPLATE_PATH_CONSULTANT_APPROVAL = "email/consultant-approval.html";
    public static final String TEMPLATE_PATH_CONSULTANT_REJECTION = "email/consultant-rejection.html";
    public static final String TEMPLATE_PATH_ADMIN_APPROVAL = "email/admin-approval.html";
    public static final String TEMPLATE_PATH_PASSWORD_RESET = "email/password-reset.html";
    public static final String TEMPLATE_PATH_ACCOUNT_ACTIVATION = "email/account-activation.html";
    public static final String TEMPLATE_PATH_APPOINTMENT_CONFIRMATION = "email/appointment-confirmation.html";
    public static final String TEMPLATE_PATH_APPOINTMENT_REMINDER = "email/appointment-reminder.html";
    public static final String TEMPLATE_PATH_PAYMENT_CONFIRMATION = "email/payment-confirmation.html";
    public static final String TEMPLATE_PATH_PAYMENT_FAILED = "email/payment-failed.html";
    public static final String TEMPLATE_PATH_SYSTEM_NOTIFICATION = "email/system-notification.html";
    
    // === 이메일 발송 상태 ===
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_SENT = "SENT";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_DELIVERED = "DELIVERED";
    public static final String STATUS_BOUNCED = "BOUNCED";
    
    // === 이메일 우선순위 ===
    public static final String PRIORITY_HIGH = "HIGH";
    public static final String PRIORITY_NORMAL = "NORMAL";
    public static final String PRIORITY_LOW = "LOW";
    
    // === 이메일 타입 ===
    public static final String TYPE_HTML = "HTML";
    public static final String TYPE_TEXT = "TEXT";
    
    // === 성공 메시지 ===
    public static final String SUCCESS_EMAIL_SENT = "이메일이 성공적으로 발송되었습니다.";
    public static final String SUCCESS_EMAIL_QUEUED = "이메일이 발송 대기열에 추가되었습니다.";
    public static final String SUCCESS_EMAIL_TEMPLATE_LOADED = "이메일 템플릿이 성공적으로 로드되었습니다.";
    
    // === 에러 메시지 ===
    public static final String ERROR_EMAIL_SEND_FAILED = "이메일 발송에 실패했습니다.";
    public static final String ERROR_EMAIL_TEMPLATE_NOT_FOUND = "이메일 템플릿을 찾을 수 없습니다.";
    public static final String ERROR_EMAIL_INVALID_RECIPIENT = "유효하지 않은 수신자 이메일입니다.";
    public static final String ERROR_EMAIL_INVALID_TEMPLATE = "유효하지 않은 이메일 템플릿입니다.";
    public static final String ERROR_EMAIL_SERVICE_UNAVAILABLE = "이메일 서비스를 사용할 수 없습니다.";
    public static final String ERROR_EMAIL_ATTACHMENT_TOO_LARGE = "첨부파일이 너무 큽니다.";
    public static final String ERROR_EMAIL_RATE_LIMIT_EXCEEDED = "이메일 발송 한도를 초과했습니다.";
    
    // === 이메일 발송 제한 ===
    public static final int MAX_RECIPIENTS_PER_EMAIL = 50;
    public static final int MAX_ATTACHMENT_SIZE_MB = 10;
    public static final int DAILY_EMAIL_LIMIT = 1000;
    public static final int HOURLY_EMAIL_LIMIT = 100;
    
    // === 이메일 재시도 설정 ===
    public static final int MAX_RETRY_ATTEMPTS = 3;
    public static final int RETRY_DELAY_SECONDS = 60;
    public static final int RETRY_BACKOFF_MULTIPLIER = 2;
    
    // === 이메일 템플릿 변수 ===
    public static final String VAR_USER_NAME = "{{userName}}";
    public static final String VAR_USER_EMAIL = "{{userEmail}}";
    public static final String VAR_ACTIVATION_LINK = "{{activationLink}}";
    public static final String VAR_RESET_LINK = "{{resetLink}}";
    public static final String VAR_APPOINTMENT_DATE = "{{appointmentDate}}";
    public static final String VAR_APPOINTMENT_TIME = "{{appointmentTime}}";
    public static final String VAR_CONSULTANT_NAME = "{{consultantName}}";
    public static final String VAR_PAYMENT_AMOUNT = "{{paymentAmount}}";
    public static final String VAR_PAYMENT_METHOD = "{{paymentMethod}}";
    public static final String VAR_COMPANY_NAME = "{{companyName}}";
    public static final String VAR_SUPPORT_EMAIL = "{{supportEmail}}";
    public static final String VAR_CURRENT_YEAR = "{{currentYear}}";
    
    private EmailConstants() {
        // 유틸리티 클래스이므로 인스턴스 생성 방지
        throw new UnsupportedOperationException("유틸리티 클래스입니다.");
    }
}
