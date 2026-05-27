package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.DormantUserDetailResponse;
import com.coresolution.consultation.dto.lifecycle.DormantUserSummaryResponse;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 어드민 lifecycle 모니터링 SSOT — Phase 4
 * (USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.9 + §10.12).
 *
 * <p>어드민 운영자가 휴면(DORMANT) 사용자를 모니터링하고 강제 복귀 / 즉시 익명화를
 * 수행하는 4 endpoint 의 비즈니스 로직을 단일 책임으로 보관한다. 모든 조회 / 변경은
 * tenantId 격리 + audit_logs 기록 필수.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
public interface AdminLifecycleService {

    /**
     * 테넌트별 휴면 사용자 페이지네이션 목록.
     *
     * @param tenantId 테넌트 ID
     * @param pageable 페이지 정보
     * @return 응답 페이지
     */
    Page<DormantUserSummaryResponse> listDormantUsers(String tenantId, Pageable pageable);

    /**
     * 단일 휴면 사용자 상세.
     *
     * @param tenantId 테넌트 ID
     * @param userId   대상 users.id
     * @return 상세 응답
     * @throws IllegalArgumentException 휴면이 아닌 사용자 / 미존재 / 다른 테넌트일 때
     */
    DormantUserDetailResponse getDormantUserDetail(String tenantId, Long userId);

    /**
     * 휴면 사용자 강제 복귀 — DORMANT → ACTIVE
     * (UserLifecycleService.reactivate(...) 위임).
     *
     * @param tenantId 테넌트 ID
     * @param userId   대상 users.id
     * @param actor    어드민 actor
     * @return 전이 결과
     */
    TransitionResult reactivateDormantUser(String tenantId, Long userId, Actor actor);

    /**
     * 휴면 사용자 강제 즉시 익명화 — DORMANT → ANONYMIZED
     * + dormant_user_pii_vault 행 정리 (UserLifecycleService.transitionTo(ANONYMIZED) 위임 + vault DELETE).
     *
     * <p>4년 안정 보관 기간이 만료되지 않았더라도 운영 결재 후 어드민이 즉시 익명화할 수
     * 있도록 한다 (예: 사용자 명시 요청, 법적 분쟁 격리 등). 사유는 ADMIN_FORCED 로
     * 기록되며 audit_logs / personal_data_destruction_logs / community_anonymization_audit
     * 모두 동시 적재된다.</p>
     *
     * @param tenantId 테넌트 ID
     * @param userId   대상 users.id
     * @param actor    어드민 actor
     * @return 전이 결과
     */
    TransitionResult forceAnonymizeDormantUser(String tenantId, Long userId, Actor actor);
}
