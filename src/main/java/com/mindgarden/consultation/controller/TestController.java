package com.mindgarden.consultation.controller;

import java.util.Map;
import com.mindgarden.consultation.service.StoredProcedureService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 테스트용 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-29
 */
@Slf4j
@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {
    
    private final StoredProcedureService storedProcedureService;
    
    /**
     * 프로시저 테스트 - 매핑 수정 권한 확인
     */
    @GetMapping("/mapping-permission")
    public ResponseEntity<Map<String, Object>> testMappingPermission(
            @RequestParam Long mappingId,
            @RequestParam Long userId,
            @RequestParam String userRole) {
        try {
            log.info("🧪 매핑 수정 권한 테스트: mappingId={}, userId={}, userRole={}", 
                    mappingId, userId, userRole);
            
            Map<String, Object> result = storedProcedureService.checkMappingUpdatePermission(
                mappingId, userId, userRole);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", result
            ));
        } catch (Exception e) {
            log.error("❌ 매핑 수정 권한 테스트 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "테스트 실패: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 프로시저 테스트 - 업무 시간 설정 조회
     */
    @GetMapping("/business-time")
    public ResponseEntity<Map<String, Object>> testBusinessTime() {
        try {
            log.info("🧪 업무 시간 설정 조회 테스트");
            
            Map<String, Object> result = storedProcedureService.getBusinessTimeSettings();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", result
            ));
        } catch (Exception e) {
            log.error("❌ 업무 시간 설정 조회 테스트 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "테스트 실패: " + e.getMessage()
            ));
        }
    }
}
