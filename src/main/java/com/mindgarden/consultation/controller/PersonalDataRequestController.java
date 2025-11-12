package com.mindgarden.consultation.controller;

import java.time.LocalDateTime;
import java.util.Map;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.PersonalDataRequestService;
import com.mindgarden.consultation.service.PersonalDataAccessLogService;
import com.mindgarden.consultation.utils.SessionUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 개인정보 열람/삭제 요청 컨트롤러
 * 개인정보보호법 준수를 위한 API
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@RestController
@RequestMapping("/api/personal-data-request")
@RequiredArgsConstructor
public class PersonalDataRequestController {
    
    private final PersonalDataRequestService personalDataRequestService;
    private final PersonalDataAccessLogService personalDataAccessLogService;
    
    /**
     * 개인정보 열람 요청
     * 사용자가 자신의 개인정보를 열람할 수 있도록 요청
     */
    @PostMapping("/access")
    public ResponseEntity<Map<String, Object>> requestPersonalDataAccess(
            HttpSession session,
            HttpServletRequest request) {
        
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            log.info("개인정보 열람 요청: userId={}", currentUser.getId());
            
            // 개인정보 접근 로그 기록
            personalDataAccessLogService.logPersonalDataAccess(
                currentUser.getId().toString(),
                currentUser.getName(),
                "USER_INFO",
                "READ",
                currentUser.getId().toString(),
                currentUser.getName(),
                "사용자 본인 열람 요청",
                "SUCCESS",
                "USER_" + currentUser.getId(),
                "개인정보 열람 요청",
                request
            );
            
            // 개인정보 열람 요청 처리
            Map<String, Object> result = personalDataRequestService.requestPersonalDataAccess(
                currentUser.getId(),
                request
            );
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("개인정보 열람 요청 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "개인정보 열람 요청 처리 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 개인정보 삭제 요청
     * 사용자가 자신의 개인정보 삭제를 요청
     */
    @PostMapping("/deletion")
    public ResponseEntity<Map<String, Object>> requestPersonalDataDeletion(
            @RequestBody Map<String, String> requestBody,
            HttpSession session,
            HttpServletRequest request) {
        
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            String reason = requestBody.getOrDefault("reason", "사용자 요청");
            String password = requestBody.get("password"); // 본인 확인용 비밀번호
            
            log.info("개인정보 삭제 요청: userId={}, reason={}", currentUser.getId(), reason);
            
            // 개인정보 삭제 요청 처리
            Map<String, Object> result = personalDataRequestService.requestPersonalDataDeletion(
                currentUser.getId(),
                password,
                reason,
                request
            );
            
            return ResponseEntity.ok(result);
            
        } catch (IllegalArgumentException e) {
            log.warn("개인정보 삭제 요청 검증 실패: {}", e.getMessage());
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("개인정보 삭제 요청 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "개인정보 삭제 요청 처리 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 개인정보 열람/삭제 요청 현황 조회
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getRequestStatus(
            HttpSession session,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 기본값 설정 (최근 1년)
            if (startDate == null) {
                startDate = LocalDateTime.now().minusYears(1);
            }
            if (endDate == null) {
                endDate = LocalDateTime.now();
            }
            
            Map<String, Object> result = personalDataRequestService.getRequestStatus(
                currentUser.getId(),
                startDate,
                endDate
            );
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("개인정보 요청 현황 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "요청 현황 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 개인정보 처리 현황 조회 (개인정보보호법 제30조)
     * 사용자가 자신의 개인정보가 어떻게 처리되고 있는지 조회
     */
    @GetMapping("/processing-status")
    public ResponseEntity<Map<String, Object>> getPersonalDataProcessingStatus(
            HttpSession session) {
        
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            Map<String, Object> result = personalDataRequestService.getPersonalDataProcessingStatus(
                currentUser.getId()
            );
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("개인정보 처리 현황 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "개인정보 처리 현황 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
}

