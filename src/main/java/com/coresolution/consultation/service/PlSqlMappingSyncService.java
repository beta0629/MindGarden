package com.coresolution.consultation.service;

import java.util.Map;

/**
 * PL/SQL 매핑 동기화 서비스 인터페이스 (회기 5종 프로시저는 Phase 1 1A 폐기).
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
public interface PlSqlMappingSyncService {

    /**
     * 매핑 데이터 무결성 검증
     *
     * @param mappingId 매핑 ID
     * @return 검증 결과
     */
    Map<String, Object> validateMappingIntegrity(Long mappingId);

    /**
     * 전체 시스템 매핑 동기화
     *
     * @return 동기화 결과
     */
    Map<String, Object> syncAllMappings();

    /**
     * 환불 통계 조회
     *
     * @param branchCode 지점 코드 (레거시 호환, 미사용)
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 환불 통계
     */
    Map<String, Object> getRefundStatistics(String branchCode, String startDate, String endDate);

    /**
     * PL/SQL 프로시저 사용 가능 여부 확인
     *
     * @return 사용 가능 여부
     */
    boolean isProcedureAvailable();
}
