package com.coresolution.consultation.controller;

import java.util.Map;
import com.coresolution.consultation.service.PlSqlMappingSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PL/SQL 매핑 동기화 REST API 컨트롤러 (회기 5종 엔드포인트는 Phase 1 1A 폐기).
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/plsql-mapping-sync")
@RequiredArgsConstructor
public class PlSqlMappingSyncController {

    private final PlSqlMappingSyncService plSqlMappingSyncService;

    /**
     * PL/SQL 프로시저 사용 가능 여부 확인
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        log.info("🔍 PL/SQL 매핑 동기화 상태 확인");

        boolean isAvailable = plSqlMappingSyncService.isProcedureAvailable();

        Map<String, Object> response = Map.of(
            "plsqlAvailable", isAvailable,
            "message", isAvailable ? "PL/SQL 프로시저 사용 가능" : "PL/SQL 프로시저 사용 불가",
            "success", true,
            "timestamp", System.currentTimeMillis()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * 매핑 데이터 무결성 검증
     */
    @GetMapping("/validate/{mappingId}")
    public ResponseEntity<Map<String, Object>> validateMappingIntegrity(@PathVariable Long mappingId) {
        log.info("🔍 매핑 무결성 검증 요청: MappingID={}", mappingId);

        Map<String, Object> result = plSqlMappingSyncService.validateMappingIntegrity(mappingId);

        return ResponseEntity.ok(result);
    }

    /**
     * 전체 시스템 매핑 동기화
     */
    @PostMapping("/sync-all")
    public ResponseEntity<Map<String, Object>> syncAllMappings() {
        log.info("🔄 전체 매핑 동기화 요청");

        Map<String, Object> result = plSqlMappingSyncService.syncAllMappings();

        return ResponseEntity.ok(result);
    }

    /**
     * 환불 통계 조회
     */
    @GetMapping("/refund-statistics")
    public ResponseEntity<Map<String, Object>> getRefundStatistics(
            @RequestParam(required = false) String branchCode,
            @RequestParam String startDate,
            @RequestParam String endDate) {

        log.info("📊 환불 통계 조회 요청: BranchCode={}, Period={} ~ {}", branchCode, startDate, endDate);

        Map<String, Object> result = plSqlMappingSyncService.getRefundStatistics(
            branchCode, startDate, endDate
        );

        return ResponseEntity.ok(result);
    }
}
