package com.coresolution.consultation.controller;

import java.util.HashMap;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
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
@RequestMapping("/api/v1/admin/session-sync") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class SessionSyncController extends BaseApiController {
    
    private final SessionSyncService sessionSyncService;
    
    /**
     * 전체 시스템 회기 수 검증
     */
    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateAllSessions() {
        log.info("🔍 전체 시스템 회기 수 검증 요청");
        
        Map<String, Object> result = sessionSyncService.validateAllSessions();
        
        return success("전체 시스템 회기 수 검증이 완료되었습니다.", result);
    }
    
    /**
     * 특정 매핑 회기 수 검증 및 동기화
     */
    @PostMapping("/validate/{mappingId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateMappingSessions(@PathVariable Long mappingId) {
        log.info("🔍 매핑 회기 수 검증 요청: mappingId={}", mappingId);
        
        sessionSyncService.validateAndSyncMappingSessions(mappingId);
        
        Map<String, Object> data = new HashMap<>();
        data.put("mappingId", mappingId);
        
        return success("매핑 회기 수 검증 및 동기화가 완료되었습니다.", data);
    }
    
    /**
     * 회기 수 불일치 자동 수정
     */
    @PostMapping("/fix-mismatches")
    public ResponseEntity<ApiResponse<Void>> fixSessionMismatches() {
        log.info("🔧 회기 수 불일치 자동 수정 요청");
        
        sessionSyncService.fixSessionMismatches();
        
        return success("회기 수 불일치 자동 수정이 완료되었습니다.");
    }
    
    /**
     * 회기 동기화 상태 조회
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSyncStatus() {
        log.info("📊 회기 동기화 상태 조회 요청");
        
        Map<String, Object> status = sessionSyncService.getSyncStatus();
        
        return success("회기 동기화 상태를 성공적으로 조회했습니다.", status);
    }
    
    /**
     * 회기 사용 로그 기록
     */
    @PostMapping("/log-usage")
    public ResponseEntity<ApiResponse<Void>> logSessionUsage(@RequestBody Map<String, Object> request) {
        log.info("📝 회기 사용 로그 기록 요청");
        
        Long mappingId = Long.valueOf(request.get("mappingId").toString());
        String action = (String) request.get("action");
        Integer sessions = Integer.valueOf(request.get("sessions").toString());
        String reason = (String) request.get("reason");
        
        sessionSyncService.logSessionUsage(mappingId, action, sessions, reason);
        
        return success("회기 사용 로그가 기록되었습니다.");
    }
}
