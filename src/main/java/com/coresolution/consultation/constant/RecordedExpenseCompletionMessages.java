package com.coresolution.consultation.constant;

/**
 * 빠른 지출 완료 저장·장부 완료 처리 응답 문구.
 * 결제·환불·입금 경로 문구와 섞지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-17
 */
public final class RecordedExpenseCompletionMessages {

    /** 관리자가 아닐 때 */
    public static final String ADMIN_REQUIRED = "비용처리는 관리자 권한이 필요합니다.";

    /** 테넌트가 없을 때 */
    public static final String TENANT_REQUIRED = "테넌트 정보를 찾을 수 없습니다.";

    /** 완료 처리 성공 */
    public static final String COMPLETED = "지출을 완료 처리했습니다.";

    /** 수입·환불·이미 완료된 건 등 완료로 바꿀 수 없을 때 */
    public static final String NOT_COMPLETABLE = "완료 처리할 수 없는 지출입니다.";

    /** 서비스가 던지는 사유 코드. 응답 본문에는 넣지 않는다. */
    public static final String REASON_NOT_FOUND = "NOT_FOUND";

    /** 서비스가 던지는 사유 코드. 응답 본문에는 넣지 않는다. */
    public static final String REASON_NOT_EXPENSE = "NOT_EXPENSE";

    /** 서비스가 던지는 사유 코드. 응답 본문에는 넣지 않는다. */
    public static final String REASON_REFUND = "REFUND";

    /** 서비스가 던지는 사유 코드. 응답 본문에는 넣지 않는다. */
    public static final String REASON_STATUS = "STATUS";

    private RecordedExpenseCompletionMessages() {
    }
}
