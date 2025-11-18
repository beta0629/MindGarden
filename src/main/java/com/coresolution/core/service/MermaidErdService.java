package com.coresolution.core.service;

import com.coresolution.core.model.SchemaTable;

import java.util.List;

/**
 * Mermaid ERD 생성 서비스 인터페이스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface MermaidErdService {
    
    /**
     * Mermaid ERD 코드 생성
     * 
     * @param tables 테이블 목록
     * @return Mermaid ERD 코드
     */
    String generateMermaidErd(List<SchemaTable> tables);
    
    /**
     * 텍스트 ERD 생성
     * 
     * @param tables 테이블 목록
     * @return 텍스트 ERD
     */
    String generateTextErd(List<SchemaTable> tables);
    
    /**
     * 특정 테이블만 포함하는 Mermaid ERD 생성
     * 
     * @param tables 전체 테이블 목록
     * @param tableNames 포함할 테이블명 목록
     * @return Mermaid ERD 코드
     */
    String generateMermaidErdForTables(List<SchemaTable> tables, List<String> tableNames);
}

