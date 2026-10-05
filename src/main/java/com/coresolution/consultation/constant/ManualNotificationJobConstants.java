package com.coresolution.consultation.constant;

import java.time.LocalDateTime;
import java.util.regex.Pattern;
import com.coresolution.consultation.util.ReservationSmsBusinessHours;

/**
 * 어드민 수동 다중 발송 비동기 작업 공용 상수·오류 코드.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
public final class ManualNotificationJobConstants {

    /** 확정 대상이 상한을 넘음(422). */
    public static final String ERROR_RECIPIENTS_LIMIT_EXCEEDED = "RECIPIENTS_LIMIT_EXCEEDED";
    /** 확정 대상이 0명(422). */
    public static final String ERROR_RECIPIENTS_REQUIRED = "RECIPIENTS_REQUIRED";
    /** 확인 단계 이후 대상 집합이 바뀜(409). 다시 미리보기 후 발송해야 한다. */
    public static final String ERROR_RECIPIENT_SET_CHANGED = "RECIPIENT_SET_CHANGED";
    /** 요청 형식 오류(400). */
    public static final String ERROR_INVALID_REQUEST = "INVALID_REQUEST";
    /** 알림톡 공통코드 템플릿 매핑 없음(422). */
    public static final String ERROR_TEMPLATE_NOT_MAPPED = "TEMPLATE_NOT_MAPPED";
    /** 작업 없음·다른 테넌트 작업(404). */
    public static final String ERROR_JOB_NOT_FOUND = "JOB_NOT_FOUND";
    /** 발송 워커 대기열이 가득 참 — 작업은 PENDING 으로 남고 복구 스케줄러가 이어서 실행한다. */
    public static final String ERROR_EXECUTOR_BUSY = "EXECUTOR_BUSY";
    /** 작업 생성 빈도 한도 초과(분·일). */
    public static final String ERROR_RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED";
    /** 푸시 채널에 전화번호 직접 입력. */
    public static final String ERROR_PHONE_NOT_SUPPORTED_FOR_PUSH = "PHONE_NOT_SUPPORTED_FOR_PUSH";
    /** 제외 목록 상한 초과. */
    public static final String ERROR_EXCLUSIONS_LIMIT_EXCEEDED = "EXCLUSIONS_LIMIT_EXCEEDED";

    /** 대상 제외 사유 — 현재 테넌트에 없음(다른 테넌트·삭제). */
    public static final String INELIGIBLE_NOT_FOUND = "NOT_FOUND";
    /** 대상 제외 사유 — 비활성 사용자. */
    public static final String INELIGIBLE_INACTIVE = "INACTIVE";
    /** 대상 제외 사유 — 휴대전화 없음·형식 오류. */
    public static final String INELIGIBLE_NO_PHONE = "NO_PHONE";
    /** 대상 제외 사유 — 광고성 메시지인데 수신 동의 없음. */
    public static final String INELIGIBLE_NO_MARKETING_CONSENT = "NO_MARKETING_CONSENT";
    /** 대상 제외 사유 — 같은 휴대전화가 이미 대상에 있음. */
    public static final String INELIGIBLE_DUPLICATE_PHONE = "DUPLICATE_PHONE";

    /** 프로바이더 호출 중 서버가 멈춰 결과를 모름 — 중복 발송을 막기 위해 재발송하지 않는다. */
    public static final String RESULT_DISPATCH_OUTCOME_UNKNOWN = "DISPATCH_OUTCOME_UNKNOWN";
    /** DRY_RUN 모드 결과 코드(프로바이더 미호출). */
    public static final String RESULT_DRY_RUN = "DRY_RUN";
    /** 프로바이더 성공 결과 코드. */
    public static final String RESULT_OK = "OK";
    /** 작업 실행 중 예기치 못한 오류. */
    public static final String RESULT_INTERNAL_ERROR = "INTERNAL_ERROR";
    /** 같은 작업·수신자 발송 기록이 이미 있음(유니크 제약) — 프로바이더를 부르지 않는다. */
    public static final String RESULT_DUPLICATE_DISPATCH_BLOCKED = "DUPLICATE_DISPATCH_BLOCKED";
    /** 발송 시점에 대상 조건(활성·번호·동의)을 잃음 — 프로바이더를 부르지 않는다. */
    public static final String RESULT_RECIPIENT_NO_LONGER_ELIGIBLE = "RECIPIENT_NO_LONGER_ELIGIBLE";
    /** 프로바이더 응답에 해당 수신자 결과가 없음. */
    public static final String RESULT_PROVIDER_RESULT_MISSING = "PROVIDER_RESULT_MISSING";

    /** 수신자 키 접두사 — 등록 사용자. */
    public static final String RECIPIENT_KEY_USER_PREFIX = "U:";
    /** 수신자 키 접두사 — 직접 입력 번호(요청 내 순번, 번호 파생값을 쓰지 않는다). */
    public static final String RECIPIENT_KEY_PHONE_PREFIX = "P:";
    /** 발송 키 구분자 — {@code <jobUuid>:<recipientKey>}. */
    public static final String DISPATCH_KEY_SEPARATOR = ":";

    /** 화면 표시용 빈 마스킹 값. */
    public static final String MASK_NOT_AVAILABLE = "n/a";
    /** 푸시 수신자 표시값(전화번호 없음). */
    public static final String PUSH_PHONE_PLACEHOLDER = "[push]";

    /** 오류 메시지 저장 최대 길이(컬럼 길이와 동일). */
    public static final int ERROR_MESSAGE_MAX_LENGTH = 500;
    /** 프로바이더 오류 메시지 안 휴대전화 번호(저장·로그 전 가림). */
    public static final Pattern PHONE_IN_TEXT_PATTERN = Pattern.compile("(\\+?82[- ]?|0)1[016789][- ]?\\d{3,4}[- ]?\\d{4}");
    /** 번호 가림 문자열. */
    public static final String PHONE_REDACTION = "[phone]";
    /** 마케팅 동의 일괄 조회 IN 절 크기. */
    public static final int CONSENT_LOOKUP_BATCH_SIZE = 1000;
    /** 밀리초 단위 1초. */
    public static final long MILLIS_PER_SECOND = 1000L;

    private ManualNotificationJobConstants() {
    }

    /**
     * 작업 기록 시각(KST). 인스턴스 간 점유 만료 비교도 같은 기준을 쓴다.
     *
     * @return 현재 KST 시각
     */
    public static LocalDateTime nowKst() {
        return LocalDateTime.now(ReservationSmsBusinessHours.ZONE_SEOUL);
    }
}
