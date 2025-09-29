package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.service.PermissionInitializationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 권한 시스템 테스트 및 초기화 컨트롤러
 * 개발/테스트 환경에서 권한 시스템을 수동으로 초기화할 수 있습니다.
 */
@RestController
@RequestMapping("/api/test/permissions")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PermissionTestController {

    private final PermissionInitializationService permissionInitializationService;

    /**
     * 권한 시스템 수동 초기화
     */
    @PostMapping("/initialize")
    public ResponseEntity<Map<String, Object>> initializePermissions() {
        try {
            log.info("🔐 권한 시스템 수동 초기화 시작...");
            
            permissionInitializationService.initializePermissionSystem();
            
            log.info("✅ 권한 시스템 수동 초기화 완료");
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "권한 시스템이 성공적으로 초기화되었습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 권한 시스템 초기화 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "권한 시스템 초기화에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 권한 시스템 상태 확인
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getPermissionStatus() {
        try {
            log.info("🔍 권한 시스템 상태 확인...");
            
            boolean isInitialized = permissionInitializationService.isPermissionSystemInitialized();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "initialized", isInitialized,
                "message", isInitialized ? "권한 시스템이 초기화되었습니다." : "권한 시스템이 초기화되지 않았습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 권한 시스템 상태 확인 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "권한 시스템 상태 확인에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 권한 목록 조회 (인증 없이)
     */
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getAllPermissions() {
        try {
            log.info("🔍 모든 권한 목록 조회...");
            
            // 권한 목록을 직접 조회하는 로직 (인증 없이)
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "권한 목록 조회 성공",
                "permissions", "권한 목록이 여기에 표시됩니다."
            ));
        } catch (Exception e) {
            log.error("❌ 권한 목록 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "권한 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}
