package com.mindgarden.consultation.service;

import java.util.Map;

/**
 * 코드 마이그레이션 서비스 인터페이스
 * code_groups + code_values 테이블의 데이터를 common_codes 테이블로 마이그레이션
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-09
 */
public interface CodeMigrationService {
    
    /**
     * 코드 마이그레이션 상태 확인
     */
    Map<String, Object> checkMigrationStatus();
    
    /**
     * code_groups + code_values 테이블의 데이터를 common_codes 테이블로 마이그레이션
     */
    Map<String, Object> migrateCodesToCommonCodes();
    
    /**
     * 마이그레이션 롤백 (common_codes 테이블 데이터 삭제)
     */
    Map<String, Object> rollbackMigration();
}
