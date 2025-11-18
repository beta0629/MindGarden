package com.coresolution.core.service.impl;

import com.coresolution.core.model.SchemaTable;
import com.coresolution.core.repository.SchemaRepository;
import com.coresolution.core.service.SchemaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 데이터베이스 스키마 조회 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class SchemaServiceImpl implements SchemaService {
    
    private final SchemaRepository schemaRepository;
    
    @Value("${spring.datasource.schema:core_solution}")
    private String defaultSchemaName;
    
    @Override
    public List<SchemaTable> getAllTables(String schemaName) {
        log.debug("모든 테이블 정보 조회: schemaName={}", schemaName);
        String targetSchema = schemaName != null ? schemaName : defaultSchemaName;
        return schemaRepository.getTables(targetSchema);
    }
    
    @Override
    public SchemaTable getTable(String schemaName, String tableName) {
        log.debug("특정 테이블 정보 조회: schemaName={}, tableName={}", schemaName, tableName);
        String targetSchema = schemaName != null ? schemaName : defaultSchemaName;
        return schemaRepository.getTable(targetSchema, tableName);
    }
    
    @Override
    public List<String> getTableNames(String schemaName) {
        log.debug("테이블 목록 조회: schemaName={}", schemaName);
        String targetSchema = schemaName != null ? schemaName : defaultSchemaName;
        List<SchemaTable> tables = schemaRepository.getTables(targetSchema);
        return tables.stream()
                .map(SchemaTable::getTableName)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<SchemaTable> getTenantTables(String schemaName, String tenantId) {
        log.debug("테넌트별 테이블 조회: schemaName={}, tenantId={}", schemaName, tenantId);
        String targetSchema = schemaName != null ? schemaName : defaultSchemaName;
        List<SchemaTable> allTables = schemaRepository.getTables(targetSchema);
        
        // tenant_id 컬럼이 있는 테이블만 필터링
        return allTables.stream()
                .filter(table -> table.getColumns().stream()
                        .anyMatch(column -> "tenant_id".equals(column.getColumnName())))
                .collect(Collectors.toList());
    }
    
    @Override
    public List<SchemaTable> getModuleTables(String schemaName, String modulePrefix) {
        log.debug("모듈별 테이블 조회: schemaName={}, modulePrefix={}", schemaName, modulePrefix);
        String targetSchema = schemaName != null ? schemaName : defaultSchemaName;
        List<SchemaTable> allTables = schemaRepository.getTables(targetSchema);
        
        // 테이블명이 모듈 접두사로 시작하는 테이블만 필터링
        return allTables.stream()
                .filter(table -> table.getTableName().toLowerCase().startsWith(modulePrefix.toLowerCase()))
                .collect(Collectors.toList());
    }
}

