package com.coresolution.core.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 데이터베이스 스키마 컬럼 정보 모델
 * INFORMATION_SCHEMA에서 조회한 컬럼 정보
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchemaColumn {
    
    /**
     * 컬럼명
     */
    private String columnName;
    
    /**
     * 데이터 타입
     */
    private String dataType;
    
    /**
     * NULL 허용 여부
     */
    private Boolean isNullable;
    
    /**
     * 기본값
     */
    private String columnDefault;
    
    /**
     * 컬럼 키 타입 (PRI, UNI, MUL)
     */
    private String columnKey;
    
    /**
     * 컬럼 코멘트
     */
    private String columnComment;
    
    /**
     * 컬럼 순서
     */
    private Integer ordinalPosition;
    
    /**
     * 최대 길이 (VARCHAR, CHAR 등)
     */
    private Long characterMaximumLength;
    
    /**
     * 숫자 정밀도 (NUMERIC, DECIMAL 등)
     */
    private Integer numericPrecision;
    
    /**
     * 숫자 스케일 (NUMERIC, DECIMAL 등)
     */
    private Integer numericScale;
}

