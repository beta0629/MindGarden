package com.coresolution.consultation.constant;

import com.coresolution.consultation.entity.User;
import java.util.List;

/**
 * 관리자 화면에 노출·선택 가능한 내담자 판정 SSOT.
 *
 * <p>통합 내담자 데이터(with-mapping-info), 관리자 내담자 검색, 내담자별 결제 상품 지정이 같은 조건을 쓴다.
 * 제외: {@code isDeleted=true}, {@code isActive=false},
 * lifecycle {@code DELETED_BY_ADMIN}·{@code ANONYMIZED}·{@code HARD_DELETED}.
 * {@code isActive}·lifecycle 이 null 이면 노출한다 (레거시 행).
 * 레포지토리 쿼리 {@code UserRepository#findVisibleClientsForMappingList} 는 {@link #EXCLUDED_LIFECYCLES} 를 인자로 받는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-12
 */
public final class ClientVisibilityPolicy {

    /** 관리자 목록·검색·지정에서 제외할 lifecycle. */
    public static final List<LifecycleState> EXCLUDED_LIFECYCLES = List.of(
            LifecycleState.DELETED_BY_ADMIN,
            LifecycleState.ANONYMIZED,
            LifecycleState.HARD_DELETED);

    private ClientVisibilityPolicy() {
    }

    /**
     * @param user 내담자
     * @return 관리자 화면 노출·선택 가능 여부
     */
    public static boolean isVisible(User user) {
        if (user == null) {
            return false;
        }
        if (Boolean.FALSE.equals(user.getIsActive()) || Boolean.TRUE.equals(user.getIsDeleted())) {
            return false;
        }
        LifecycleState state = user.getLifecycleState();
        return state == null || !EXCLUDED_LIFECYCLES.contains(state);
    }
}
