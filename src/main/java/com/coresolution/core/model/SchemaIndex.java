package com.coresolution.core.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 데이터베이스 스키마 인덱스 정보 모델
 * INFORMATION_SCHEMA에서 조회한 인덱스 정보
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchemaIndex {
    
    /**
     * 인덱스명
     */
    private String indexName;
    
    /**
     * 테이블명
     */
    private String tableName;
    
    /**
     * 컬럼명
     */
    private String columnName;
    
    /**
     * 중복 허용 여부 (0: UNIQUE, 1: NON-UNIQUE)
     */
    private Boolean nonUnique;
    
    /**
     * 인덱스 내 컬럼 순서
     */
    private Integer seqInIndex;
    
    /**
     * 인덱스 타입 (BTREE, HASH 등)
     */
    private String indexType;
}

