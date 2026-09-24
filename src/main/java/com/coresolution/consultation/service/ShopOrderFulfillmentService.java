package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.ShopClientOrder;

/**
 * 쇼핑 주문 PAID 직후 이행(fulfillment) 및 전액 환불 시 회기 원복.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public interface ShopOrderFulfillmentService {

    /**
     * PAID 확정 직후 주문 라인별 이행 이벤트 기록. 멱등 키 {@code orderPublicId:FULFILL}.
     *
     * @param tenantId 테넌트 ID
     * @param order    PAID 상태 주문
     */
    void fulfillPaidOrder(String tenantId, ShopClientOrder order);

    /**
     * 전액 환불·결제 취소 시 CONSULTATION 이행으로 가산된 회기를 원복한다 (멱등).
     *
     * <p>이미 {@code REVERSED} 인 이벤트는 회기 차감을 건너뛴다(paymentStatus·ERP 수리만).
     * 회기 원복 대상: {@code COMPLETED} 상담 라인, 또는 레거시 분리 TX mid-state
     * {@code FAILED}({@code CONSULTATION_INCOME_SYNC_FAILED} — 회기만 커밋·INCOME 실패).</p>
     *
     * @param tenantId 테넌트 ID
     * @param order    환불 대상 주문(아직 PAID 이거나 동 트랜잭션 내)
     */
    void reversePaidOrderFulfillment(String tenantId, ShopClientOrder order);

    /**
     * PAID 주문의 재시도 가능한 FAILED 이행만 다시 처리한다. 주문 상태는 PAID 유지.
     *
     * <p>{@code clientOneShot=true} 이면 진입 시 플래그가 이미 true 면 거부한다.
     * 플래그는 fulfill 후 재시도 가능 FAILED 가 없을 때만 true 로 저장한다
     * (클릭 1회가 아니라 성공 재이행 1회 소진). 여전히 FAILED+retryable 이면 플래그는 false 유지.</p>
     *
     * @param tenantId      테넌트 ID
     * @param order         대상 주문
     * @param clientOneShot {@code true}이면 내담자 성공 재이행 1회 게이트 적용
     * @throws IllegalArgumentException 테넌트·주문 유효성 실패(fail-closed)
     * @throws IllegalStateException    PAID 아님·재시도 가능 FAILED 없음·내담자 성공 재이행 이미 소진
     */
    void retryFailedFulfillment(String tenantId, ShopClientOrder order, boolean clientOneShot);

    /**
     * PAID 주문 상담 매핑 입금 INCOME 수리 — COMPLETED 이행이어도 posted 합≠cashDue 이면 ensure.
     * 멱등: 이미 SSOT 일치하면 no-op.
     *
     * @param tenantId 테넌트 ID
     * @param order    대상 주문
     * @throws IllegalArgumentException 상담 매핑 라인 없음
     * @throws IllegalStateException    INCOME 보장 실패
     */
    void repairConsultationDepositIncome(String tenantId, ShopClientOrder order);

    /**
     * afterCommit fulfill 예외 후, 주문에 fulfillment 이벤트가 없거나 retryable FAILED 가 없으면
     * FAILED(retryable) sentinel 을 영속한다. 결제 TX 는 이미 커밋됐으므로
     * {@code PROPAGATION_REQUIRES_NEW} 로 기록한다. 멱등.
     *
     * @param tenantId 테넌트 ID
     * @param order    PAID 주문
     * @param cause    afterCommit fulfill 예외(메시지 sanitise 용, null 허용)
     */
    void persistRetryableFailedSentinelIfNeeded(String tenantId, ShopClientOrder order, Exception cause);
}
