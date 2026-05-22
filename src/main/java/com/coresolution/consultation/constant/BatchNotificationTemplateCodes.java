package com.coresolution.consultation.constant;

/**
 * 알림 배치/이벤트 발송 트랙 A·B·C 8종 템플릿 코드 상수.
 *
 * <p>본 클래스의 값은 {@code ALIMTALK_BIZ_TEMPLATE_CODE} 공통코드 그룹의
 * {@code codeValue} 와 1:1 대응한다. 솔라피 콘솔 검수 통과 후
 * 실 {@code templateId(KA01TP…)} 가 발급되면 별도 Flyway 시드 PR 에서
 * 매핑 row 가 추가된다. 매핑이 없으면 호출자
 * ({@code BatchNotificationDispatchService}) 가 SMS 폴백으로 전환한다.
 *
 * <p>기획: docs/project-management/2026-05-23/NOTIFICATION_BATCH_MESSAGE_DESIGN.md (§11/§12 — 신규 3종)
 *
 * <p>본 상수는 비즈니스 도메인 식별자(템플릿 이름)이며, 정책·설정값이 아니다 —
 * 따라서 공통코드 동적 조회 대상에서 제외하고 컴파일 타임 상수로 유지한다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
public final class BatchNotificationTemplateCodes {

    /** 예약 2일 전 안내 (1회기 이상 잔여 client). 배치(D-2 09:00 KST). */
    public static final String RESERVATION_REMINDER_D2 = "RESERVATION_REMINDER_D2";

    /** 단회기(단발성 결제) 예약 즉시 안내. 스케줄 등록 이벤트. */
    public static final String RESERVATION_IMMEDIATE_SINGLE = "RESERVATION_IMMEDIATE_SINGLE";

    /** D-2 미만 예약 즉시 안내 (등록 시점 D-2 미만). 스케줄 등록 이벤트. */
    public static final String RESERVATION_IMMEDIATE_LATE = "RESERVATION_IMMEDIATE_LATE";

    /** 회기 종료 안내 (잔여 1회기 진입). 회기 차감 이벤트. */
    public static final String SESSION_ENDING_SOON = "SESSION_ENDING_SOON";

    /** 회기수 유도 (마지막 회기 종료 직후, 마케팅 동의 필요). 회기 차감 이벤트. */
    public static final String SESSION_RENEW_PROMPT = "SESSION_RENEW_PROMPT";

    /** 신규 매칭 환영 안내 (user 영구 1회). 매칭 생성 이벤트. */
    public static final String CLIENT_WELCOME_FIRST = "CLIENT_WELCOME_FIRST";

    /** 첫 상담 안내 — 오프라인 (user 영구 1회, ONLINE 과 멱등 공유). 스케줄 등록 이벤트. */
    public static final String INITIAL_GUIDE_OFFLINE = "INITIAL_GUIDE_OFFLINE";

    /** 첫 상담 안내 — 온라인 (user 영구 1회, OFFLINE 과 멱등 공유). 스케줄 등록 이벤트. */
    public static final String INITIAL_GUIDE_ONLINE = "INITIAL_GUIDE_ONLINE";

    /**
     * INITIAL_GUIDE 멱등 검사 시 비교 대상 코드 묶음 — OFFLINE/ONLINE 어느 한쪽이라도
     * 동일 user 에 대해 이미 발송 성공했으면 신규 발송을 차단한다(설계 §11/§12).
     */
    public static final java.util.List<String> INITIAL_GUIDE_CODES =
        java.util.List.of(INITIAL_GUIDE_OFFLINE, INITIAL_GUIDE_ONLINE);

    /**
     * 마케팅성 템플릿 식별 — SMS 폴백 정책 F2 가드에 사용된다.
     * 마케팅 메시지(현재 {@link #SESSION_RENEW_PROMPT} 1종)는 알림톡 실패 시에도
     * SMS 폴백을 수행하지 않는다(수신동의/수신거부 구문 운영 복잡도 회피).
     *
     * @param templateCode 5종 템플릿 코드 중 하나
     * @return 마케팅성이면 {@code true}
     */
    public static boolean isMarketingTemplate(String templateCode) {
        return SESSION_RENEW_PROMPT.equals(templateCode);
    }

    /** 멱등성 로그 target_type — schedules.id. */
    public static final String TARGET_TYPE_SCHEDULE = "SCHEDULE";

    /** 멱등성 로그 target_type — consultant_client_mappings.id. */
    public static final String TARGET_TYPE_MAPPING = "MAPPING";

    /** 멱등성 로그 target_type — users.id (WELCOME/INITIAL_GUIDE 영구 1회 보장). */
    public static final String TARGET_TYPE_USER = "USER";

    /** 멱등성 로그 error_code — INITIAL_GUIDE 발송 조건 미충족(첫 상담 아님). */
    public static final String ERROR_CODE_NOT_FIRST_SCHEDULE = "NOT_FIRST_SCHEDULE";

    /** 멱등성 로그 channel_used — 알림톡. */
    public static final String CHANNEL_ALIMTALK = "ALIMTALK";

    /** 멱등성 로그 channel_used — SMS 폴백. */
    public static final String CHANNEL_SMS = "SMS";

    /** 멱등성 로그 error_code — 알림톡 매핑이 없어 SMS 폴백만 시도. */
    public static final String ERROR_CODE_TEMPLATE_NOT_MAPPED = "TEMPLATE_NOT_MAPPED";

    /** 멱등성 로그 error_code — SMS 폴백까지 모두 실패. */
    public static final String ERROR_CODE_SEND_FAILED = "SEND_FAILED";

    /** 멱등성 로그 error_code — 수신자 전화번호 없음 (검증 실패). */
    public static final String ERROR_CODE_RECIPIENT_PHONE_MISSING = "RECIPIENT_PHONE_MISSING";

    /** 멱등성 로그 error_code — 마케팅 동의 미획득 (SESSION_RENEW_PROMPT 한정). */
    public static final String ERROR_CODE_MARKETING_CONSENT_REQUIRED = "MARKETING_CONSENT_REQUIRED";

    /** 멱등성 로그 error_code — 마지막 회기 종료가 첫 실행 cutoff 이전. */
    public static final String ERROR_CODE_DEPLOY_CUTOFF_BEFORE = "DEPLOY_CUTOFF_BEFORE";

    /** 멱등성 로그 error_code — 발송 대상 엔티티 부재. */
    public static final String ERROR_CODE_TARGET_NOT_FOUND = "TARGET_NOT_FOUND";

    /**
     * 멱등성 로그 error_code — 마케팅 템플릿 알림톡 실패 + F2 정책에 의해 SMS 폴백 미수행.
     * {@code error_message} 에는 직전 알림톡 실패 사유가 함께 보존된다.
     */
    public static final String ERROR_CODE_MARKETING_NO_FALLBACK = "MARKETING_NO_FALLBACK";

    /** 알림톡 본문 변수 — 내담자명. */
    public static final String VAR_CLIENT_NAME = "clientName";

    /** 알림톡 본문 변수 — 상담사명. */
    public static final String VAR_CONSULTANT_NAME = "consultantName";

    /** 알림톡 본문 변수 — 예약일 (YYYY-MM-DD 또는 YYYY년 M월 D일 포맷). */
    public static final String VAR_SCHEDULE_DATE = "scheduleDate";

    /** 알림톡 본문 변수 — 예약 시각 (HH:mm). */
    public static final String VAR_SCHEDULE_TIME = "scheduleTime";

    /** 알림톡 본문 변수 — 잔여 회기 수. */
    public static final String VAR_REMAINING_SESSIONS = "remainingSessions";

    /** 알림톡 본문 변수 — 마지막 상담일 (SESSION_RENEW_PROMPT 한정). */
    public static final String VAR_LAST_SESSION_DATE = "lastSessionDate";

    /** 알림톡 본문 변수 — 고객센터/대표 번호 (CLIENT_WELCOME_FIRST 한정). */
    public static final String VAR_CONTACT_PHONE = "contactPhone";

    /** 알림톡 본문 변수 — 지점 주소 (INITIAL_GUIDE_OFFLINE 한정). */
    public static final String VAR_BRANCH_ADDRESS = "branchAddress";

    /** 알림톡 본문 변수 — 화상 상담 링크 (INITIAL_GUIDE_ONLINE 한정). */
    public static final String VAR_ONLINE_LINK = "onlineLink";

    /** 변수 누락 시 fallback 상담사명. */
    public static final String FALLBACK_CONSULTANT_NAME = "담당 상담사";

    /** 변수 누락 시 fallback 내담자명. */
    public static final String FALLBACK_CLIENT_NAME = "고객";

    /** 변수 누락 시 fallback 고객센터/대표 번호. {@link com.coresolution.consultation.config.BatchNotificationProperties#getContactPhone()} 이 빈 값일 때 사용. */
    public static final String FALLBACK_CONTACT_PHONE = "고객센터";

    /** 변수 누락 시 fallback 지점 주소. */
    public static final String FALLBACK_BRANCH_ADDRESS = "지점 안내는 별도로 연락드리겠습니다";

    private BatchNotificationTemplateCodes() {
    }
}
