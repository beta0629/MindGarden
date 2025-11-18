package com.coresolution.core.service.impl;

import com.coresolution.core.repository.ErdDiagramRepository;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.ErdChangeNotificationService;
import com.coresolution.core.service.ErdGenerationService;
import com.coresolution.core.service.SchemaChangeErdRegenerationService;
import com.coresolution.core.service.SchemaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 스키마 변경 시 ERD 자동 재생성 서비스 구현체
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SchemaChangeErdRegenerationServiceImpl implements SchemaChangeErdRegenerationService {

    private final SchemaService schemaService;
    private final ErdGenerationService erdGenerationService;
    private final TenantRepository tenantRepository;
    private final ErdDiagramRepository erdDiagramRepository;
    private final ErdChangeNotificationService erdChangeNotificationService;

    @Value("${spring.datasource.schema:core_solution}")
    private String defaultSchemaName;

    private static final String SYSTEM_USER = "system-schema-change";

    @Override
    public int detectAndRegenerateErds(String schemaName) {
        log.info("🔍 스키마 변경 감지 및 ERD 재생성 시작: schemaName={}", schemaName);

        String targetSchema = schemaName != null ? schemaName : defaultSchemaName;

        try {
            // 현재 스키마 정보 조회
            List<String> currentTables = schemaService.getAllTables(targetSchema).stream()
                    .map(table -> table.getTableName())
                    .sorted()
                    .collect(Collectors.toList());

            log.info("📊 현재 스키마 테이블 수: {}", currentTables.size());

            // TODO: 이전 스키마 스냅샷과 비교하여 변경사항 감지
            // 현재는 항상 재생성하도록 구현 (향후 스키마 스냅샷 비교 로직 추가)

            // 전체 시스템 ERD 재생성
            regenerateFullSystemErd(targetSchema);

            // 모든 활성 테넌트의 ERD 재생성
            int regeneratedCount = regenerateAllTenantErds(targetSchema);

            log.info("✅ 스키마 변경 감지 및 ERD 재생성 완료: 재생성된 ERD 수={}", regeneratedCount + 1);

            return regeneratedCount + 1; // 전체 시스템 ERD 포함

        } catch (Exception e) {
            log.error("❌ 스키마 변경 감지 및 ERD 재생성 실패: {}", e.getMessage(), e);
            throw new RuntimeException("스키마 변경 감지 및 ERD 재생성 실패", e);
        }
    }

    @Override
    public boolean regenerateTenantErd(String tenantId, String schemaName) {
        log.info("🔄 테넌트 ERD 재생성 시작: tenantId={}, schemaName={}", tenantId, schemaName);

        String targetSchema = schemaName != null ? schemaName : defaultSchemaName;

        try {
            // 기존 ERD 조회
            List<com.coresolution.core.domain.ErdDiagram> existingErds = 
                    erdDiagramRepository.findByTenantIdAndDiagramTypeAndIsActiveTrue(
                            tenantId, 
                            com.coresolution.core.domain.ErdDiagram.DiagramType.TENANT);

            // 기존 ERD가 있으면 재생성, 없으면 새로 생성
            if (!existingErds.isEmpty()) {
                for (com.coresolution.core.domain.ErdDiagram existingErd : existingErds) {
                    erdGenerationService.regenerateErd(
                            existingErd.getDiagramId(), 
                            targetSchema, 
                            SYSTEM_USER);
                }
                log.info("✅ 테넌트 ERD 재생성 완료: tenantId={}, 재생성된 ERD 수={}", 
                        tenantId, existingErds.size());
            } else {
                // 기존 ERD가 없으면 새로 생성
                erdGenerationService.generateTenantErd(tenantId, targetSchema, SYSTEM_USER);
                log.info("✅ 테넌트 ERD 생성 완료: tenantId={}", tenantId);
            }

            return true;

        } catch (Exception e) {
            log.error("❌ 테넌트 ERD 재생성 실패: tenantId={}, error={}", tenantId, e.getMessage(), e);
            return false;
        }
    }

    @Override
    public int regenerateAllTenantErds(String schemaName) {
        log.info("🔄 모든 활성 테넌트 ERD 재생성 시작: schemaName={}", schemaName);

        String targetSchema = schemaName != null ? schemaName : defaultSchemaName;

        List<String> activeTenantIds = tenantRepository.findAllActive().stream()
                .map(tenant -> tenant.getTenantId())
                .collect(Collectors.toList());

        log.info("📋 재생성 대상 테넌트 수: {}", activeTenantIds.size());

        int successCount = 0;
        int failureCount = 0;

        for (String tenantId : activeTenantIds) {
            if (regenerateTenantErd(tenantId, targetSchema)) {
                successCount++;
                
                // ERD 변경 알림 발송
                try {
                    var existingErds = erdDiagramRepository.findByTenantIdAndDiagramTypeAndIsActiveTrue(
                            tenantId, 
                            com.coresolution.core.domain.ErdDiagram.DiagramType.TENANT);
                    if (!existingErds.isEmpty()) {
                        var latestErd = existingErds.get(0);
                        erdChangeNotificationService.notifyErdChange(
                                tenantId,
                                latestErd.getDiagramId(),
                                "스키마 변경으로 인한 ERD 자동 재생성",
                                latestErd.getVersion()
                        );
                    }
                } catch (Exception e) {
                    log.warn("⚠️ ERD 변경 알림 발송 실패: tenantId={}, error={}", tenantId, e.getMessage());
                    // 알림 실패는 무시하고 계속 진행
                }
            } else {
                failureCount++;
            }
        }

        log.info("✅ 모든 활성 테넌트 ERD 재생성 완료 - 성공: {}, 실패: {}", successCount, failureCount);

        return successCount;
    }

    @Override
    public boolean regenerateFullSystemErd(String schemaName) {
        log.info("🔄 전체 시스템 ERD 재생성 시작: schemaName={}", schemaName);

        String targetSchema = schemaName != null ? schemaName : defaultSchemaName;

        try {
            // 기존 전체 시스템 ERD 조회
            List<com.coresolution.core.domain.ErdDiagram> existingErds = 
                    erdDiagramRepository.findByDiagramTypeAndIsActiveTrue(
                            com.coresolution.core.domain.ErdDiagram.DiagramType.FULL);

            if (!existingErds.isEmpty()) {
                // 기존 ERD가 있으면 재생성
                for (com.coresolution.core.domain.ErdDiagram existingErd : existingErds) {
                    erdGenerationService.regenerateErd(
                            existingErd.getDiagramId(), 
                            targetSchema, 
                            SYSTEM_USER);
                }
                log.info("✅ 전체 시스템 ERD 재생성 완료: 재생성된 ERD 수={}", existingErds.size());
            } else {
                // 기존 ERD가 없으면 새로 생성
                erdGenerationService.generateFullSystemErd(targetSchema, SYSTEM_USER);
                log.info("✅ 전체 시스템 ERD 생성 완료");
            }

            return true;

        } catch (Exception e) {
            log.error("❌ 전체 시스템 ERD 재생성 실패: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    public int regenerateErdsForChangedTables(List<String> changedTableNames, String schemaName) {
        log.info("🔄 변경된 테이블에 대한 ERD 재생성 시작: changedTables={}, schemaName={}", 
                changedTableNames, schemaName);

        String targetSchema = schemaName != null ? schemaName : defaultSchemaName;

        if (changedTableNames == null || changedTableNames.isEmpty()) {
            log.warn("⚠️ 변경된 테이블 목록이 비어있습니다.");
            return 0;
        }

        Set<String> affectedTenantIds = new HashSet<>();

        // 변경된 테이블이 tenant_id를 가지고 있는지 확인
        for (String tableName : changedTableNames) {
            try {
                var table = schemaService.getTable(targetSchema, tableName);
                
                // 테이블에 tenant_id 컬럼이 있는지 확인
                boolean hasTenantId = table.getColumns().stream()
                        .anyMatch(column -> "tenant_id".equalsIgnoreCase(column.getColumnName()));

                if (hasTenantId) {
                    // 이 테이블을 사용하는 모든 활성 테넌트의 ERD 재생성
                    List<String> tenantIds = tenantRepository.findAllActive().stream()
                            .map(tenant -> tenant.getTenantId())
                            .collect(Collectors.toList());
                    affectedTenantIds.addAll(tenantIds);
                }
            } catch (Exception e) {
                log.warn("⚠️ 테이블 정보 조회 실패: tableName={}, error={}", tableName, e.getMessage());
            }
        }

        // 전체 시스템 ERD도 재생성 (어떤 테이블이든 변경되면)
        regenerateFullSystemErd(targetSchema);

        // 영향받는 테넌트의 ERD 재생성
        int regeneratedCount = 0;
        for (String tenantId : affectedTenantIds) {
            if (regenerateTenantErd(tenantId, targetSchema)) {
                regeneratedCount++;
                
                // 스키마 변경 알림 발송
                try {
                    erdChangeNotificationService.notifySchemaChange(tenantId, changedTableNames);
                } catch (Exception e) {
                    log.warn("⚠️ 스키마 변경 알림 발송 실패: tenantId={}, error={}", tenantId, e.getMessage());
                }
            }
        }

        log.info("✅ 변경된 테이블에 대한 ERD 재생성 완료: 재생성된 ERD 수={}", regeneratedCount + 1);

        return regeneratedCount + 1; // 전체 시스템 ERD 포함
    }
}

