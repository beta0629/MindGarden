package com.coresolution.consultation.service.support;

/**
 * 상담료 INCOME을 어느 트랜잭션에 쓸지 정하는 한 곳.
 * <p>
 * 기본은 단독 결제 확인의 독립 커밋이다. 원샷 결제+활성화만
 * {@link #beginJoinCallerTransaction()} 으로 바깥 트랜잭션에 합류시킨다.
 * 입금 확인이 그 트랜잭션 안에서 한 번만 쓴다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
public final class ConsultationIncomeCommitPolicy {

    /**
     * INCOME 커밋 방식.
     */
    public enum Mode {
        /** 단독 confirmPayment. REQUIRES_NEW로 커밋하고 실패는 삼킨다. */
        INDEPENDENT,
        /** 원샷. confirmPayment는 쓰지 않고, confirmDeposit이 바깥 트랜잭션에 한 번 쓴다. */
        JOIN_CALLER
    }

    private static final ThreadLocal<Mode> CURRENT = new ThreadLocal<>();

    private ConsultationIncomeCommitPolicy() {
    }

    /**
     * 지금 스레드의 커밋 방식. 설정이 없으면 독립 커밋이다.
     *
     * @return 커밋 방식
     */
    public static Mode current() {
        Mode mode = CURRENT.get();
        return mode == null ? Mode.INDEPENDENT : mode;
    }

    /**
     * 원샷처럼 바깥 트랜잭션에 합류해야 하면 true.
     *
     * @return 합류 모드이면 true
     */
    public static boolean joinsCallerTransaction() {
        return current() == Mode.JOIN_CALLER;
    }

    /**
     * 원샷 구간을 연다. 이전 모드를 돌려주며, 끝나면 {@link #endJoinCallerTransaction(Mode)} 로 복원한다.
     *
     * @return 이전 모드 (없었으면 null)
     */
    public static Mode beginJoinCallerTransaction() {
        Mode previous = CURRENT.get();
        CURRENT.set(Mode.JOIN_CALLER);
        return previous;
    }

    /**
     * {@link #beginJoinCallerTransaction()} 이 덮어쓰기 전의 모드로 되돌린다.
     *
     * @param previous 시작 시 반환된 이전 모드
     */
    public static void endJoinCallerTransaction(Mode previous) {
        if (previous == null) {
            CURRENT.remove();
        } else {
            CURRENT.set(previous);
        }
    }
}
