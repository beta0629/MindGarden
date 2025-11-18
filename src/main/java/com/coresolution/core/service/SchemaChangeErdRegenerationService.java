package com.coresolution.core.service;

import java.util.List;

/**
 * 스키마 변경 시 ERD 자동 재생성 서비스
 * <p>
 * 스키마 변경이 감지되면 관련 테넌트의 ERD를 자동으로 재생성합니다.
 * </p>
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface SchemaChangeErdRegenerationService {

    /**
     * 스키마 변경 감지 및 관련 ERD 재생성
     * <p>
     * 현재 스키마와 이전 스키마를 비교하여 변경사항을 감지하고,
     * 변경이 있으면 관련 테넌트의 ERD를 자동으로 재생성합니다.
     * </p>
     *
     * @param schemaName 스키마 이름
     * @return 재생성된 ERD 수
     */
    int detectAndRegenerateErds(String schemaName);

    /**
     * 특정 테넌트의 ERD 재생성
     *
     * @param tenantId 테넌트 ID
     * @param schemaName 스키마 이름
     * @return 재생성 성공 여부
     */
    boolean regenerateTenantErd(String tenantId, String schemaName);

    /**
     * 모든 활성 테넌트의 ERD 재생성
     *
     * @param schemaName 스키마 이름
     * @return 재생성된 ERD 수
     */
    int regenerateAllTenantErds(String schemaName);

    /**
     * 전체 시스템 ERD 재생성
     *
     * @param schemaName 스키마 이름
     * @return 재생성 성공 여부
     */
    boolean regenerateFullSystemErd(String schemaName);

    /**
     * 변경된 테이블 목록에 영향을 받는 테넌트 ERD 재생성
     *
     * @param changedTableNames 변경된 테이블 이름 목록
     * @param schemaName 스키마 이름
     * @return 재생성된 ERD 수
     */
    int regenerateErdsForChangedTables(List<String> changedTableNames, String schemaName);
}

