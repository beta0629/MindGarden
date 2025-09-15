package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.service.SessionSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 회기 동기화 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/session-sync")
@RequiredArgsConstructor
public class SessionSyncController {
    
    private final SessionSyncService sessionSyncService;
    
    /**
     * 전체 시스템 회기 수 검증
     */
    @GetMapping("/validate")
    public ResponseEntity<?> validateAllSessions() {
        try {
            log.info("🔍 전체 시스템 회기 수 검증 요청");
            
            Map<String, Object> result = sessionSyncService.validateAllSessions();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", result,
                "message", "전체 시스템 회기 수 검증이 완료되었습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 전체 시스템 회기 수 검증 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "회기 수 검증에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 특정 매핑 회기 수 검증 및 동기화
     */
    @PostMapping("/validate/{mappingId}")
    public ResponseEntity<?> validateMappingSessions(@PathVariable Long mappingId) {
        try {
            log.info("🔍 매핑 회기 수 검증 요청: mappingId={}", mappingId);
            
            sessionSyncService.validateAndSyncMappingSessions(mappingId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "매핑 회기 수 검증 및 동기화가 완료되었습니다.",
                "mappingId", mappingId
            ));
        } catch (Exception e) {
            log.error("❌ 매핑 회기 수 검증 실패: mappingId={}, error={}", mappingId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "매핑 회기 수 검증에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 회기 수 불일치 자동 수정
     */
    @PostMapping("/fix-mismatches")
    public ResponseEntity<?> fixSessionMismatches() {
        try {
            log.info("🔧 회기 수 불일치 자동 수정 요청");
            
            sessionSyncService.fixSessionMismatches();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "회기 수 불일치 자동 수정이 완료되었습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 회기 수 불일치 자동 수정 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "회기 수 불일치 자동 수정에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 회기 동기화 상태 조회
     */
    @GetMapping("/status")
    public ResponseEntity<?> getSyncStatus() {
        try {
            log.info("📊 회기 동기화 상태 조회 요청");
            
            Map<String, Object> status = sessionSyncService.getSyncStatus();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", status,
                "message", "회기 동기화 상태를 성공적으로 조회했습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 회기 동기화 상태 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "회기 동기화 상태 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 회기 사용 로그 기록
     */
    @PostMapping("/log-usage")
    public ResponseEntity<?> logSessionUsage(@RequestBody Map<String, Object> request) {
        try {
            log.info("📝 회기 사용 로그 기록 요청");
            
            Long mappingId = Long.valueOf(request.get("mappingId").toString());
            String action = (String) request.get("action");
            Integer sessions = Integer.valueOf(request.get("sessions").toString());
            String reason = (String) request.get("reason");
            
            sessionSyncService.logSessionUsage(mappingId, action, sessions, reason);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "회기 사용 로그가 기록되었습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 회기 사용 로그 기록 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "회기 사용 로그 기록에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}
