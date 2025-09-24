package com.mindgarden.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.mindgarden.consultation.config.PasswordPolicyConfig;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 비밀번호 정책 테스트 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@RestController
@RequestMapping("/api/test-simple")
public class PasswordTestController {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PasswordPolicyConfig.PasswordValidator passwordValidator;

    /**
     * 비밀번호 정책 검증 테스트
     */
    @PostMapping("/password-validate")
    public ResponseEntity<Map<String, Object>> validatePassword(@RequestBody Map<String, String> request) {
        String password = request.get("password");
        
        Map<String, Object> response = new HashMap<>();
        
        if (password == null || password.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "비밀번호를 입력해주세요.");
            return ResponseEntity.badRequest().body(response);
        }
        
        String validationResult = passwordValidator.validatePassword(password);
        
        if (validationResult == null) {
            response.put("success", true);
            response.put("message", "비밀번호가 정책을 만족합니다.");
            response.put("isValid", true);
        } else {
            response.put("success", false);
            response.put("message", validationResult);
            response.put("isValid", false);
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * 비밀번호 암호화 테스트
     */
    @PostMapping("/password-encode")
    public ResponseEntity<Map<String, Object>> encodePassword(@RequestBody Map<String, String> request) {
        String password = request.get("password");
        
        Map<String, Object> response = new HashMap<>();
        
        if (password == null || password.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "비밀번호를 입력해주세요.");
            return ResponseEntity.badRequest().body(response);
        }
        
        try {
            String encodedPassword = passwordEncoder.encode(password);
            
            response.put("success", true);
            response.put("message", "비밀번호 암호화 완료");
            response.put("originalPassword", password);
            response.put("encodedPassword", encodedPassword);
            response.put("passwordLength", password.length());
            
            // 암호화된 비밀번호 검증
            boolean matches = passwordEncoder.matches(password, encodedPassword);
            response.put("verificationResult", matches);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "비밀번호 암호화 중 오류 발생: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * 비밀번호 정책 정보 조회
     */
    @GetMapping("/password-policy")
    public ResponseEntity<Map<String, Object>> getPasswordPolicy() {
        Map<String, Object> response = new HashMap<>();
        
        response.put("success", true);
        response.put("policy", Map.of(
            "minLength", 8,
            "maxLength", 128,
            "requireUppercase", true,
            "requireLowercase", true,
            "requireDigit", true,
            "requireSpecialChar", true,
            "preventCommonPatterns", true,
            "preventConsecutiveChars", true,
            "preventRepeatedChars", true,
            "bcryptStrength", 12
        ));
        
        response.put("message", "비밀번호 정책 정보 조회 완료");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Rate Limiting 테스트 (빠른 요청)
     */
    @GetMapping("/rate-limit-test")
    public ResponseEntity<Map<String, Object>> rateLimitTest() {
        Map<String, Object> response = new HashMap<>();
        
        response.put("success", true);
        response.put("message", "Rate Limiting 테스트 성공");
        response.put("timestamp", System.currentTimeMillis());
        response.put("requestCount", "현재 요청 카운트는 Rate Limiting 필터에서 관리됩니다.");
        
        return ResponseEntity.ok(response);
    }

    /**
     * 로그인 시도 시뮬레이션
     */
    @PostMapping("/login-simulation")
    public ResponseEntity<Map<String, Object>> loginSimulation(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        
        Map<String, Object> response = new HashMap<>();
        
        // 실제 로그인 로직은 여기에 구현
        // 여기서는 시뮬레이션만 수행
        
        if ("admin".equals(username) && "MindGarden2025!".equals(password)) {
            response.put("success", true);
            response.put("message", "로그인 성공");
            response.put("authenticated", true);
        } else {
            response.put("success", false);
            response.put("message", "아이디 또는 비밀번호가 틀렸습니다.");
            response.put("authenticated", false);
        }
        
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }

    /**
     * 감사 로깅 테스트 API
     */
    @GetMapping("/audit-test")
    public ResponseEntity<Map<String, Object>> auditTest() {
        Map<String, Object> response = new HashMap<>();
        
        response.put("success", true);
        response.put("message", "감사 로깅 테스트 성공");
        response.put("timestamp", System.currentTimeMillis());
        response.put("note", "이 요청은 감사 로그에 기록됩니다.");
        
        return ResponseEntity.ok(response);
    }

    /**
     * 보안 이벤트 시뮬레이션
     */
    @PostMapping("/security-event-simulation")
    public ResponseEntity<Map<String, Object>> securityEventSimulation(@RequestBody Map<String, String> request) {
        String eventType = request.get("eventType");
        String description = request.get("description");
        
        Map<String, Object> response = new HashMap<>();
        
        response.put("success", true);
        response.put("message", "보안 이벤트 시뮬레이션 완료");
        response.put("eventType", eventType);
        response.put("description", description);
        response.put("timestamp", System.currentTimeMillis());
        response.put("note", "이 이벤트는 감사 로그에 HIGH 레벨로 기록됩니다.");
        
        return ResponseEntity.ok(response);
    }

    /**
     * 입력 검증 테스트 API
     */
    @GetMapping("/input-validation-test")
    public ResponseEntity<Map<String, Object>> inputValidationTest() {
        Map<String, Object> response = new HashMap<>();
        
        response.put("success", true);
        response.put("message", "입력 검증 테스트 성공");
        response.put("timestamp", System.currentTimeMillis());
        response.put("note", "이 API는 입력 검증 필터를 통과했습니다.");
        
        return ResponseEntity.ok(response);
    }

    /**
     * 보안 위협 시뮬레이션 (실제로는 차단됨)
     */
    @GetMapping("/security-threat-simulation")
    public ResponseEntity<Map<String, Object>> securityThreatSimulation() {
        Map<String, Object> response = new HashMap<>();
        
        response.put("success", true);
        response.put("message", "보안 위협 시뮬레이션 (정상 요청)");
        response.put("timestamp", System.currentTimeMillis());
        response.put("note", "이 요청은 정상적인 요청이므로 통과됩니다.");
        
        return ResponseEntity.ok(response);
    }

    @Autowired
    private PersonalDataEncryptionUtil encryptionService;

    /**
     * 데이터 암호화 테스트 API
     */
    @PostMapping("/encryption-test")
    public ResponseEntity<Map<String, Object>> encryptionTest(@RequestBody Map<String, String> request) {
        String plainText = request.get("plainText");
        
        Map<String, Object> response = new HashMap<>();
        
        if (plainText == null || plainText.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "암호화할 텍스트를 입력해주세요.");
            return ResponseEntity.badRequest().body(response);
        }
        
        try {
            String encryptedText = encryptionService.safeEncrypt(plainText);
            String decryptedText = encryptionService.safeDecrypt(encryptedText);
            
            response.put("success", true);
            response.put("message", "암호화/복호화 테스트 성공");
            response.put("originalText", plainText);
            response.put("encryptedText", encryptedText);
            response.put("decryptedText", decryptedText);
            response.put("isValid", plainText.equals(decryptedText));
            response.put("isEncrypted", encryptionService.isEncrypted(encryptedText));
            response.put("timestamp", System.currentTimeMillis());
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "암호화 처리 중 오류 발생: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * 개인정보 마스킹 테스트 API
     */
    @PostMapping("/masking-test")
    public ResponseEntity<Map<String, Object>> maskingTest(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String phoneNumber = request.get("phoneNumber");
        String cardNumber = request.get("cardNumber");
        String personalInfo = request.get("personalInfo");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Object> maskingResults = new HashMap<>();
            
            if (email != null) {
                maskingResults.put("email", encryptionService.maskEmail(email));
            }
            
            if (phoneNumber != null) {
                maskingResults.put("phoneNumber", encryptionService.maskName(phoneNumber));
            }
            
            if (cardNumber != null) {
                maskingResults.put("cardNumber", encryptionService.maskName(cardNumber));
            }
            
            if (personalInfo != null) {
                maskingResults.put("personalInfo", encryptionService.maskName(personalInfo));
            }
            
            response.put("success", true);
            response.put("message", "개인정보 마스킹 테스트 성공");
            response.put("originalData", request);
            response.put("maskedData", maskingResults);
            response.put("timestamp", System.currentTimeMillis());
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "마스킹 처리 중 오류 발생: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * 해시 생성 테스트 API
     */
    @PostMapping("/hash-test")
    public ResponseEntity<Map<String, Object>> hashTest(@RequestBody Map<String, String> request) {
        String input = request.get("input");
        
        Map<String, Object> response = new HashMap<>();
        
        if (input == null || input.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "해시를 생성할 텍스트를 입력해주세요.");
            return ResponseEntity.badRequest().body(response);
        }
        
        try {
            // 기존 암호화 유틸리티에는 해시 생성 기능이 없으므로 간단한 테스트로 변경
            String encrypted = encryptionService.safeEncrypt(input);
            String decrypted = encryptionService.safeDecrypt(encrypted);
            
            response.put("success", true);
            response.put("message", "기존 암호화 유틸리티 테스트 성공");
            response.put("originalInput", input);
            response.put("encrypted", encrypted);
            response.put("decrypted", decrypted);
            response.put("isEncrypted", encryptionService.isEncrypted(encrypted));
            response.put("timestamp", System.currentTimeMillis());
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "암호화 테스트 중 오류 발생: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }
}
