package com.coresolution.consultation.exception;

import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;

/**
 * 매칭 입금 확인·패키지 수정에서 재무(ERP) 거래를 기록·동기화하지 못했을 때 발생한다.
 *
 * <p>ERP 없이 매칭만 바뀐 채 성공으로 보이는 것을 막기 위해 매칭 변경을 롤백(또는 시작 전 거부)하고 422 로 응답한다.
 * 같은 요청을 다시 보내면 처음부터 다시 처리된다. 메시지는 관리자 문구만 담는다(SQL·기관 id 없음).</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public class MappingErpSyncFailedException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /** 응답 본문 오류 코드. */
    public static final String ERROR_CODE = "MAPPING_ERP_SYNC_FAILED";

    private final Long mappingId;

    private MappingErpSyncFailedException(Long mappingId, String message, Throwable cause) {
        super(message, cause);
        this.mappingId = mappingId;
    }

    /**
     * 동기화 실패(예외·프로시저 실패 응답).
     *
     * @param mappingId 매칭 ID
     * @param cause     원인 (없으면 null)
     * @return 예외 (원인이 이미 이 예외면 그대로)
     */
    public static MappingErpSyncFailedException of(Long mappingId, Throwable cause) {
        if (cause instanceof MappingErpSyncFailedException already) {
            return already;
        }
        return new MappingErpSyncFailedException(mappingId,
                AdminServiceUserFacingMessages.MSG_MAPPING_ERP_SYNC_FAILED, cause);
    }

    /**
     * 동기화 경로가 없는 매칭(쇼핑·타기관 연계·추가 패키지)의 금액·회기 변경 거부.
     *
     * @param mappingId 매칭 ID
     * @return 예외
     */
    public static MappingErpSyncFailedException unsupported(Long mappingId) {
        return new MappingErpSyncFailedException(mappingId,
                AdminServiceUserFacingMessages.MSG_MAPPING_ERP_SYNC_UNSUPPORTED, null);
    }

    public Long getMappingId() {
        return mappingId;
    }
}
