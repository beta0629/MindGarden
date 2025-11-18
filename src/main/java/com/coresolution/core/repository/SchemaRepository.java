package com.coresolution.core.repository;

import com.coresolution.core.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 데이터베이스 스키마 정보 조회 Repository
 * INFORMATION_SCHEMA를 사용하여 스키마 정보를 조회
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Repository
@RequiredArgsConstructor
public class SchemaRepository {
    
    private final JdbcTemplate jdbcTemplate;
    
    /**
     * 테이블 목록 조회
     */
    public List<SchemaTable> getTables(String schemaName) {
        String sql = """
            SELECT 
                TABLE_NAME,
                TABLE_COMMENT
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = ?
                AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
            """;
        
        List<SchemaTable> tables = jdbcTemplate.query(sql, 
                (rs, rowNum) -> SchemaTable.builder()
                        .tableName(rs.getString("TABLE_NAME"))
                        .tableComment(rs.getString("TABLE_COMMENT"))
                        .build(),
                schemaName);
        
        // 각 테이블에 컬럼, 인덱스, 외래키 정보 추가
        for (SchemaTable table : tables) {
            table.setColumns(getColumns(schemaName, table.getTableName()));
            table.setIndexes(getIndexes(schemaName, table.getTableName()));
            table.setForeignKeys(getForeignKeys(schemaName, table.getTableName()));
        }
        
        return tables;
    }
    
    /**
     * 컬럼 정보 조회
     */
    public List<SchemaColumn> getColumns(String schemaName, String tableName) {
        String sql = """
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                IS_NULLABLE,
                COLUMN_DEFAULT,
                COLUMN_KEY,
                COLUMN_COMMENT,
                ORDINAL_POSITION,
                CHARACTER_MAXIMUM_LENGTH,
                NUMERIC_PRECISION,
                NUMERIC_SCALE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ?
                AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
            """;
        
        return jdbcTemplate.query(sql,
                (rs, rowNum) -> SchemaColumn.builder()
                        .columnName(rs.getString("COLUMN_NAME"))
                        .dataType(rs.getString("DATA_TYPE"))
                        .isNullable("YES".equals(rs.getString("IS_NULLABLE")))
                        .columnDefault(rs.getString("COLUMN_DEFAULT"))
                        .columnKey(rs.getString("COLUMN_KEY"))
                        .columnComment(rs.getString("COLUMN_COMMENT"))
                        .ordinalPosition(rs.getInt("ORDINAL_POSITION"))
                        .characterMaximumLength(rs.getLong("CHARACTER_MAXIMUM_LENGTH"))
                        .numericPrecision(rs.getObject("NUMERIC_PRECISION") != null ? 
                                rs.getInt("NUMERIC_PRECISION") : null)
                        .numericScale(rs.getObject("NUMERIC_SCALE") != null ? 
                                rs.getInt("NUMERIC_SCALE") : null)
                        .build(),
                schemaName, tableName);
    }
    
    /**
     * 인덱스 정보 조회
     */
    public List<SchemaIndex> getIndexes(String schemaName, String tableName) {
        String sql = """
            SELECT 
                INDEX_NAME,
                TABLE_NAME,
                COLUMN_NAME,
                NON_UNIQUE,
                SEQ_IN_INDEX,
                INDEX_TYPE
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = ?
                AND TABLE_NAME = ?
            ORDER BY INDEX_NAME, SEQ_IN_INDEX
            """;
        
        return jdbcTemplate.query(sql,
                (rs, rowNum) -> SchemaIndex.builder()
                        .indexName(rs.getString("INDEX_NAME"))
                        .tableName(rs.getString("TABLE_NAME"))
                        .columnName(rs.getString("COLUMN_NAME"))
                        .nonUnique(rs.getInt("NON_UNIQUE") == 1)
                        .seqInIndex(rs.getInt("SEQ_IN_INDEX"))
                        .indexType(rs.getString("INDEX_TYPE"))
                        .build(),
                schemaName, tableName);
    }
    
    /**
     * 외래키 정보 조회
     */
    public List<SchemaForeignKey> getForeignKeys(String schemaName, String tableName) {
        String sql = """
            SELECT 
                kcu.CONSTRAINT_NAME,
                kcu.TABLE_NAME,
                kcu.COLUMN_NAME,
                kcu.REFERENCED_TABLE_NAME,
                kcu.REFERENCED_COLUMN_NAME,
                rc.UPDATE_RULE,
                rc.DELETE_RULE
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
            LEFT JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
                ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
                AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
            WHERE kcu.TABLE_SCHEMA = ?
                AND kcu.TABLE_NAME = ?
                AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
            ORDER BY kcu.CONSTRAINT_NAME, kcu.ORDINAL_POSITION
            """;
        
        return jdbcTemplate.query(sql,
                (rs, rowNum) -> SchemaForeignKey.builder()
                        .constraintName(rs.getString("CONSTRAINT_NAME"))
                        .tableName(rs.getString("TABLE_NAME"))
                        .columnName(rs.getString("COLUMN_NAME"))
                        .referencedTableName(rs.getString("REFERENCED_TABLE_NAME"))
                        .referencedColumnName(rs.getString("REFERENCED_COLUMN_NAME"))
                        .updateRule(rs.getString("UPDATE_RULE"))
                        .deleteRule(rs.getString("DELETE_RULE"))
                        .build(),
                schemaName, tableName);
    }
    
    /**
     * 특정 테이블 정보 조회
     */
    public SchemaTable getTable(String schemaName, String tableName) {
        List<SchemaTable> tables = getTables(schemaName);
        return tables.stream()
                .filter(t -> t.getTableName().equals(tableName))
                .findFirst()
                .orElse(null);
    }
}

