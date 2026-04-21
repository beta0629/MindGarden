package com.coresolution.consultation.constant.admin;

/**
 * {@code AdminService}에서 사용자에게 노출될 수 있는 메시지·표시명 문자열.
 *
 * @author CoreSolution
 * @since 2026-04-21
 */
public final class AdminServiceUserFacingMessages {

    public static final String MSG_EMAIL_REQUIRED = "이메일은 필수입니다.";

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

    private AdminServiceUserFacingMessages() {
    }
}
