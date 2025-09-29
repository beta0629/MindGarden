package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.service.PermissionInitializationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

/**
 * 권한 초기화 컨트롤러 (운영 환경 디버깅용)
 */
@Slf4j
@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class PermissionInitController {

    private final PermissionInitializationService permissionInitializationService;

    /**
     * 권한 시스템 강제 초기화 (운영 환경 디버깅용)
     */
    @PostMapping("/init-permissions")
    public ResponseEntity<Map<String, Object>> forceInitializePermissions() {
        try {
            log.info("🔧 권한 시스템 강제 초기화 시작");
            
            permissionInitializationService.initializePermissionSystem();
            
            log.info("✅ 권한 시스템 강제 초기화 완료");
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "권한 시스템이 성공적으로 초기화되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 권한 시스템 강제 초기화 실패", e);
            
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "권한 시스템 초기화에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 권한 시스템 상태 확인
     */
    @PostMapping("/check-permissions")
    public ResponseEntity<Map<String, Object>> checkPermissionSystem() {
        try {
            log.info("🔍 권한 시스템 상태 확인");
            
            boolean isInitialized = permissionInitializationService.isPermissionSystemInitialized();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "isInitialized", isInitialized,
                "message", isInitialized ? "권한 시스템이 초기화되어 있습니다." : "권한 시스템이 초기화되지 않았습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 권한 시스템 상태 확인 실패", e);
            
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "권한 시스템 상태 확인에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}
