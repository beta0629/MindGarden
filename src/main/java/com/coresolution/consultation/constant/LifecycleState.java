package com.coresolution.consultation.constant;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

/**
 * 회원 lifecycle 단계 SSOT enum — USER_LIFECYCLE_TERMINATION_POLICY §3.6.
 *
 * <p>현행 {@code is_active}(BOOL) / {@code is_deleted}(BOOL) / {@code deleted_at}(DATETIME)
 * 세 컬럼을 단일 {@code lifecycle_state} 컬럼으로 통합한다. 사용자 결정 Q1 채택 확정.</p>
 *
 * <p>전이 그래프 (§3.6):</p>
 * <ul>
 *   <li>{@link #ACTIVE} → {@link #SUSPENDED} (운영자 의도) / {@link #WITHDRAWAL_PENDING} (자발) /
 *       {@link #DORMANT} (자동) / {@link #DELETED_BY_ADMIN} (어드민 강제)</li>
 *   <li>{@link #SUSPENDED} → {@link #ACTIVE} (해제) / {@link #ANONYMIZED} (종료 결정)</li>
 *   <li>{@link #WITHDRAWAL_PENDING} → {@link #ACTIVE} (본인 30일 내 취소) /
 *       {@link #ANONYMIZED} (Q3 유예 만료)</li>
 *   <li>{@link #DORMANT} → {@link #ACTIVE} (재로그인 + vault 복원) /
 *       {@link #ANONYMIZED} (Q9 추가 4년 경과)</li>
 *   <li>{@link #DELETED_BY_ADMIN} → {@link #ACTIVE} (Q5 7일 내 어드민 롤백) /
 *       {@link #ANONYMIZED} (7일 만료 시 자동)</li>
 *   <li>{@link #ANONYMIZED} → {@link #HARD_DELETED} (보존 의무 만료 + 운영자 명시 승인)</li>
 *   <li>{@link #HARD_DELETED} → (row gone — 종착)</li>
 * </ul>
 *
 * <p>활성 사용자 조회 시 사용하는 필터: {@link #ACTIVE_LIKE_STATES} —
 * {@code lifecycle_state IN ('ACTIVE', 'SUSPENDED', 'WITHDRAWAL_PENDING', 'DORMANT')}.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
public enum LifecycleState {

    /** 정상 활성. */
    ACTIVE("ACTIVE", "enums.LifecycleState.ACTIVE"),

    /** 일시 정지 — 운영자 의도 (계정 잠금/심사 대기 등은 {@code is_active=false} 와 별개). */
    SUSPENDED("SUSPENDED", "enums.LifecycleState.SUSPENDED"),

    /** 자발 탈퇴 신청 — Q3 결정 30일 유예 (본인 취소 가능). */
    WITHDRAWAL_PENDING("WITHDRAWAL_PENDING", "enums.LifecycleState.WITHDRAWAL_PENDING"),

    /** 1년 미접속 휴면 — Q9 결정 별도 PII vault. */
    DORMANT("DORMANT", "enums.LifecycleState.DORMANT"),

    /** PII 익명화 완료 — 롤백 불가. */
    ANONYMIZED("ANONYMIZED", "enums.LifecycleState.ANONYMIZED"),

    /** 어드민 강제 종료 — Q5 결정 7일 보존 윈도우 (롤백 가능). */
    DELETED_BY_ADMIN("DELETED_BY_ADMIN", "enums.LifecycleState.DELETED_BY_ADMIN"),

    /** 행 hard delete 대상 — 보존 의무 만료 후 + 운영자 명시 승인. */
    HARD_DELETED("HARD_DELETED", "enums.LifecycleState.HARD_DELETED");

    /** 활성 사용자 조회 시 lifecycle_state 필터 (ACTIVE / SUSPENDED / WITHDRAWAL_PENDING / DORMANT). */
    public static final Set<LifecycleState> ACTIVE_LIKE_STATES = Collections.unmodifiableSet(
            EnumSet.of(ACTIVE, SUSPENDED, WITHDRAWAL_PENDING, DORMANT));

    /** 종료 종착 (PII 복원 불가) 상태들. */
    public static final Set<LifecycleState> TERMINAL_STATES = Collections.unmodifiableSet(
            EnumSet.of(ANONYMIZED, HARD_DELETED));

    private final String code;
    private final String messageKey;

    LifecycleState(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    /** @return DB 컬럼에 적재되는 코드 (예: ACTIVE). */
    public String getCode() {
        return code;
    }

    /** @return Spring MessageSource 의 i18n 키 (예: enums.LifecycleState.ACTIVE). */
    public String getMessageKey() {
        return messageKey;
    }

    /**
     * 본 상태에서 전이 가능한 다음 상태 집합 (§3.6 전이 그래프).
     *
     * @return 전이 가능한 nextStates (불변 Set)
     */
    public Set<LifecycleState> nextStates() {
        switch (this) {
            case ACTIVE:
                return Collections.unmodifiableSet(EnumSet.of(
                        SUSPENDED, WITHDRAWAL_PENDING, DORMANT, DELETED_BY_ADMIN, ANONYMIZED));
            case SUSPENDED:
                return Collections.unmodifiableSet(EnumSet.of(ACTIVE, ANONYMIZED));
            case WITHDRAWAL_PENDING:
                return Collections.unmodifiableSet(EnumSet.of(ACTIVE, ANONYMIZED));
            case DORMANT:
                return Collections.unmodifiableSet(EnumSet.of(ACTIVE, ANONYMIZED));
            case DELETED_BY_ADMIN:
                return Collections.unmodifiableSet(EnumSet.of(ACTIVE, ANONYMIZED));
            case ANONYMIZED:
                return Collections.unmodifiableSet(EnumSet.of(HARD_DELETED));
            case HARD_DELETED:
            default:
                return Collections.emptySet();
        }
    }

    /**
     * 본 상태에서 {@code newState} 로 전이 가능한지 검증.
     *
     * @param newState 목표 상태
     * @return 전이 가능 여부
     */
    public boolean canTransitionTo(LifecycleState newState) {
        if (newState == null) {
            return false;
        }
        if (newState == this) {
            return false;
        }
        return nextStates().contains(newState);
    }

    /**
     * 활성 사용자 조회 필터 매칭 여부.
     *
     * @return ACTIVE / SUSPENDED / WITHDRAWAL_PENDING / DORMANT 중 하나면 true
     */
    public boolean isActiveLike() {
        return ACTIVE_LIKE_STATES.contains(this);
    }

    /**
     * 종착 (PII 복원 불가) 상태 여부.
     *
     * @return ANONYMIZED / HARD_DELETED 중 하나면 true
     */
    public boolean isTerminal() {
        return TERMINAL_STATES.contains(this);
    }

    /**
     * 코드 문자열로 enum 을 찾는다.
     *
     * @param code DB 컬럼 코드 (예: ACTIVE)
     * @return 매칭되는 enum
     * @throws IllegalArgumentException 알 수 없는 코드일 때
     */
    public static LifecycleState fromCode(String code) {
        if (code == null) {
            throw new IllegalArgumentException("LifecycleState code is null");
        }
        for (LifecycleState value : values()) {
            if (value.code.equals(code)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown LifecycleState code: " + code);
    }
}
