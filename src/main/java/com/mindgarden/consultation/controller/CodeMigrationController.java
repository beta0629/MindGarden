package com.mindgarden.consultation.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mindgarden.consultation.service.CodeMigrationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 코드 마이그레이션 컨트롤러
 * code_groups + code_values 테이블의 데이터를 common_codes 테이블로 마이그레이션
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-09
 */
@Slf4j
// @RestController  // 마이그레이션 완료로 인해 비활성화
@RequestMapping("/api/admin/code-migration")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CodeMigrationController {
    
    private final CodeMigrationService codeMigrationService;
    
    /**
     * 마이그레이션 상태 확인
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getMigrationStatus() {
        try {
            log.info("🔍 마이그레이션 상태 확인 요청");
            Map<String, Object> status = codeMigrationService.checkMigrationStatus();
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("❌ 마이그레이션 상태 확인 실패", e);
            return ResponseEntity.internalServerError()
                .body(Map.of(
                    "success", false,
                    "error", "마이그레이션 상태 확인에 실패했습니다: " + e.getMessage()
                ));
        }
    }
    
    /**
     * 코드 마이그레이션 실행
     */
    @PostMapping("/migrate")
    public ResponseEntity<Map<String, Object>> migrateCodes() {
        try {
            log.info("🚀 코드 마이그레이션 실행 요청");
            Map<String, Object> result = codeMigrationService.migrateCodesToCommonCodes();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("❌ 코드 마이그레이션 실행 실패", e);
            return ResponseEntity.internalServerError()
                .body(Map.of(
                    "success", false,
                    "error", "코드 마이그레이션에 실패했습니다: " + e.getMessage()
                ));
        }
    }
    
    /**
     * 마이그레이션 롤백
     */
    @PostMapping("/rollback")
    public ResponseEntity<Map<String, Object>> rollbackMigration() {
        try {
            log.info("🔄 마이그레이션 롤백 요청");
            Map<String, Object> result = codeMigrationService.rollbackMigration();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("❌ 마이그레이션 롤백 실패", e);
            return ResponseEntity.internalServerError()
                .body(Map.of(
                    "success", false,
                    "error", "마이그레이션 롤백에 실패했습니다: " + e.getMessage()
                ));
        }
    }
}
