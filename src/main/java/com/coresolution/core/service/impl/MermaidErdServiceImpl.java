package com.coresolution.core.service.impl;

import com.coresolution.core.model.SchemaColumn;
import com.coresolution.core.model.SchemaForeignKey;
import com.coresolution.core.model.SchemaTable;
import com.coresolution.core.service.MermaidErdService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mermaid ERD 생성 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
public class MermaidErdServiceImpl implements MermaidErdService {
    
    @Override
    public String generateMermaidErd(List<SchemaTable> tables) {
        log.debug("Mermaid ERD 생성 시작: 테이블 수={}", tables.size());
        
        StringBuilder mermaid = new StringBuilder();
        mermaid.append("erDiagram\n");
        
        // 테이블 정의
        for (SchemaTable table : tables) {
            mermaid.append("    ").append(table.getTableName()).append(" {\n");
            
            for (SchemaColumn column : table.getColumns()) {
                String dataType = formatDataType(column);
                String key = getKeyIndicator(column);
                String nullable = column.getIsNullable() ? "" : " NOT NULL";
                
                mermaid.append("        ")
                        .append(dataType).append(" ")
                        .append(column.getColumnName())
                        .append(key)
                        .append(nullable);
                
                if (column.getColumnComment() != null && !column.getColumnComment().isEmpty()) {
                    mermaid.append(" \"").append(escapeComment(column.getColumnComment())).append("\"");
                }
                
                mermaid.append("\n");
            }
            
            mermaid.append("    }\n");
        }
        
        // 관계 정의
        for (SchemaTable table : tables) {
            for (SchemaForeignKey fk : table.getForeignKeys()) {
                mermaid.append("    ")
                        .append(fk.getReferencedTableName())
                        .append(" ||--o{ ")
                        .append(fk.getTableName())
                        .append(" : \"")
                        .append(fk.getConstraintName())
                        .append("\"\n");
            }
        }
        
        log.debug("Mermaid ERD 생성 완료: 길이={}", mermaid.length());
        return mermaid.toString();
    }
    
    @Override
    public String generateTextErd(List<SchemaTable> tables) {
        log.debug("텍스트 ERD 생성 시작: 테이블 수={}", tables.size());
        
        StringBuilder text = new StringBuilder();
        text.append("=== ERD (텍스트 형식) ===\n\n");
        
        for (SchemaTable table : tables) {
            text.append("테이블: ").append(table.getTableName()).append("\n");
            if (table.getTableComment() != null && !table.getTableComment().isEmpty()) {
                text.append("설명: ").append(table.getTableComment()).append("\n");
            }
            text.append("컬럼:\n");
            
            for (SchemaColumn column : table.getColumns()) {
                String key = getKeyIndicator(column);
                String nullable = column.getIsNullable() ? "NULL" : "NOT NULL";
                
                text.append("  - ")
                        .append(column.getColumnName())
                        .append(" (").append(column.getDataType()).append(")")
                        .append(key)
                        .append(" ").append(nullable);
                
                if (column.getColumnComment() != null && !column.getColumnComment().isEmpty()) {
                    text.append(" - ").append(column.getColumnComment());
                }
                
                text.append("\n");
            }
            
            // 외래키 관계
            if (!table.getForeignKeys().isEmpty()) {
                text.append("외래키 관계:\n");
                for (SchemaForeignKey fk : table.getForeignKeys()) {
                    text.append("  - ")
                            .append(fk.getColumnName())
                            .append(" -> ")
                            .append(fk.getReferencedTableName())
                            .append(".")
                            .append(fk.getReferencedColumnName())
                            .append("\n");
                }
            }
            
            text.append("\n");
        }
        
        log.debug("텍스트 ERD 생성 완료: 길이={}", text.length());
        return text.toString();
    }
    
    @Override
    public String generateMermaidErdForTables(List<SchemaTable> tables, List<String> tableNames) {
        log.debug("특정 테이블만 포함하는 Mermaid ERD 생성: 테이블 수={}, 포함할 테이블={}", 
                tables.size(), tableNames);
        
        // 포함할 테이블만 필터링
        List<SchemaTable> filteredTables = tables.stream()
                .filter(table -> tableNames.contains(table.getTableName()))
                .collect(Collectors.toList());
        
        // 포함된 테이블과 관련된 외래키만 포함
        for (SchemaTable table : filteredTables) {
            List<SchemaForeignKey> relevantFks = table.getForeignKeys().stream()
                    .filter(fk -> tableNames.contains(fk.getReferencedTableName()) || 
                                 tableNames.contains(fk.getTableName()))
                    .collect(Collectors.toList());
            table.setForeignKeys(relevantFks);
        }
        
        return generateMermaidErd(filteredTables);
    }
    
    /**
     * 데이터 타입 포맷팅
     */
    private String formatDataType(SchemaColumn column) {
        String dataType = column.getDataType().toUpperCase();
        
        // VARCHAR, CHAR 등 길이 정보 포함
        if (column.getCharacterMaximumLength() != null) {
            return dataType + "(" + column.getCharacterMaximumLength() + ")";
        }
        
        // NUMERIC, DECIMAL 등 정밀도 정보 포함
        if (column.getNumericPrecision() != null) {
            if (column.getNumericScale() != null && column.getNumericScale() > 0) {
                return dataType + "(" + column.getNumericPrecision() + "," + column.getNumericScale() + ")";
            }
            return dataType + "(" + column.getNumericPrecision() + ")";
        }
        
        return dataType;
    }
    
    /**
     * 키 표시자 가져오기
     */
    private String getKeyIndicator(SchemaColumn column) {
        if (column.getColumnKey() != null) {
            if ("PRI".equals(column.getColumnKey())) {
                return " PK";
            } else if ("UNI".equals(column.getColumnKey())) {
                return " UK";
            } else if ("MUL".equals(column.getColumnKey())) {
                return " FK";
            }
        }
        return "";
    }
    
    /**
     * 코멘트 이스케이프 처리
     */
    private String escapeComment(String comment) {
        if (comment == null) {
            return "";
        }
        return comment.replace("\"", "\\\"").replace("\n", " ");
    }
}

