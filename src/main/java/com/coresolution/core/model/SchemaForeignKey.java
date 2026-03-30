package com.coresolution.core.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 데이터베이스 스키마 외래키 정보 모델
 * INFORMATION_SCHEMA에서 조회한 외래키 정보
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchemaForeignKey {
    
    /**
     * 제약조건명
     */
    private String constraintName;
    
    /**
     * 테이블명
     */
    private String tableName;
    
    /**
     * 컬럼명
     */
    private String columnName;
    
    /**
     * 참조 테이블명
     */
    private String referencedTableName;
    
    /**
     * 참조 컬럼명
     */
    private String referencedColumnName;
    
    /**
     * 업데이트 규칙 (CASCADE, RESTRICT, SET NULL 등)
     */
    private String updateRule;
    
    /**
     * 삭제 규칙 (CASCADE, RESTRICT, SET NULL 등)
     */
    private String deleteRule;
}

