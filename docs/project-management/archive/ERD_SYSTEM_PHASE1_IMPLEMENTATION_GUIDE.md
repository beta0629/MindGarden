# ERD 시스템 고도화 Phase 1 구현 가이드

**작성일:** 2025-01-XX  
**목표:** 데이터베이스 스키마에서 ERD 자동 생성 시스템 구현

## 1. 개요

### 1.1 목표
- 데이터베이스 스키마 정보를 조회하여 ERD 자동 생성
- Mermaid ERD 다이어그램 자동 생성
- ERD 파일 자동 저장 및 버전 관리

### 1.2 작업 범위
- ERD 생성 유틸리티 클래스 개발
- 데이터베이스 스키마 정보 조회
- Mermaid ERD 다이어그램 생성
- ERD 파일 저장 및 버전 관리

## 2. 기술 스택

- **Backend**: Java (Spring Boot)
- **Database**: MySQL `INFORMATION_SCHEMA`
- **ERD 생성**: Mermaid 다이어그램 형식
- **파일 관리**: Git (버전 관리)

## 3. 데이터베이스 스키마 조회

### 3.1 INFORMATION_SCHEMA 쿼리

```sql
-- 테이블 목록 조회
SELECT 
    TABLE_NAME,
    TABLE_COMMENT
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = ?
    AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- 컬럼 정보 조회
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_KEY,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = ?
    AND TABLE_NAME = ?
ORDER BY ORDINAL_POSITION;

-- 외래키 정보 조회
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = ?
    AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- 인덱스 정보 조회
SELECT 
    INDEX_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    NON_UNIQUE,
    SEQ_IN_INDEX
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = ?
    AND TABLE_NAME = ?
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
```

## 4. Java 구현

### 4.1 엔티티 클래스

```java
package com.mindgarden.erd.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * ERD 테이블 정보
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErdTable {
    private String name;
    private String comment;
    private List<ErdColumn> columns = new ArrayList<>();
    private List<ErdForeignKey> foreignKeys = new ArrayList<>();
    private List<ErdIndex> indexes = new ArrayList<>();
}

/**
 * ERD 컬럼 정보
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErdColumn {
    private String name;
    private String dataType;
    private boolean nullable;
    private String defaultValue;
    private boolean isPrimaryKey;
    private String comment;
}

/**
 * ERD 외래키 정보
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErdForeignKey {
    private String constraintName;
    private String tableName;
    private String columnName;
    private String referencedTableName;
    private String referencedColumnName;
}

/**
 * ERD 인덱스 정보
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErdIndex {
    private String name;
    private String tableName;
    private List<String> columns = new ArrayList<>();
    private boolean unique;
}
```

### 4.2 스키마 조회 서비스

```java
package com.mindgarden.erd.service;

import com.mindgarden.erd.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SchemaReaderService {
    
    private final JdbcTemplate jdbcTemplate;
    
    @Value("${spring.datasource.url}")
    private String datasourceUrl;
    
    /**
     * 데이터베이스 이름 추출
     */
    private String extractDatabaseName() {
        // jdbc:mysql://host:port/database?...
        String[] parts = datasourceUrl.split("/");
        if (parts.length > 3) {
            String dbPart = parts[3].split("\\?")[0];
            return dbPart;
        }
        throw new IllegalArgumentException("데이터베이스 이름을 추출할 수 없습니다: " + datasourceUrl);
    }
    
    /**
     * 모든 테이블 정보 조회
     */
    public List<ErdTable> getAllTables() {
        String databaseName = extractDatabaseName();
        log.info("데이터베이스 스키마 조회 시작: {}", databaseName);
        
        List<String> tableNames = getTableNames(databaseName);
        List<ErdTable> tables = new ArrayList<>();
        
        for (String tableName : tableNames) {
            ErdTable table = getTableInfo(databaseName, tableName);
            tables.add(table);
        }
        
        log.info("테이블 정보 조회 완료: {}개", tables.size());
        return tables;
    }
    
    /**
     * 테이블 목록 조회
     */
    private List<String> getTableNames(String databaseName) {
        String sql = """
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = ?
                AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
            """;
        
        return jdbcTemplate.queryForList(sql, String.class, databaseName);
    }
    
    /**
     * 테이블 상세 정보 조회
     */
    private ErdTable getTableInfo(String databaseName, String tableName) {
        ErdTable.ErdTableBuilder builder = ErdTable.builder()
            .name(tableName);
        
        // 테이블 코멘트 조회
        String commentSql = """
            SELECT TABLE_COMMENT
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            """;
        String comment = jdbcTemplate.queryForObject(commentSql, String.class, databaseName, tableName);
        builder.comment(comment != null ? comment : "");
        
        // 컬럼 정보 조회
        List<ErdColumn> columns = getColumns(databaseName, tableName);
        builder.columns(columns);
        
        // 외래키 정보 조회
        List<ErdForeignKey> foreignKeys = getForeignKeys(databaseName, tableName);
        builder.foreignKeys(foreignKeys);
        
        // 인덱스 정보 조회
        List<ErdIndex> indexes = getIndexes(databaseName, tableName);
        builder.indexes(indexes);
        
        return builder.build();
    }
    
    /**
     * 컬럼 정보 조회
     */
    private List<ErdColumn> getColumns(String databaseName, String tableName) {
        String sql = """
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                IS_NULLABLE,
                COLUMN_DEFAULT,
                COLUMN_KEY,
                COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
            """;
        
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            String columnKey = rs.getString("COLUMN_KEY");
            boolean isPrimaryKey = "PRI".equals(columnKey);
            
            return ErdColumn.builder()
                .name(rs.getString("COLUMN_NAME"))
                .dataType(rs.getString("DATA_TYPE"))
                .nullable("YES".equals(rs.getString("IS_NULLABLE")))
                .defaultValue(rs.getString("COLUMN_DEFAULT"))
                .isPrimaryKey(isPrimaryKey)
                .comment(rs.getString("COLUMN_COMMENT"))
                .build();
        }, databaseName, tableName);
    }
    
    /**
     * 외래키 정보 조회
     */
    private List<ErdForeignKey> getForeignKeys(String databaseName, String tableName) {
        String sql = """
            SELECT 
                CONSTRAINT_NAME,
                TABLE_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
                AND TABLE_NAME = ?
                AND REFERENCED_TABLE_NAME IS NOT NULL
            ORDER BY CONSTRAINT_NAME
            """;
        
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            return ErdForeignKey.builder()
                .constraintName(rs.getString("CONSTRAINT_NAME"))
                .tableName(rs.getString("TABLE_NAME"))
                .columnName(rs.getString("COLUMN_NAME"))
                .referencedTableName(rs.getString("REFERENCED_TABLE_NAME"))
                .referencedColumnName(rs.getString("REFERENCED_COLUMN_NAME"))
                .build();
        }, databaseName, tableName);
    }
    
    /**
     * 인덱스 정보 조회
     */
    private List<ErdIndex> getIndexes(String databaseName, String tableName) {
        String sql = """
            SELECT 
                INDEX_NAME,
                COLUMN_NAME,
                NON_UNIQUE,
                SEQ_IN_INDEX
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY INDEX_NAME, SEQ_IN_INDEX
            """;
        
        Map<String, ErdIndex> indexMap = new HashMap<>();
        
        jdbcTemplate.query(sql, (rs, rowNum) -> {
            String indexName = rs.getString("INDEX_NAME");
            String columnName = rs.getString("COLUMN_NAME");
            boolean unique = rs.getInt("NON_UNIQUE") == 0;
            
            ErdIndex index = indexMap.computeIfAbsent(indexName, name -> {
                ErdIndex.ErdIndexBuilder builder = ErdIndex.builder()
                    .name(name)
                    .tableName(tableName)
                    .unique(unique);
                return builder.build();
            });
            
            index.getColumns().add(columnName);
            return null;
        }, databaseName, tableName);
        
        return new ArrayList<>(indexMap.values());
    }
}
```

### 4.3 Mermaid ERD 생성 서비스

```java
package com.mindgarden.erd.service;

import com.mindgarden.erd.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MermaidErdGeneratorService {
    
    /**
     * 전체 시스템 ERD 생성
     */
    public String generateFullSystemErd(List<ErdTable> tables) {
        log.info("전체 시스템 ERD 생성 시작: {}개 테이블", tables.size());
        
        StringBuilder mermaid = new StringBuilder();
        mermaid.append("erDiagram\n");
        
        // 테이블 정의
        for (ErdTable table : tables) {
            appendTableDefinition(mermaid, table);
        }
        
        mermaid.append("\n");
        
        // 관계 정의
        Set<String> relationships = new HashSet<>();
        for (ErdTable table : tables) {
            for (ErdForeignKey fk : table.getForeignKeys()) {
                String relationship = generateRelationship(fk);
                if (!relationships.contains(relationship)) {
                    mermaid.append("    ").append(relationship).append("\n");
                    relationships.add(relationship);
                }
            }
        }
        
        // 테이블 속성 정의
        mermaid.append("\n");
        for (ErdTable table : tables) {
            appendTableAttributes(mermaid, table);
        }
        
        log.info("전체 시스템 ERD 생성 완료");
        return mermaid.toString();
    }
    
    /**
     * 테이블 정의 추가
     */
    private void appendTableDefinition(StringBuilder mermaid, ErdTable table) {
        // 테이블명을 대문자로 변환 (Mermaid 스타일)
        String tableName = table.getName().toUpperCase();
        mermaid.append("    ").append(tableName).append(" {\n");
        
        // PK 컬럼 먼저 추가
        List<ErdColumn> pkColumns = table.getColumns().stream()
            .filter(ErdColumn::isPrimaryKey)
            .collect(Collectors.toList());
        
        for (ErdColumn column : pkColumns) {
            String columnDef = formatColumn(column, true);
            mermaid.append("        ").append(columnDef).append("\n");
        }
        
        // 일반 컬럼 추가
        List<ErdColumn> normalColumns = table.getColumns().stream()
            .filter(c -> !c.isPrimaryKey())
            .limit(10) // 너무 많은 컬럼은 제한
            .collect(Collectors.toList());
        
        for (ErdColumn column : normalColumns) {
            String columnDef = formatColumn(column, false);
            mermaid.append("        ").append(columnDef).append("\n");
        }
        
        if (table.getColumns().size() > pkColumns.size() + normalColumns.size()) {
            mermaid.append("        ...\n");
        }
        
        mermaid.append("    }\n");
    }
    
    /**
     * 컬럼 포맷팅
     */
    private String formatColumn(ErdColumn column, boolean isPrimaryKey) {
        StringBuilder sb = new StringBuilder();
        
        // 데이터 타입 간소화
        String dataType = simplifyDataType(column.getDataType());
        
        // PK 표시
        if (isPrimaryKey) {
            sb.append(dataType).append(" ").append(column.getName()).append(" PK");
        } else {
            sb.append(dataType).append(" ").append(column.getName());
            if (!column.isNullable()) {
                sb.append(" \"NOT NULL\"");
            }
        }
        
        return sb.toString();
    }
    
    /**
     * 데이터 타입 간소화
     */
    private String simplifyDataType(String dataType) {
        if (dataType == null) return "VARCHAR";
        
        String upper = dataType.toUpperCase();
        if (upper.contains("INT")) return "INT";
        if (upper.contains("VARCHAR") || upper.contains("CHAR")) return "VARCHAR";
        if (upper.contains("TEXT")) return "TEXT";
        if (upper.contains("DECIMAL") || upper.contains("NUMERIC")) return "DECIMAL";
        if (upper.contains("TIMESTAMP") || upper.contains("DATETIME")) return "TIMESTAMP";
        if (upper.contains("DATE")) return "DATE";
        if (upper.contains("BOOLEAN") || upper.contains("BIT")) return "BOOLEAN";
        if (upper.contains("JSON")) return "JSON";
        
        return "VARCHAR";
    }
    
    /**
     * 관계 생성
     */
    private String generateRelationship(ErdForeignKey fk) {
        String refTable = fk.getReferencedTableName().toUpperCase();
        String table = fk.getTableName().toUpperCase();
        
        // 관계 타입 결정 (1:1, 1:N, N:M)
        // 간단하게 1:N으로 가정
        return refTable + " ||--o{ " + table + " : \"has\"";
    }
    
    /**
     * 테이블 속성 정의
     */
    private void appendTableAttributes(StringBuilder mermaid, ErdTable table) {
        String tableName = table.getName().toUpperCase();
        mermaid.append("    ").append(tableName).append(" {\n");
        
        // 주요 컬럼만 표시
        for (ErdColumn column : table.getColumns()) {
            String columnDef = formatColumn(column, column.isPrimaryKey());
            mermaid.append("        ").append(columnDef).append("\n");
        }
        
        mermaid.append("    }\n");
    }
}
```

### 4.4 ERD 파일 저장 서비스

```java
package com.mindgarden.erd.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class ErdFileService {
    
    @Value("${erd.output.directory:docs/mgsb/erd}")
    private String outputDirectory;
    
    /**
     * ERD 파일 저장
     */
    public void saveErdFile(String erdType, String mermaidCode) throws IOException {
        Path outputPath = Paths.get(outputDirectory);
        if (!Files.exists(outputPath)) {
            Files.createDirectories(outputPath);
        }
        
        String fileName = String.format("erd_%s_%s.md", 
            erdType.toLowerCase(),
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")));
        
        Path filePath = outputPath.resolve(fileName);
        
        // 마크다운 파일 생성
        StringBuilder content = new StringBuilder();
        content.append("# ERD - ").append(erdType).append("\n\n");
        content.append("**생성일:** ").append(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)).append("\n\n");
        content.append("## Mermaid ERD\n\n");
        content.append("```mermaid\n");
        content.append(mermaidCode);
        content.append("```\n");
        
        Files.writeString(filePath, content.toString());
        
        log.info("ERD 파일 저장 완료: {}", filePath);
    }
    
    /**
     * 최신 ERD 파일 경로 반환
     */
    public Path getLatestErdFile(String erdType) {
        // 구현 생략 (파일 시스템에서 최신 파일 찾기)
        return null;
    }
}
```

### 4.5 ERD 생성 컨트롤러

```java
package com.mindgarden.erd.controller;

import com.mindgarden.erd.model.ErdTable;
import com.mindgarden.erd.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/erd")
@RequiredArgsConstructor
public class ErdController {
    
    private final SchemaReaderService schemaReaderService;
    private final MermaidErdGeneratorService mermaidErdGeneratorService;
    private final ErdFileService erdFileService;
    
    /**
     * ERD 생성
     */
    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateErd(
            @RequestParam(defaultValue = "FULL") String erdType) {
        try {
            // 1. 스키마 정보 조회
            List<ErdTable> tables = schemaReaderService.getAllTables();
            
            // 2. Mermaid ERD 생성
            String mermaidCode = mermaidErdGeneratorService.generateFullSystemErd(tables);
            
            // 3. 파일 저장
            erdFileService.saveErdFile(erdType, mermaidCode);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("erdType", erdType);
            response.put("tableCount", tables.size());
            response.put("message", "ERD 생성 완료");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ERD 생성 실패", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "ERD 생성 실패: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
```

## 5. 설정 파일

### 5.1 application.yml

```yaml
erd:
  output:
    directory: docs/mgsb/erd
  generation:
    enabled: true
    schedule: "0 0 2 * * ?" # 매일 새벽 2시
```

## 6. 스케줄러 설정 (선택사항)

```java
package com.mindgarden.erd.scheduler;

import com.mindgarden.erd.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ErdGenerationScheduler {
    
    private final SchemaReaderService schemaReaderService;
    private final MermaidErdGeneratorService mermaidErdGeneratorService;
    private final ErdFileService erdFileService;
    
    @Scheduled(cron = "${erd.generation.schedule:0 0 2 * * ?}")
    public void generateErdScheduled() {
        log.info("스케줄러: ERD 자동 생성 시작");
        try {
            // ERD 생성 로직
            // ...
        } catch (Exception e) {
            log.error("ERD 자동 생성 실패", e);
        }
    }
}
```

## 7. 테스트 계획

### 7.1 단위 테스트

```java
package com.mindgarden.erd.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class SchemaReaderServiceTest {
    
    @Autowired
    private SchemaReaderService schemaReaderService;
    
    @Test
    void testGetAllTables() {
        List<ErdTable> tables = schemaReaderService.getAllTables();
        assertNotNull(tables);
        assertTrue(tables.size() > 0);
    }
}
```

### 7.2 통합 테스트

- ERD 생성 API 테스트
- 생성된 ERD 파일 검증
- Mermaid 다이어그램 형식 검증

## 8. 체크리스트

- [ ] `SchemaReaderService` 구현
- [ ] `MermaidErdGeneratorService` 구현
- [ ] `ErdFileService` 구현
- [ ] `ErdController` 구현
- [ ] 설정 파일 추가
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] ERD 생성 API 테스트
- [ ] 생성된 ERD 파일 검증
- [ ] 문서화

## 9. 다음 단계

Phase 1 완료 후:
- Phase 2: ERD 관리 대시보드 구축
- Phase 3: ERD 자동 동기화 시스템 구현

