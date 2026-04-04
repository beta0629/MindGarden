package com.coresolution.consultation.service;

/**
 * 내담자 CLIENT 등급 자동 승급 (완료 스케줄 수·common_codes min_sessions).
 *
 * @author CoreSolution
 * @since 2026-04-04
 */
public interface ClientGradeAutoPromotionService {

    /**
     * 단일 테넌트 처리 (스케줄러가 tenantId 루프에서 호출).
     *
     * @param tenantId 테넌트 ID
     * @return 스캔·갱신 건수
     */
    Result runForTenant(String tenantId);

    /**
     * 테넌트 단위 실행 요약.
     *
     * @param clientsScanned 활성 내담자 페이지 처리 건수
     * @param gradesUpdated 등급 변경 저장 건수
     */
    record Result(int clientsScanned, int gradesUpdated) {
    }
}
