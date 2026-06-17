package com.coresolution.consultation.constant.admin;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * {@code AdminService}에서 사용자에게 노출될 수 있는 메시지·표시명 문자열.
 *
 * @author CoreSolution
 * @since 2026-04-21
 */
public final class AdminServiceUserFacingMessages {

    public static final String MSG_EMAIL_REQUIRED = "이메일은 필수입니다.";

    /** 관리자 전문가 등록 시 role 값이 상담사·놀이·언어 외인 경우 (레거시 API) */
    public static final String MSG_INVALID_PROFESSIONAL_REGISTRATION_ROLE =
            "등록 가능한 역할은 상담사(CONSULTANT), 놀이치료(PLAY_THERAPIST), 언어치료(SPEECH_THERAPIST)만 허용됩니다.";

    /** professionalTypeCode 가 테넌트 PROFESSIONAL_PROVIDER_TYPE 에 없거나 비활성인 경우 */
    public static final String MSG_INVALID_PROFESSIONAL_PROVIDER_TYPE_CODE =
            "유효한 전문가 유형(professionalTypeCode)이 아닙니다. 테넌트 공통코드 PROFESSIONAL_PROVIDER_TYPE의 활성 행만 선택할 수 있습니다.";

    /** 상담 겸직 플래그를 ADMIN이 아닌 사용자에 설정하려 한 경우 */
    public static final String MSG_COUNSELING_ENABLED_ADMIN_ONLY =
            "상담 겸직 설정은 관리자(ADMIN) 계정에만 적용할 수 있습니다.";

    public static final String MSG_TENANT_INFO_MISSING = "테넌트 정보가 없습니다. 관리자에게 문의하세요.";

    /** 이메일 로컬 파트가 비었을 때 상담사 등록 시 사용하는 기본 표시명. */
    public static final String DEFAULT_CONSULTANT_DISPLAY_NAME = "상담사";

    public static final String MSG_TENANT_REQUIRED_CONSULTATION_INCOME_FMT =
            "테넌트는 필수입니다. tenantId 없이 상담료 수입 거래를 생성할 수 없습니다. MappingID=%d";

    public static final String MSG_TENANT_REQUIRED_MAPPING_ID_FMT =
            "테넌트는 필수입니다. MappingID=%d";

    public static final String MSG_TENANT_REQUIRED_ERP_MAPPING_SYNC_FMT =
            "테넌트는 필수입니다. ERP 매핑 정보 동기화를 수행할 수 없습니다. MappingID=%d";

    public static final String MSG_REQUEST_BODY_MISSING = "요청 본문이 없습니다.";

    public static final String MSG_USER_NOT_CONSULTANT = "해당 사용자는 상담사가 아닙니다.";

    public static final String MSG_USER_NOT_CLIENT = "해당 사용자는 내담자가 아닙니다.";

    public static final String MSG_REQUESTER_NOT_FOUND_FMT = "요청자를 찾을 수 없습니다: %d";

    public static final String MSG_SESSION_STATS_QUERY_FAILED = "회기관리 통계 조회에 실패했습니다.";

    public static final String MSG_SESSION_LIST_QUERY_FAILED = "회기관리 목록 조회에 실패했습니다.";

    public static final String MSG_INTEGRATED_CLIENT_DATA_QUERY_FAILED_FMT =
            "통합 내담자 데이터 조회에 실패했습니다: %s";

    public static final String MSG_ERP_REFUND_SEND_FAILED_FMT = "ERP 환불 데이터 전송 실패: %s";

    public static final String MSG_SCHEDULE_STATS_QUERY_FAILED_FMT =
            "스케줄 통계 조회 중 오류가 발생했습니다: %s";

    public static final String MSG_USER_ROLE_CHANGE_FAILED_FMT = "사용자 역할 변경에 실패했습니다: %s";

    public static final String MSG_CANNOT_DELETE_NON_CONSULTANT = "상담사가 아닌 사용자는 삭제할 수 없습니다.";

    public static final String MSG_CONSULTANT_ACTIVE_MAPPINGS_TRANSFER_FMT =
            "상담사에게 %d 개의 활성 매칭이 있습니다. 먼저 다른 상담사로 이전 처리해주세요.";

    public static final String MSG_CONSULTANT_FUTURE_SCHEDULES_TRANSFER_FMT =
            "상담사에게 %d 개의 예정된 스케줄이 있습니다. 먼저 다른 상담사로 이전 처리해주세요.";

    // --- 어드민 삭제 가드 (AdminDeleteBlockedException) 사유 코드 ---
    // 운영 대시보드·프론트엔드가 본 코드로 분기·국제화를 결정한다. 코드 추가 시 본 목록에도 등록할 것.

    /** 내담자: 결제 대기(PENDING_PAYMENT) 매칭이 존재해 삭제 차단. */
    public static final String DELETE_BLOCKED_CODE_PENDING_PAYMENT_MAPPING = "PENDING_PAYMENT_MAPPING";

    /** 내담자: 잔여 회기(remainingSessions > 0) 가 있어 삭제 차단. */
    public static final String DELETE_BLOCKED_CODE_REMAINING_SESSIONS = "REMAINING_SESSIONS";

    /** 내담자: 예정 스케줄(BOOKED/CONFIRMED) 이 존재해 삭제 차단. */
    public static final String DELETE_BLOCKED_CODE_FUTURE_SCHEDULES = "FUTURE_SCHEDULES";

    /** 상담사: 활성 매칭이 존재해 이관 없이 삭제 차단. */
    public static final String DELETE_BLOCKED_CODE_CONSULTANT_ACTIVE_MAPPINGS = "CONSULTANT_ACTIVE_MAPPINGS";

    /** 상담사: 예정 스케줄이 존재해 이관 없이 삭제 차단. */
    public static final String DELETE_BLOCKED_CODE_CONSULTANT_FUTURE_SCHEDULES = "CONSULTANT_FUTURE_SCHEDULES";

    public static final String MSG_DELETE_TARGET_NOT_CONSULTANT = "삭제 대상이 상담사가 아닙니다.";

    public static final String MSG_TRANSFER_TARGET_NOT_CONSULTANT = "이전 대상이 상담사가 아닙니다.";

    public static final String MSG_TRANSFER_TARGET_CONSULTANT_INACTIVE = "이전 대상 상담사가 비활성 상태입니다.";

    public static final String MSG_NOT_CONSULTANT_USER = "상담사가 아닌 사용자입니다.";

    public static final String MSG_CANNOT_DELETE_NON_CLIENT = "내담자가 아닌 사용자는 삭제할 수 없습니다.";

    public static final String MSG_CLIENT_ACTIVE_MAPPINGS_REMAINING_SESSIONS_FMT =
            "내담자에게 %d 개의 활성 매칭에서 총 %d 회기가 남아있습니다. "
                    + "회기 소진 또는 환불 처리 후 삭제해주세요.";

    public static final String MSG_CLIENT_PENDING_PAYMENT_MAPPINGS_FMT =
            "내담자에게 %d 개의 결제 대기 중인 매칭이 있습니다. 결제 처리 완료 후 삭제해주세요.";

    public static final String MSG_CLIENT_FUTURE_SCHEDULES_FMT =
            "내담자에게 %d 개의 예정된 스케줄이 있습니다. "
                    + "회기 소진, 환불 처리, 또는 스케줄 완료 후 다시 시도해주세요.";

    public static final String MSG_NOT_CLIENT_USER = "내담자가 아닌 사용자입니다.";

    public static final String MSG_MAPPING_ALREADY_TERMINATED = "이미 종료된 매칭입니다.";

    /**
     * 옵션 B v2.0 멱등성 가드 (Q6 Carbon Copy, 2026-05-28).
     *
     * <p>{@code AdminServiceImpl.checkoutSameDayCard} 진입 시 매칭 status 가
     * {@code PENDING_PAYMENT} 가 아니거나 클라이언트 요청 ID 가 5분 이내 재사용된 경우
     * 사용자에게 노출되는 토스트/응답 메시지.</p>
     */
    public static final String MSG_MAPPING_ALREADY_PROCESSED =
            "이미 처리 중입니다. 새 매칭 카드로 확인하세요.";

    public static final String MSG_REFUND_SESSIONS_AT_LEAST_ONE = "환불 회기수는 1 이상이어야 합니다.";

    public static final String MSG_REFUND_AMOUNT_CALCULATION_IMPOSSIBLE =
            "환불 금액을 계산할 수 없습니다. 패키지 가격 정보가 없습니다.";

    public static final String MSG_TRANSFER_CONSULTANT_ACTIVE_MAPPING_ONLY =
            "활성 상태의 매칭만 상담사를 변경할 수 있습니다.";

    public static final String MSG_REFUND_SESSIONS_EXCEED_REMAINING_FMT =
            "환불 요청 회기수(%d)가 남은 회기수(%d)보다 많습니다.";

    public static final String MSG_COOLING_OFF_PERIOD_EXCEEDED_FMT =
            "청약 철회 기간이 초과되었습니다. 결제일로부터 %d일이 경과했습니다. (15일 이내만 환불 가능)";

    public static final String MSG_SYNTHETIC_EMAIL_ALLOCATION_FAILED =
            "합성 이메일을 할당하지 못했습니다. 관리자에게 문의하세요.";

    public static final String MSG_CLIENT_USER_SAVE_FAILED_NO_USER_ID =
            "내담자 사용자 저장에 실패했습니다. users.id가 없습니다.";

    public static final String MSG_CLIENT_SAVE_TENANT_ID_EMPTY = "내담자 저장 tenantId가 비어 있습니다.";

    public static final String MSG_USERS_TENANT_ID_EMPTY_CLIENT_SAVE_ABORT =
            "users.tenant_id가 비어 있어 clients 저장을 중단합니다.";

    public static final String MSG_MAPPING_NOT_FOUND_WITH_ID_FMT = "매칭을 찾을 수 없습니다: %d";

    public static final String MSG_MAPPING_NOT_FOUND = "매칭을 찾을 수 없습니다.";

    public static final String MSG_CONSULTANT_NOT_FOUND = "상담사를 찾을 수 없습니다.";

    public static final String MSG_CONSULTANT_NOT_FOUND_WITH_ID_FMT = "상담사를 찾을 수 없습니다: %d";

    public static final String MSG_CONSULTANT_TO_DELETE_NOT_FOUND = "삭제할 상담사를 찾을 수 없습니다.";

    public static final String MSG_TRANSFER_TARGET_CONSULTANT_NOT_FOUND = "이전 대상 상담사를 찾을 수 없습니다.";

    public static final String MSG_CLIENT_NOT_FOUND = "내담자를 찾을 수 없습니다.";

    public static final String MSG_EXISTING_MAPPING_NOT_FOUND = "기존 매칭을 찾을 수 없습니다.";

    public static final String MSG_NEW_CONSULTANT_NOT_FOUND = "새 상담사를 찾을 수 없습니다.";

    /** EntityNotFoundException 등에서 사용하는 엔티티 유형 표시명(상담사) */
    public static final String ENTITY_LABEL_CONSULTANT = "상담사";

    /** EntityNotFoundException 등에서 사용하는 엔티티 유형 표시명(내담자) */
    public static final String ENTITY_LABEL_CLIENT = "내담자";

    /** 스태프 등록 시 이름 미입력·이메일 로컬 파트 비어 있을 때 기본 표시명 */
    public static final String DEFAULT_STAFF_DISPLAY_NAME = "사무원";

    /** 스태프 강제 종료 — 대상 사용자 없음. */
    public static final String MSG_STAFF_NOT_FOUND = "스태프를 찾을 수 없습니다.";

    /** 스태프 강제 종료 — 대상 사용자가 STAFF/ADMIN 이 아님. */
    public static final String MSG_CANNOT_DELETE_NON_STAFF = "스태프(사무원) 또는 관리자만 삭제할 수 있습니다.";

    /** 스태프 강제 종료 — 자기 자신 삭제 차단. */
    public static final String MSG_CANNOT_DELETE_SELF = "자기 자신은 삭제할 수 없습니다.";

    /** 스태프 강제 종료 — 테넌트 내 마지막 활성 관리자(ADMIN) 삭제 차단. */
    public static final String MSG_CANNOT_DELETE_LAST_ADMIN =
            "테넌트의 마지막 활성 관리자(ADMIN)는 삭제할 수 없습니다.";

    public static final String MSG_TENANT_ID_REQUIRED_IN_CONTEXT =
            "현재 컨텍스트에 테넌트 ID가 설정되어 있지 않습니다.";

    /** GET /api/v1/admin/duplicate-check/phone — 정규화 후 휴대폰 형식 불일치(빈 값 포함) */
    public static final String MSG_DUPLICATE_CHECK_PHONE_INVALID = "올바른 휴대폰 번호를 입력해주세요.";

    /** GET /api/v1/admin/duplicate-check/phone — 테넌트 내 이미 사용 중 */
    public static final String MSG_DUPLICATE_CHECK_PHONE_IN_USE = "이미 사용 중인 휴대폰 번호입니다.";

    /** GET /api/v1/admin/duplicate-check/phone — 사용 가능 */
    public static final String MSG_DUPLICATE_CHECK_PHONE_AVAILABLE = "사용 가능한 휴대폰 번호입니다.";

    // --- 삭제 가능 여부 안내 (checkConsultantDeletionStatus / checkClientDeletionStatus) ---

    public static final String MSG_CONSULTANT_CAN_DELETE_SAFELY = "해당 상담사는 안전하게 삭제할 수 있습니다.";

    public static final String MSG_CONSULTANT_DELETE_NEED_TRANSFER_INTRO =
            "다음 사유로 인해 다른 상담사로 이전이 필요합니다:\n";

    public static final String MSG_BULLET_CONSULTANT_ACTIVE_MAPPINGS_FMT = "• 활성 매칭: %d개\n";

    public static final String MSG_BULLET_CONSULTANT_TODAY_SCHEDULE_FMT = "• 오늘 스케줄: %d개\n";

    public static final String MSG_BULLET_CONSULTANT_FUTURE_SCHEDULE_FMT = "• 향후 스케줄: %d개";

    public static final String MSG_CLIENT_CAN_DELETE_SAFELY = "해당 내담자는 안전하게 삭제할 수 있습니다.";

    public static final String MSG_CLIENT_DELETE_BLOCKED_INTRO = "다음 사유로 인해 삭제할 수 없습니다:\n";

    public static final String MSG_BULLET_CLIENT_REMAINING_SESSIONS_FMT = "• 남은 회기: %d회\n";

    public static final String MSG_BULLET_CLIENT_PENDING_PAYMENT_FMT = "• 결제 대기: %d개\n";

    public static final String MSG_BULLET_CLIENT_FUTURE_SCHEDULE_FMT = "• 예정 스케줄: %d개";

    // --- API result message / 토스트 ---

    public static final String MSG_SCHEDULE_AUTO_COMPLETE_SUCCESS_FMT =
            "스케줄 %d개가 완료 처리되었고, 상담일지 미작성 상담사 %d명에게 알림이 발송되었습니다.";

    public static final String MSG_SCHEDULE_AUTO_COMPLETE_FAILED_FMT =
            "스케줄 자동 완료 처리에 실패했습니다: %s";

    public static final String MSG_DUPLICATE_MAPPING_MERGE_SUCCESS_FMT =
            "중복 매칭 통합 완료: %d개 그룹 통합, %d개 매칭 종료";

    public static final String MSG_VACATION_STATS_QUERY_FAILED_FMT = "휴가 통계 조회에 실패했습니다: %s";

    public static final String MSG_VACATION_STATS_BY_BRANCH_FAILED_FMT =
            "지점별 휴가 통계 조회에 실패했습니다: %s";

    // --- 상담일지 독려 메시지 ---

    public static final String MSG_CONSULTATION_DIARY_REMINDER_TITLE = "상담일지 작성 안내";

    public static final String MSG_CONSULTATION_DIARY_REMINDER_BODY_FMT =
            "안녕하세요. %s에 진행된 상담의 상담일지를 아직 작성하지 않으셨습니다.\n\n"
                    + "상담일지는 상담의 질 향상과 내담자 관리에 매우 중요합니다.\n"
                    + "빠른 시일 내에 상담일지를 작성해 주시기 바랍니다.\n\n"
                    + "상담 정보:\n"
                    + "- 상담일: %s\n"
                    + "- 상담시간: %s ~ %s\n"
                    + "- 내담자: %s\n\n"
                    + "감사합니다.";

    // --- ERP·재무 거래 설명·비고 (사용자·회계 열람용) ---

    public static final String DEFAULT_PACKAGE_NAME = "기본 패키지";

    public static final String FALLBACK_PACKAGE_DISPLAY_NAME = "상담 패키지";

    public static final String PAYMENT_METHOD_UNSPECIFIED = "미지정";

    public static final String DESC_INCOME_DEPOSIT_CONFIRM_FMT =
            "상담료 입금 확인 - %s (%s) [정확한금액: %,d원]";

    public static final String DESC_TAX_SPLIT_SUFFIX_FMT =
            " [부가세 분리: 공급가 %,d원, 부가세 %,d원]";

    public static final String DESC_WITHHOLDING_SUFFIX_FMT =
            " [사업소득 원천징수 3.3%% 예정 %,d원(부가세와 별개)]";

    public static final String REMARKS_WITHHOLDING_VS_VAT_NOTE =
            "원천징수(사업소득 3.3%) 예정액. 부가세(VAT) 금액과 혼동 금지.";

    public static final String AMOUNT_CHANGE_REASON_ERP_ACCURATE_PACKAGE =
            "ERP 연동 시 정확한 패키지 가격 적용";

    public static final String DESC_ADDITIONAL_SESSION_INCOME_FMT =
            "추가 회기 상담료 입금 확인 - %s (%d회 추가, %s) [추가금액: %,d원]";

    public static final String DESC_CONSULTATION_REFUND_FMT =
            "상담료 환불 - %s (%d회기 환불, 사유: %s)";

    public static final String DESC_CONSULTATION_PARTIAL_REFUND_FMT =
            "상담료 부분 환불 - %s (%d회기 부분 환불, 사유: %s) [남은회기: %d회]";

    public static final String DEFAULT_REFUND_REASON_ADMIN_PROCESS = "관리자 처리";

    public static final String DESC_RECEIVABLES_ON_PAYMENT_CONFIRM_FMT =
            "상담료 결제 확인 (미수금) - %s (%s) [금액: %,d원]";

    /** ERP 매핑 동기화 프로시저에 전달하는 처리 구분 표시 */
    public static final String ERP_MAPPING_PROCEDURE_ACTION_DEPOSIT_CONFIRMED = "입금확인";

    public static final String NOTES_DUPLICATE_MAPPING_MERGE_TERMINATED = "중복 매칭 통합으로 종료됨";

    /** 신규 매칭 생성 시 기존 매칭 자동 종료로 매칭 notes에 append되는 문구 */
    public static final String NOTES_AUTO_TERMINATED_ON_NEW_MAPPING =
            "새로운 매칭 생성으로 인한 자동 종료 - 회기 자동 소진";

    /**
     * ACTIVE 매핑 존재 시 신규 매칭 생성 차단 메시지 (인자: 상담사명, 내담자명, 매핑 ID).
     */
    public static final String MSG_ACTIVE_MAPPING_EXISTS_USE_SESSION_EXTENSION_FMT =
            "이미 활성 매칭이 있습니다 (%s ↔ %s, 매칭 #%d). 신규 매칭 대신 회기 추가를 이용해 주세요.";

    /**
     * 강제 종료 매칭 notes 한 줄 (인자: 일시 문자열, 사유, 환불 회기, 환불 금액).
     */
    public static final String NOTES_FORCE_TERMINATION_LINE_FMT =
            "[%s 강제 종료] %s (환불: %d회기, %,d원)";

    /** 강제 종료·부분 환불 노트 등에서 사유 미입력 시 기본 표시 */
    public static final String DEFAULT_MAPPING_NOTE_REASON_ADMIN_REQUEST = "관리자 요청";

    /**
     * 부분 환불 매칭 notes 한 줄 (인자: 일시, 사유, 환불 회기, 환불 금액, 남은 회기).
     */
    public static final String NOTES_PARTIAL_REFUND_LINE_FMT =
            "[부분 환불] %s - 사유: %s, 환불 회기: %d회, 환불 금액: %,d원, 남은 회기: %d회";

    /**
     * 환불 처리로 스케줄 자동 취소 시 notes 접두 (뒤에 사유 문자열 연결).
     *
     * <p>2026-05-26 Phase 0 (Q3=3A) — 운영 정책 합의서 v2 결정에 따라 사유 코드
     * {@code REFUND_AUTO_CANCEL} 을 prefix 에 명시하여 grep/감사 추적이 용이하도록 한다.
     * 한국어 설명은 그대로 유지된다(기존 사용자 화면·운영 콘솔 검색 호환).</p>
     */
    public static final String SCHEDULE_NOTES_PREFIX_REFUND_AUTO_CANCEL =
            "[REFUND_AUTO_CANCEL 환불 처리로 인한 자동 취소] ";

    /** 회기관리 합의서 v2 Q3=3A — 환불 자동 취소 사유 코드(스케줄/매핑 audit 공통). */
    public static final String REFUND_AUTO_CANCEL_REASON_CODE = "REFUND_AUTO_CANCEL";

    /**
     * R4 (옵션 B 디러티 PENDING_PAYMENT 정리) — 관리자 취소로 TENTATIVE_PENDING_PAYMENT 가예약을
     * 자동 취소할 때 스케줄 notes 에 누적할 접두.
     *
     * <p>합의서: docs/project-management/2026-05-28/R4_PENDING_PAYMENT_CLEANUP_UI_PLAN.md.
     * REFUND_AUTO_CANCEL 과 구분되도록 별도 prefix/코드를 사용한다(환불 거래·회기 보호 트리거 없음).</p>
     */
    public static final String SCHEDULE_NOTES_PREFIX_PENDING_PAYMENT_CANCEL =
            "[PENDING_PAYMENT_CANCEL 결제 대기 매칭 취소로 인한 가예약 자동 취소] ";

    /** R4 — 결제 대기(PENDING_PAYMENT) 매칭 관리자 취소 시 audit 사유 코드. */
    public static final String PENDING_PAYMENT_CANCEL_REASON_CODE = "PENDING_PAYMENT_CANCEL";

    /**
     * R4 — 결제 대기 매칭 관리자 취소 매핑 notes 한 줄 (인자: 일시, 사유, 취소된 가예약 수).
     */
    public static final String NOTES_PENDING_PAYMENT_CANCEL_LINE_FMT =
            "[%s PENDING_PAYMENT 매칭 취소] %s (취소 가예약 %d건)";

    /**
     * Phase 0 (Q3=3A·보조=C) 4채널 의무 알림 제목 (인앱·이메일·푸시·알림톡 공통).
     */
    public static final String REFUND_AUTO_CANCEL_NOTIFICATION_TITLE = "예약 취소 안내 (환불 처리)";

    /**
     * Phase 0 4채널 의무 알림 본문 포맷.
     * <p>인자: {@code cancelCount}(취소된 일정 수). 마이페이지 URL 안내는 본문에 포함되며 채널별 데이터로도 전달된다.</p>
     */
    public static final String REFUND_AUTO_CANCEL_NOTIFICATION_BODY_FMT =
            "환불 처리로 인해 %d건의 예약이 자동 취소되었습니다. 자세한 사항은 마이페이지에서 확인하세요.";

    /**
     * 4채널 의무 알림 감사 로그 (매핑 notes append) 한 줄 포맷.
     * <p>인자: 일시 문자열, 취소 일정 수, 채널 결과 JSON 문자열
     * (예: {@code {"inapp":"OK","email":"OK","push":"OK","alimtalk":"FAIL"}}).</p>
     */
    public static final String NOTES_AUTO_CANCEL_NOTIFY_LINE_FMT =
            "[AUTO_CANCEL_NOTIFY %s] cancelCount=%d channels=%s";

    /**
     * 4채널 의무 통지에서 안내하는 마이페이지 회기관리 진입 경로.
     * <p>현재는 정적 path. 향후 호스트 + locale 합성이 필요하면 {@code application.yml}
     * 의 {@code mindgarden.notification.refund-auto-cancel.mypage-url} 로 외부화한다.</p>
     */
    public static final String AUTO_CANCEL_MYPAGE_PATH = "/mypage/sessions";

    public static final String PACKAGE_NAME_ADDITIONAL_FALLBACK = "추가 패키지";

    public static final String PACKAGE_NAME_ESTIMATED_SESSIONS_FMT = "%d회 패키지 (추정)";

    /** 환불 설명 파싱·표시 기본값 */
    public static final String REFUND_REASON_FALLBACK_ETC = "기타";

    /** {@code extractRefundReasonFromDescription} 등에서 사용하는 접두사 (기존 설명 형식과 동일해야 함) */
    public static final String REFUND_DESCRIPTION_REASON_LABEL_PREFIX = "사유: ";

    /** 전문분야 코드가 비었을 때 API 표시명 */
    public static final String DISPLAY_SPECIALTY_NOT_SET = "미설정";

    /** 복호화 실패 시 API에 노출되는 전화번호 등 표시 */
    public static final String DISPLAY_DECRYPTION_FAILED = "복호화 실패";

    /** 이름 등을 알 수 없을 때 (환불·통계 응답 등) */
    public static final String DISPLAY_NAME_UNKNOWN = "알 수 없음";

    public static final String MSG_REFUND_MATCHING_INFO_MISSING = "매칭 정보 없음";

    /** 통계 등에서 기간 미지정 시 레이블 */
    public static final String STATS_PERIOD_LABEL_ALL = "전체";

    /**
     * 영문 전문분야 코드 → 한글 표시명 (관리 화면·API 통일).
     */
    public static final Map<String, String> SPECIALTY_CODE_TO_KOREAN_DISPLAY_NAME;

    /** 휴가 유형 분류·통계 map 키 (API 응답과 동일) */
    public static final String VACATION_CATEGORY_ANNUAL = "연차";

    public static final String VACATION_CATEGORY_HALF_DAY = "반차";

    public static final String VACATION_CATEGORY_QUARTER_DAY = "반반차";

    public static final String VACATION_CATEGORY_PERSONAL = "개인사정";

    public static final String VACATION_CATEGORY_SICK = "병가";

    /** 스케줄 목록에서 비활성 상담사 표시 접미사 */
    public static final String SCHEDULE_CONSULTANT_NAME_DELETED_SUFFIX = " (삭제됨)";

    /** 환불 사유 표준화 시 테스트용 고정 라벨 */
    public static final String REFUND_REASON_TEST_LABEL = "환불테스트";

    static {
        Map<String, String> specialty = new HashMap<>();
        specialty.put("DEPRESSION", "우울증");
        specialty.put("ANXIETY", "불안장애");
        specialty.put("TRAUMA", "트라우마");
        specialty.put("STRESS", "스트레스");
        specialty.put("RELATIONSHIP", "관계상담");
        specialty.put("FAMILY", "가족상담");
        specialty.put("COUPLE", "부부상담");
        specialty.put("CHILD", "아동상담");
        specialty.put("TEEN", "청소년상담");
        specialty.put("ADOLESCENT", "청소년상담");
        specialty.put("ADDICTION", "중독");
        specialty.put("EATING", "섭식장애");
        specialty.put("SLEEP", "수면장애");
        specialty.put("ANGER", "분노조절");
        specialty.put("GRIEF", "상실");
        specialty.put("SELF_ESTEEM", "자존감");
        specialty.put("CAREER", "진로상담");
        specialty.put("FAMIL", "가족상담");
        SPECIALTY_CODE_TO_KOREAN_DISPLAY_NAME = Collections.unmodifiableMap(specialty);
    }

    private AdminServiceUserFacingMessages() {
    }
}
