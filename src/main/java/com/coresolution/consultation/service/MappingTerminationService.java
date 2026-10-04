package com.coresolution.consultation.service;

/**
 * 매칭 단건 강제 종료(전체 환불) 진입점 — 결제 경로에 따라 원장 환불 또는 쇼핑 주문 환불로 나눈다.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
public interface MappingTerminationService {

    /**
     * 쇼핑 주문(Path B)으로 결제된 매칭은 주문 전액 환불(PortOne 취소는 DB 트랜잭션 밖)로,
     * 그 밖의 매칭은 {@link AdminService#terminateMapping(Long, String)} 으로 종료한다.
     * DB 트랜잭션 밖에서 호출해야 한다.
     *
     * @param mappingId 매칭 ID
     * @param reason    관리자 사유
     */
    void terminate(Long mappingId, String reason);
}
