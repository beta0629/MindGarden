package com.mindgarden.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.mindgarden.consultation.service.PhoneMigrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 전화번호 암호화 마이그레이션 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/migration")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PhoneMigrationController {
    
    private final PhoneMigrationService phoneMigrationService;
    
    /**
     * 전화번호 암호화 상태 확인
     * GET /api/admin/migration/phone/status
     */
    @GetMapping("/phone/status")
    public ResponseEntity<Map<String, Object>> checkPhoneEncryptionStatus() {
        try {
            log.info("🔍 전화번호 암호화 상태 확인 요청");
            
            phoneMigrationService.checkPhoneEncryptionStatus();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "전화번호 암호화 상태 확인이 완료되었습니다. 로그를 확인하세요.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 전화번호 암호화 상태 확인 실패", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "전화번호 암호화 상태 확인에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 전화번호 암호화 마이그레이션 실행
     * POST /api/admin/migration/phone/encrypt
     */
    @PostMapping("/phone/encrypt")
    public ResponseEntity<Map<String, Object>> migratePhoneNumbers() {
        try {
            log.info("🔄 전화번호 암호화 마이그레이션 요청");
            
            phoneMigrationService.migratePhoneNumbers();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "전화번호 암호화 마이그레이션이 완료되었습니다. 로그를 확인하세요.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 전화번호 암호화 마이그레이션 실패", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "전화번호 암호화 마이그레이션에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
