package com.coresolution.consultation.exception;

import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;

/**
 * 매칭 환불(강제 종료·부분 환불·일괄 취소)에서 환불 전표(재무 거래)를 기록하지 못했을 때 발생한다.
 *
 * <p>환불 전표 없이 매칭 상태·회기만 바뀌는 것을 막기 위해 같은 트랜잭션을 롤백시키고 422 로 응답한다.
 * 메시지는 관리자에게 보여줄 문구만 담는다 (기관 id·SQL 등 기술 원문 없음).</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
public class RefundLedgerNotRecordedException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /** 응답 본문 오류 코드. */
    public static final String ERROR_CODE = "REFUND_LEDGER_NOT_RECORDED";

    private final Long mappingId;

    private RefundLedgerNotRecordedException(Long mappingId, String message, Throwable cause) {
        super(message, cause);
        this.mappingId = mappingId;
    }

    /**
     * 원인 예외로 관리자 문구를 고른다. 세율 공통코드 미설정이면 설정 안내, 그 밖에는 재시도 안내.
     *
     * @param mappingId 매칭 ID
     * @param cause     전표 기록 실패 원인
     * @return 환불 전표 미기록 예외 (원인이 이미 이 예외면 그대로)
     */
    public static RefundLedgerNotRecordedException of(Long mappingId, Throwable cause) {
        if (cause instanceof RefundLedgerNotRecordedException already) {
            return already;
        }
        String message = hasTaxRateCause(cause)
                ? AdminServiceUserFacingMessages.MSG_REFUND_LEDGER_TAX_RATE_NOT_CONFIGURED
                : AdminServiceUserFacingMessages.MSG_REFUND_LEDGER_NOT_RECORDED;
        return new RefundLedgerNotRecordedException(mappingId, message, cause);
    }

    private static boolean hasTaxRateCause(Throwable cause) {
        for (Throwable t = cause; t != null; t = t.getCause()) {
            if (t instanceof SalaryTaxRateNotConfiguredException) {
                return true;
            }
            if (t.getCause() == t) {
                break;
            }
        }
        return false;
    }

    public Long getMappingId() {
        return mappingId;
    }
}
