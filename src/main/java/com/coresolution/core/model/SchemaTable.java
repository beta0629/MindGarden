package com.coresolution.core.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 데이터베이스 스키마 테이블 정보 모델
 * INFORMATION_SCHEMA에서 조회한 테이블 정보
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchemaTable {
    
    /**
     * 테이블명
     */
    private String tableName;
    
    /**
     * 테이블 코멘트
     */
    private String tableComment;
    
    /**
     * 컬럼 목록
     */
    @Builder.Default
    private List<SchemaColumn> columns = new ArrayList<>();
    
    /**
     * 인덱스 목록
     */
    @Builder.Default
    private List<SchemaIndex> indexes = new ArrayList<>();
    
    /**
     * 외래키 목록
     */
    @Builder.Default
    private List<SchemaForeignKey> foreignKeys = new ArrayList<>();
}

