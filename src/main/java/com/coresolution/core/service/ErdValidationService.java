package com.coresolution.core.service;

import com.coresolution.core.dto.ErdValidationReport;

/**
 * ERD 검증 서비스 인터페이스
 * <p>
 * 데이터베이스 스키마와 ERD가 일치하는지 검증합니다.
 * </p>
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface ErdValidationService {

    /**
     * ERD 검증 수행
     * <p>
     * 현재 데이터베이스 스키마와 ERD에 저장된 정보를 비교하여 일치 여부를 검증합니다.
     * </p>
     *
     * @param diagramId ERD 다이어그램 ID
     * @param schemaName 스키마 이름 (null이면 기본 스키마 사용)
     * @return 검증 리포트
     */
    ErdValidationReport validateErd(String diagramId, String schemaName);

    /**
     * 테넌트 ERD 검증 수행
     *
     * @param tenantId 테넌트 ID
     * @param schemaName 스키마 이름 (null이면 기본 스키마 사용)
     * @return 검증 리포트
     */
    ErdValidationReport validateTenantErd(String tenantId, String schemaName);

    /**
     * 전체 시스템 ERD 검증 수행
     *
     * @param schemaName 스키마 이름 (null이면 기본 스키마 사용)
     * @return 검증 리포트
     */
    ErdValidationReport validateFullSystemErd(String schemaName);

    /**
     * 모든 활성 ERD 검증 수행
     *
     * @param schemaName 스키마 이름 (null이면 기본 스키마 사용)
     * @return 검증 리포트 목록
     */
    java.util.List<ErdValidationReport> validateAllActiveErds(String schemaName);
}

