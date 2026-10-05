package com.coresolution.consultation.exception;

import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;

/**
 * 입금 확인된 매칭의 감액에서 새 금액이 (결제액 − 누적 환불액) 미만일 때 발생한다.
 *
 * <p>매칭·재무 전표를 바꾸지 않고(트랜잭션 롤백) 422 와 전용 오류 코드로 응답한다. 결제액을 알 수 없을 때도
 * 하한을 확인할 수 없으므로 같은 오류로 거부한다(fail-closed).</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public class MappingAmountBelowRefundFloorException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /** 응답 본문 오류 코드. */
    public static final String ERROR_CODE = "MAPPING_AMOUNT_BELOW_REFUND_FLOOR";

    private final Long mappingId;

    /**
     * @param mappingId 매칭 ID
     */
    public MappingAmountBelowRefundFloorException(Long mappingId) {
        super(AdminServiceUserFacingMessages.MSG_MAPPING_AMOUNT_BELOW_REFUND_FLOOR);
        this.mappingId = mappingId;
    }

    public Long getMappingId() {
        return mappingId;
    }
}
