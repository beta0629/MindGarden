package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.service.PasskeyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Passkey 인증 컨트롤러
 * Week 17-18: Passkey 인증 구현
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/auth/passkey")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PasskeyController {
    
    private final PasskeyService passkeyService;
    
    /**
     * Passkey 등록 시작
     */
    @PostMapping("/register/start")
    public ResponseEntity<Map<String, Object>> startRegistration(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            Long userId = Long.parseLong(request.get("userId").toString());
            String deviceName = (String) request.get("deviceName");
            
            Map<String, Object> result = passkeyService.startRegistration(userId, deviceName);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Passkey 등록 시작 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Passkey 등록 시작에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Passkey 등록 완료
     */
    @PostMapping("/register/finish")
    public ResponseEntity<Map<String, Object>> finishRegistration(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            Long userId = Long.parseLong(request.get("userId").toString());
            @SuppressWarnings("unchecked")
            Map<String, Object> credential = (Map<String, Object>) request.get("credential");
            String challengeKey = (String) request.get("challengeKey");
            String deviceName = (String) request.get("deviceName");
            
            Map<String, Object> result = passkeyService.finishRegistration(userId, credential, challengeKey, deviceName);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Passkey 등록 완료 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Passkey 등록에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Passkey 인증 시작
     */
    @PostMapping("/authenticate/start")
    public ResponseEntity<Map<String, Object>> startAuthentication(
            @RequestBody Map<String, Object> request) {
        try {
            String email = (String) request.get("email");
            
            Map<String, Object> result = passkeyService.startAuthentication(email);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Passkey 인증 시작 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Passkey 인증 시작에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Passkey 인증 완료
     */
    @PostMapping("/authenticate/finish")
    public ResponseEntity<Map<String, Object>> finishAuthentication(
            @RequestBody Map<String, Object> request) {
        try {
            String email = (String) request.get("email");
            @SuppressWarnings("unchecked")
            Map<String, Object> credential = (Map<String, Object>) request.get("credential");
            String challengeKey = (String) request.get("challengeKey");
            
            Map<String, Object> result = passkeyService.finishAuthentication(email, credential, challengeKey);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Passkey 인증 완료 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Passkey 인증에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Passkey 목록 조회
     */
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> listPasskeys(
            @RequestParam Long userId,
            Authentication authentication) {
        try {
            Map<String, Object> result = passkeyService.listPasskeys(userId);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Passkey 목록 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Passkey 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Passkey 삭제
     */
    @DeleteMapping("/{passkeyId}")
    public ResponseEntity<Map<String, Object>> deletePasskey(
            @PathVariable Long passkeyId,
            @RequestParam Long userId,
            Authentication authentication) {
        try {
            Map<String, Object> result = passkeyService.deletePasskey(userId, passkeyId);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Passkey 삭제 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Passkey 삭제에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}

