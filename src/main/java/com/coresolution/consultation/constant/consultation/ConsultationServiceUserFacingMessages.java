package com.coresolution.consultation.constant.consultation;

/**
 * {@code ConsultationService}에서 사용자·알림에 노출될 수 있는 메시지 문자열.
 *
 * @author CoreSolution
 * @since 2026-04-21
 */
public final class ConsultationServiceUserFacingMessages {

    public static final String MSG_TENANT_ID_REQUIRED_NO_CONTEXT =
            "tenantId는 필수입니다. 테넌트 정보가 없습니다.";

    public static final String MSG_CONSULTATION_NOT_FOUND_FMT = "상담을 찾을 수 없습니다: %s";

    public static final String MSG_ACTIVE_CONSULTATION_NOT_FOUND_FMT = "활성 상담을 찾을 수 없습니다: %s";

    public static final String MSG_REVIEW_CREATE_FAILED = "상담 평가 등록에 실패했습니다.";

    public static final String MSG_REVIEW_UPDATE_FAILED = "상담 평가 수정에 실패했습니다.";

    public static final String MSG_NOTE_ADD_FAILED = "상담 노트 추가에 실패했습니다.";

    public static final String MSG_NOTE_NOT_FOUND_FMT = "노트를 찾을 수 없습니다: %s";

    public static final String MSG_NOTE_UPDATE_FAILED = "상담 노트 수정에 실패했습니다.";

    public static final String MSG_NOTE_DELETE_FAILED = "상담 노트 삭제에 실패했습니다.";

    public static final String MSG_CLIENT_NOT_FOUND_FMT = "클라이언트를 찾을 수 없습니다: %s";

    public static final String MSG_EMERGENCY_REQUEST_FAILED = "긴급 상담 요청에 실패했습니다.";

    public static final String MSG_CONSULTANT_NOT_FOUND_FMT = "상담사를 찾을 수 없습니다: %s";

    public static final String MSG_EMERGENCY_ASSIGN_FAILED = "긴급 상담 할당에 실패했습니다.";

    public static final String MSG_EMERGENCY_PRIORITY_ADJUST_FAILED = "긴급 상담 우선순위 조정에 실패했습니다.";

    public static final String MSG_QUALITY_EVALUATION_FAILED = "상담 품질 평가에 실패했습니다.";

    public static final String MSG_CONSULTATION_DISCOUNT_APPLY_FAILED = "상담 비용 할인 적용에 실패했습니다.";

    public static final String MSG_CONSULTATION_SETTLEMENT_FAILED = "상담 비용 정산에 실패했습니다.";

    public static final String MSG_CONSULTATION_DATA_BACKUP_FAILED = "상담 데이터 백업에 실패했습니다.";

    public static final String MSG_BACKUP_DIRECTORY_NOT_EXISTS_FMT = "백업 디렉토리가 존재하지 않습니다: %s";

    public static final String MSG_BACKUP_FILE_NOT_FOUND_FMT = "백업 파일을 찾을 수 없습니다: %s";

    public static final String MSG_CONSULTATION_DATA_RESTORE_FAILED = "상담 데이터 복원에 실패했습니다.";

    public static final String MSG_CONSULTATION_DATA_ARCHIVE_FAILED = "상담 데이터 아카이브에 실패했습니다.";

    public static final String MSG_CONSULTATION_DATA_CLEANUP_FAILED = "상담 데이터 정리에 실패했습니다.";

    public static final String ALERT_EMERGENCY_CONSULTATION_REQUEST_RECEIVED =
            "긴급 상담 요청이 접수되었습니다. 즉시 확인해주세요.";

    public static final String ALERT_EMERGENCY_CONSULTATION_ASSIGNED =
            "긴급 상담이 할당되었습니다. 즉시 확인해주세요.";

    /** 이메일 템플릿 등에서 상담사명을 알 수 없을 때 사용하는 표시명. */
    public static final String DEFAULT_CONSULTANT_DISPLAY_NAME = "상담사";

    public static final String MSG_CONSULTATION_SCHEDULE_CHANGE_FMT = "상담 일정이 %s되었습니다.";

    public static final String MSG_CONSULTATION_COMPLETED_THANK_YOU =
            "상담이 성공적으로 완료되었습니다. 감사합니다.";

    public static final String EMAIL_DISPLAY_NAME_ADMIN = "관리자";

    public static final String EMAIL_PLACEHOLDER_CLIENT_NAME = "클라이언트";

    private ConsultationServiceUserFacingMessages() {
    }
}
