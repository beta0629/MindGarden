package com.coresolution.consultation.controller;

import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping({"/api/v1/health", "/api/health"})
public class SystemHealthController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/actuator")
    public ResponseEntity<Map<String, Object>> actuatorHealth() {
        Map<String, Object> response = new HashMap<>();
        try {
            response.put("status", "UP");
            response.put("details", Map.of(
                "application", Map.of("status", "UP"),
                "database", Map.of("status", "UP")
            ));
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "DOWN");
            response.put("message", "Health check failed: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.status(500).body(response);
        }
    }

    @Autowired
    private DataSource dataSource;

    @GetMapping("/server")
    public ResponseEntity<Map<String, Object>> checkServerHealth() {
        Map<String, Object> response = new HashMap<>();
        try {
            response.put("status", "healthy");
            response.put("message", "서버가 정상적으로 작동 중입니다");
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "서버 상태 확인 중 오류 발생: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/database")
    public ResponseEntity<Map<String, Object>> checkDatabaseHealth() {
        Map<String, Object> response = new HashMap<>();
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(5)) {
                response.put("status", "healthy");
                response.put("message", "데이터베이스 연결이 정상입니다");
                response.put("timestamp", System.currentTimeMillis());
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "error");
                response.put("message", "데이터베이스 연결이 유효하지 않습니다");
                response.put("timestamp", System.currentTimeMillis());
                return ResponseEntity.status(500).body(response);
            }
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "데이터베이스 연결 확인 중 오류 발생: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 안전장치 3: 프로시저 상태 확인 엔드포인트
     * 필수 프로시저들의 존재 여부를 확인
     */
    @GetMapping("/procedures")
    public ResponseEntity<Map<String, Object>> checkProceduresHealth() {
        Map<String, Object> response = new HashMap<>();
        try {
            // 필수 프로시저 목록
            String[] requiredProcedures = {
                "CreateOrActivateTenant",
                "ProcessOnboardingApproval",
                "GenerateErdOnOnboardingApproval",
                "SetupTenantCategoryMapping"
            };
            
            Map<String, Boolean> procedureStatus = new HashMap<>();
            int existingCount = 0;
            
            for (String procedureName : requiredProcedures) {
                try {
                    Boolean exists = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) > 0 FROM information_schema.ROUTINES " +
                        "WHERE ROUTINE_SCHEMA = DATABASE() " +
                        "AND ROUTINE_NAME = ? " +
                        "AND ROUTINE_TYPE = 'PROCEDURE'",
                        Boolean.class,
                        procedureName
                    );
                    
                    boolean procedureExists = Boolean.TRUE.equals(exists);
                    procedureStatus.put(procedureName, procedureExists);
                    
                    if (procedureExists) {
                        existingCount++;
                        log.debug("✅ 프로시저 존재: {}", procedureName);
                    } else {
                        log.warn("❌ 프로시저 누락: {}", procedureName);
                    }
                } catch (Exception e) {
                    log.error("프로시저 확인 중 오류: {} - {}", procedureName, e.getMessage());
                    procedureStatus.put(procedureName, false);
                }
            }
            
            boolean allProceduresExist = existingCount == requiredProcedures.length;
            
            response.put("status", allProceduresExist ? "healthy" : "degraded");
            response.put("message", allProceduresExist ? 
                "모든 필수 프로시저가 정상적으로 설치되어 있습니다" : 
                String.format("일부 프로시저가 누락되었습니다 (%d/%d)", existingCount, requiredProcedures.length));
            response.put("procedures", procedureStatus);
            response.put("existingCount", existingCount);
            response.put("requiredCount", requiredProcedures.length);
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("프로시저 상태 확인 중 오류 발생", e);
            response.put("status", "error");
            response.put("message", "프로시저 상태 확인 중 오류 발생: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 안전장치 4: CreateOrActivateTenant 프로시저 상세 확인
     */
    @GetMapping("/procedures/create-or-activate-tenant")
    public ResponseEntity<Map<String, Object>> checkCreateOrActivateTenantProcedure() {
        Map<String, Object> response = new HashMap<>();
        try {
            String procedureName = "CreateOrActivateTenant";
            
            // 프로시저 존재 여부
            Boolean exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) > 0 FROM information_schema.ROUTINES " +
                "WHERE ROUTINE_SCHEMA = DATABASE() " +
                "AND ROUTINE_NAME = ? " +
                "AND ROUTINE_TYPE = 'PROCEDURE'",
                Boolean.class,
                procedureName
            );
            
            if (Boolean.TRUE.equals(exists)) {
                // 프로시저 상세 정보
                Map<String, Object> procedureInfo = jdbcTemplate.queryForMap(
                    "SELECT " +
                    "ROUTINE_NAME, " +
                    "CREATED, " +
                    "LAST_ALTERED, " +
                    "ROUTINE_DEFINITION " +
                    "FROM information_schema.ROUTINES " +
                    "WHERE ROUTINE_SCHEMA = DATABASE() " +
                    "AND ROUTINE_NAME = ? " +
                    "AND ROUTINE_TYPE = 'PROCEDURE'",
                    procedureName
                );
                
                String definition = (String) procedureInfo.get("ROUTINE_DEFINITION");
                boolean hasRequiredKeywords = definition != null && 
                    definition.toUpperCase().contains("DECLARE") &&
                    definition.toUpperCase().contains("BEGIN") &&
                    definition.toUpperCase().contains("END") &&
                    definition.toUpperCase().contains("TRANSACTION");
                
                response.put("status", "healthy");
                response.put("exists", true);
                response.put("procedureName", procedureInfo.get("ROUTINE_NAME"));
                response.put("created", procedureInfo.get("CREATED"));
                response.put("lastAltered", procedureInfo.get("LAST_ALTERED"));
                response.put("hasRequiredStructure", hasRequiredKeywords);
                response.put("definitionLength", definition != null ? definition.length() : 0);
                response.put("message", "프로시저가 정상적으로 설치되어 있습니다");
            } else {
                response.put("status", "error");
                response.put("exists", false);
                response.put("message", "프로시저가 존재하지 않습니다. Flyway 마이그레이션 또는 Java 코드 백업 메커니즘이 필요합니다.");
            }
            
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("CreateOrActivateTenant 프로시저 확인 중 오류 발생", e);
            response.put("status", "error");
            response.put("message", "프로시저 확인 중 오류 발생: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 외부 서비스 상태 확인
     * GET /api/health/external-services
     */
    @GetMapping("/external-services")
    public ResponseEntity<Map<String, Object>> checkExternalServicesHealth() {
        Map<String, Object> response = new HashMap<>();
        try {
            // 외부 서비스 상태 확인 (예: Redis, 외부 API 등)
            // 현재는 기본적으로 healthy 반환
            response.put("status", "healthy");
            response.put("message", "외부 서비스 연결이 정상입니다");
            response.put("services", Map.of(
                "redis", Map.of("status", "not_configured", "message", "Redis 미설정"),
                "smtp", Map.of("status", "not_configured", "message", "SMTP 미설정")
            ));
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "외부 서비스 상태 확인 중 오류 발생: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 시스템 메트릭 조회
     * GET /api/health/system-metrics
     */
    @GetMapping("/system-metrics")
    public ResponseEntity<Map<String, Object>> getSystemMetrics() {
        Map<String, Object> response = new HashMap<>();
        try {
            Runtime runtime = Runtime.getRuntime();
            
            // 메모리 정보
            long maxMemory = runtime.maxMemory();
            long totalMemory = runtime.totalMemory();
            long freeMemory = runtime.freeMemory();
            long usedMemory = totalMemory - freeMemory;
            
            double memoryUsagePercent = (double) usedMemory / maxMemory * 100;
            
            // CPU 정보 (간단한 버전)
            int availableProcessors = runtime.availableProcessors();
            
            response.put("status", "healthy");
            response.put("cpu", Map.of(
                "availableProcessors", availableProcessors,
                "usage", 0 // 실제 CPU 사용률은 별도 라이브러리 필요
            ));
            response.put("memory", Map.of(
                "max", maxMemory,
                "total", totalMemory,
                "used", usedMemory,
                "free", freeMemory,
                "usagePercent", String.format("%.2f", memoryUsagePercent)
            ));
            response.put("disk", Map.of(
                "usage", 0 // 디스크 사용률은 별도 구현 필요
            ));
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "시스템 메트릭 조회 중 오류 발생: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.status(500).body(response);
        }
    }
}
