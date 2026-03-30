package com.coresolution.core.service;

import com.coresolution.core.model.SchemaTable;

import java.util.List;

/**
 * 데이터베이스 스키마 조회 서비스 인터페이스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface SchemaService {
    
    /**
     * 모든 테이블 정보 조회
     */
    List<SchemaTable> getAllTables(String schemaName);
    
    /**
     * 특정 테이블 정보 조회
     */
    SchemaTable getTable(String schemaName, String tableName);
    
    /**
     * 테이블 목록 조회 (이름만)
     */
    List<String> getTableNames(String schemaName);
    
    /**
     * 테넌트별 테이블 필터링
     * tenant_id 컬럼이 있는 테이블만 조회
     */
    List<SchemaTable> getTenantTables(String schemaName, String tenantId);
    
    /**
     * 특정 모듈 관련 테이블 조회
     * 테이블명 패턴으로 필터링
     */
    List<SchemaTable> getModuleTables(String schemaName, String modulePrefix);
}

