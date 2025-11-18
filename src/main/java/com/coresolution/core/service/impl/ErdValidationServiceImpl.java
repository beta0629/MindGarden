package com.coresolution.core.service.impl;

import com.coresolution.core.domain.ErdDiagram;
import com.coresolution.core.dto.ErdValidationReport;
import com.coresolution.core.model.SchemaTable;
import com.coresolution.core.repository.ErdDiagramRepository;
import com.coresolution.core.service.ErdValidationService;
import com.coresolution.core.service.SchemaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * ERD 검증 서비스 구현체
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ErdValidationServiceImpl implements ErdValidationService {

    private final ErdDiagramRepository erdDiagramRepository;
    private final SchemaService schemaService;

    @Value("${spring.datasource.schema:core_solution}")
    private String defaultSchemaName;

    private static final String SYSTEM_VALIDATOR = "system-validator";

    @Override
    public ErdValidationReport validateErd(String diagramId, String schemaName) {
        log.info("ERD 검증 시작: diagramId={}, schemaName={}", diagramId, schemaName);

        ErdDiagram diagram = erdDiagramRepository.findByDiagramId(diagramId)
                .orElseThrow(() -> new IllegalArgumentException("ERD를 찾을 수 없습니다: " + diagramId));

        String targetSchema = schemaName != null ? schemaName : defaultSchemaName;

        // ERD에서 테이블 목록 추출
        List<String> erdTableNames = extractTableNamesFromMermaid(diagram.getMermaidCode());

        // 실제 스키마에서 테이블 목록 조회
        List<SchemaTable> schemaTables = getSchemaTablesForErd(diagram, targetSchema);
        List<String> schemaTableNames = schemaTables.stream()
                .map(SchemaTable::getTableName)
                .collect(Collectors.toList());

        // 검증 이슈 수집
        List<ErdValidationReport.ValidationIssue> issues = new ArrayList<>();

        // 누락된 테이블 검증
        Set<String> missingTables = new HashSet<>(schemaTableNames);
        missingTables.removeAll(erdTableNames);
        for (String tableName : missingTables) {
            issues.add(ErdValidationReport.ValidationIssue.builder()
                    .issueType(ErdValidationReport.ValidationIssue.IssueType.MISSING_TABLE)
                    .severity(ErdValidationReport.ValidationIssue.Severity.ERROR)
                    .description("ERD에 누락된 테이블: " + tableName)
                    .tableName(tableName)
                    .build());
        }

        // 추가된 테이블 검증 (ERD에는 있지만 스키마에는 없음)
        Set<String> extraTables = new HashSet<>(erdTableNames);
        extraTables.removeAll(schemaTableNames);
        for (String tableName : extraTables) {
            issues.add(ErdValidationReport.ValidationIssue.builder()
                    .issueType(ErdValidationReport.ValidationIssue.IssueType.EXTRA_TABLE)
                    .severity(ErdValidationReport.ValidationIssue.Severity.WARNING)
                    .description("ERD에 있지만 스키마에 없는 테이블: " + tableName)
                    .tableName(tableName)
                    .build());
        }

        // 테이블별 상세 검증 (일치하는 테이블에 대해서만)
        Set<String> matchedTables = new HashSet<>(erdTableNames);
        matchedTables.retainAll(schemaTableNames);
        for (String tableName : matchedTables) {
            validateTableDetails(tableName, diagram.getMermaidCode(), schemaTables, issues);
        }

        // 검증 통계 계산
        ErdValidationReport.ValidationStatistics statistics = calculateStatistics(
                erdTableNames.size(),
                schemaTableNames.size(),
                matchedTables.size(),
                missingTables.size(),
                extraTables.size(),
                issues
        );

        // 검증 상태 결정
        ErdValidationReport.ValidationStatus status = determineValidationStatus(issues);

        // 검증 리포트 생성
        ErdValidationReport report = ErdValidationReport.builder()
                .diagramId(diagramId)
                .tenantId(diagram.getTenantId())
                .erdName(diagram.getName())
                .status(status)
                .validatedAt(LocalDateTime.now())
                .validatedBy(SYSTEM_VALIDATOR)
                .summary(buildSummary(status, statistics, issues.size()))
                .issues(issues)
                .statistics(statistics)
                .build();

        log.info("ERD 검증 완료: diagramId={}, status={}, issues={}", 
                diagramId, status, issues.size());

        return report;
    }

    @Override
    public ErdValidationReport validateTenantErd(String tenantId, String schemaName) {
        log.info("테넌트 ERD 검증 시작: tenantId={}, schemaName={}", tenantId, schemaName);

        List<ErdDiagram> tenantErds = erdDiagramRepository.findByTenantIdAndDiagramTypeAndIsActiveTrue(
                tenantId, 
                ErdDiagram.DiagramType.TENANT);

        if (tenantErds.isEmpty()) {
            throw new IllegalArgumentException("테넌트 ERD를 찾을 수 없습니다: tenantId=" + tenantId);
        }

        // 가장 최신 ERD 검증
        ErdDiagram latestErd = tenantErds.get(0);
        return validateErd(latestErd.getDiagramId(), schemaName);
    }

    @Override
    public ErdValidationReport validateFullSystemErd(String schemaName) {
        log.info("전체 시스템 ERD 검증 시작: schemaName={}", schemaName);

        List<ErdDiagram> fullErds = erdDiagramRepository.findByDiagramTypeAndIsActiveTrue(
                ErdDiagram.DiagramType.FULL);

        if (fullErds.isEmpty()) {
            throw new IllegalArgumentException("전체 시스템 ERD를 찾을 수 없습니다");
        }

        // 가장 최신 ERD 검증
        ErdDiagram latestErd = fullErds.get(0);
        return validateErd(latestErd.getDiagramId(), schemaName);
    }

    @Override
    public List<ErdValidationReport> validateAllActiveErds(String schemaName) {
        log.info("모든 활성 ERD 검증 시작: schemaName={}", schemaName);

        List<ErdDiagram> activeErds = erdDiagramRepository.findAll().stream()
                .filter(ErdDiagram::getIsActive)
                .collect(Collectors.toList());

        List<ErdValidationReport> reports = new ArrayList<>();

        for (ErdDiagram erd : activeErds) {
            try {
                ErdValidationReport report = validateErd(erd.getDiagramId(), schemaName);
                reports.add(report);
            } catch (Exception e) {
                log.error("ERD 검증 실패: diagramId={}, error={}", erd.getDiagramId(), e.getMessage(), e);
            }
        }

        log.info("모든 활성 ERD 검증 완료: total={}, success={}", activeErds.size(), reports.size());

        return reports;
    }

    /**
     * ERD 타입에 따라 스키마 테이블 조회
     */
    private List<SchemaTable> getSchemaTablesForErd(ErdDiagram diagram, String schemaName) {
        switch (diagram.getDiagramType()) {
            case TENANT:
                return schemaService.getTenantTables(schemaName, diagram.getTenantId());
            case MODULE:
                String modulePrefix = getModulePrefix(diagram.getModuleType());
                return schemaService.getModuleTables(schemaName, modulePrefix);
            case FULL:
            default:
                return schemaService.getAllTables(schemaName);
        }
    }

    /**
     * Mermaid 코드에서 테이블 이름 추출
     */
    private List<String> extractTableNamesFromMermaid(String mermaidCode) {
        List<String> tableNames = new ArrayList<>();
        
        if (mermaidCode == null || mermaidCode.isEmpty()) {
            return tableNames;
        }

        // Mermaid ERD 형식: "TableName {" 형태로 테이블 정의
        String[] lines = mermaidCode.split("\n");
        for (String line : lines) {
            line = line.trim();
            if (line.contains("{") && !line.startsWith("erDiagram")) {
                // 테이블 이름 추출 (예: "    TableName {")
                String tableName = line.substring(0, line.indexOf("{")).trim();
                if (!tableName.isEmpty()) {
                    tableNames.add(tableName);
                }
            }
        }

        return tableNames;
    }

    /**
     * 테이블 상세 검증 (컬럼, 관계 등)
     */
    private void validateTableDetails(String tableName, String mermaidCode, 
                                     List<SchemaTable> schemaTables, 
                                     List<ErdValidationReport.ValidationIssue> issues) {
        // 실제 스키마에서 테이블 정보 조회
        SchemaTable schemaTable = schemaTables.stream()
                .filter(t -> t.getTableName().equals(tableName))
                .findFirst()
                .orElse(null);

        if (schemaTable == null) {
            return;
        }

        // Mermaid 코드에서 해당 테이블의 컬럼 정보 추출 (간단한 구현)
        // TODO: 더 정교한 Mermaid 파싱 로직 구현

        // 컬럼 검증 (간단한 구현)
        // 실제로는 Mermaid 코드를 파싱하여 컬럼 정보를 추출하고 비교해야 함
    }

    /**
     * 검증 통계 계산
     */
    private ErdValidationReport.ValidationStatistics calculateStatistics(
            int erdTableCount, int schemaTableCount, int matchedTableCount,
            int missingTableCount, int extraTableCount,
            List<ErdValidationReport.ValidationIssue> issues) {

        int errorCount = (int) issues.stream()
                .filter(i -> i.getSeverity() == ErdValidationReport.ValidationIssue.Severity.ERROR)
                .count();

        int warningCount = (int) issues.stream()
                .filter(i -> i.getSeverity() == ErdValidationReport.ValidationIssue.Severity.WARNING)
                .count();

        int infoCount = (int) issues.stream()
                .filter(i -> i.getSeverity() == ErdValidationReport.ValidationIssue.Severity.INFO)
                .count();

        return ErdValidationReport.ValidationStatistics.builder()
                .erdTableCount(erdTableCount)
                .schemaTableCount(schemaTableCount)
                .matchedTableCount(matchedTableCount)
                .missingTableCount(missingTableCount)
                .extraTableCount(extraTableCount)
                .totalIssueCount(issues.size())
                .errorCount(errorCount)
                .warningCount(warningCount)
                .infoCount(infoCount)
                .build();
    }

    /**
     * 검증 상태 결정
     */
    private ErdValidationReport.ValidationStatus determineValidationStatus(
            List<ErdValidationReport.ValidationIssue> issues) {
        
        boolean hasError = issues.stream()
                .anyMatch(i -> i.getSeverity() == ErdValidationReport.ValidationIssue.Severity.ERROR);

        boolean hasWarning = issues.stream()
                .anyMatch(i -> i.getSeverity() == ErdValidationReport.ValidationIssue.Severity.WARNING);

        if (hasError) {
            return ErdValidationReport.ValidationStatus.INVALID;
        } else if (hasWarning) {
            return ErdValidationReport.ValidationStatus.WARNING;
        } else {
            return ErdValidationReport.ValidationStatus.VALID;
        }
    }

    /**
     * 검증 요약 생성
     */
    private String buildSummary(ErdValidationReport.ValidationStatus status,
                               ErdValidationReport.ValidationStatistics statistics,
                               int issueCount) {
        if (status == ErdValidationReport.ValidationStatus.VALID) {
            return String.format("ERD가 스키마와 일치합니다. (테이블 수: %d)", 
                    statistics.getMatchedTableCount());
        } else {
            return String.format("ERD 검증 결과: %s 상태, 총 %d개의 이슈 발견 (오류: %d, 경고: %d)",
                    status.getDescription(), issueCount, statistics.getErrorCount(), statistics.getWarningCount());
        }
    }

    /**
     * 모듈 타입에 따른 테이블 접두사 가져오기
     */
    private String getModulePrefix(String moduleType) {
        if (moduleType == null) {
            return "";
        }

        switch (moduleType.toUpperCase()) {
            case "ACADEMY":
                return "academy_";
            case "FOOD_SERVICE":
                return "food_";
            case "CONSULTATION":
                return "consultation_";
            default:
                return moduleType.toLowerCase() + "_";
        }
    }
}

