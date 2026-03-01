package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.utils.SessionUtils;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.RestTemplate;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 시스템 설정 관리 컨트롤러
 * 관리자 전용 (BRANCH_ADMIN 이상)
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/system-config") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class SystemConfigController {
    
    private final SystemConfigService systemConfigService;
    
    /**
     * 권한 체크: BRANCH_ADMIN 이상
     */
    private boolean hasAdminPermission(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            return false;
        }
        try {
            com.coresolution.consultation.constant.UserRole role = user.getRole();
            if (role == null) {
                return false;
            }
            // 유틸리티 클래스 활용
            return com.coresolution.consultation.util.AdminRoleUtils.isAdmin(role);
        } catch (Exception e) {
            log.error("권한 체크 중 오류 발생", e);
            return false;
        }
    }
    
    /**
     * 설정 값 조회
     */
    @GetMapping("/{configKey}")
    public ResponseEntity<Map<String, Object>> getConfig(@PathVariable String configKey, HttpSession session) {
        if (!hasAdminPermission(session)) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "접근 권한이 없습니다.");
            return ResponseEntity.status(403).body(response);
        }
        
        try {
            String value = systemConfigService.getConfigValue(configKey, "");
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("configKey", configKey);
            response.put("configValue", value);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("설정 조회 실패: {}", configKey, e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "설정 조회 실패: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 설정 값 저장
     */
    @PostMapping("/{configKey}")
    public ResponseEntity<Map<String, Object>> setConfig(
            @PathVariable String configKey,
            @RequestBody Map<String, String> request,
            HttpSession session) {
        if (!hasAdminPermission(session)) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "접근 권한이 없습니다.");
            return ResponseEntity.status(403).body(response);
        }
        try {
            String configValue = request.get("configValue");
            String description = request.get("description");
            String category = request.get("category");
            
            if (configValue == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "configValue는 필수입니다.");
                return ResponseEntity.badRequest().body(response);
            }
            
            systemConfigService.setConfigValue(configKey, configValue, description, category);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "설정이 저장되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("설정 저장 실패: {}", configKey, e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "설정 저장 실패: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 카테고리별 설정 조회
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<Map<String, Object>> getConfigsByCategory(@PathVariable String category, HttpSession session) {
        if (!hasAdminPermission(session)) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "접근 권한이 없습니다.");
            return ResponseEntity.status(403).body(response);
        }
        try {
            List<String> configs = systemConfigService.getConfigsByCategory(category);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("category", category);
            response.put("configs", configs);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("카테고리별 설정 조회 실패: {}", category, e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "설정 조회 실패: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * OpenAI 설정 조회
     */
    @GetMapping("/openai")
    public ResponseEntity<Map<String, Object>> getOpenAIConfig(HttpSession session) {
        if (!hasAdminPermission(session)) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "접근 권한이 없습니다.");
            return ResponseEntity.status(403).body(response);
        }
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("apiKey", systemConfigService.getOpenAIApiKey());
            response.put("apiUrl", systemConfigService.getOpenAIApiUrl());
            response.put("model", systemConfigService.getOpenAIModel());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("OpenAI 설정 조회 실패", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "OpenAI 설정 조회 실패: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 기본 AI 프로바이더 조회
     */
    @GetMapping("/ai-default-provider")
    public ResponseEntity<Map<String, Object>> getAiDefaultProvider(HttpSession session) {
        if (!hasAdminPermission(session)) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "접근 권한이 없습니다.");
            return ResponseEntity.status(403).body(response);
        }
        try {
            String providerId = systemConfigService.getAiDefaultProvider();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("providerId", providerId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("기본 AI 프로바이더 조회 실패", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "기본 AI 프로바이더 조회 실패: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 기본 AI 프로바이더 저장
     */
    @PostMapping("/ai-default-provider")
    public ResponseEntity<Map<String, Object>> setAiDefaultProvider(
            @RequestBody Map<String, String> request,
            HttpSession session) {
        if (!hasAdminPermission(session)) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "접근 권한이 없습니다.");
            return ResponseEntity.status(403).body(response);
        }
        try {
            String providerId = request.get("providerId");
            if (providerId == null || providerId.isBlank()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "providerId는 필수입니다.");
                return ResponseEntity.badRequest().body(response);
            }
            systemConfigService.setAiDefaultProvider(providerId.trim());
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "기본 AI 프로바이더가 저장되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("기본 AI 프로바이더 저장 실패", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "기본 AI 프로바이더 저장 실패: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Gemini API 키 테스트 (Google AI Generative Language API — 키만 사용)
     * 저장된 키 또는 요청 본문의 apiKey로 간단한 generateContent 호출 후 성공/실패 반환
     */
    @PostMapping("/test-gemini")
    public ResponseEntity<Map<String, Object>> testGeminiKey(
            @RequestBody(required = false) Map<String, String> body,
            HttpSession session) {
        if (!hasAdminPermission(session)) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "접근 권한이 없습니다.");
            return ResponseEntity.status(403).body(response);
        }
        String apiKey = (body != null && body.containsKey("apiKey")) ? body.get("apiKey") : null;
        if (apiKey == null || apiKey.isBlank()) {
            apiKey = systemConfigService.getConfigValue("GEMINI_API_KEY", "");
        } else {
            apiKey = apiKey.trim();
        }
        if (apiKey.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Gemini API 키를 입력하거나 저장 후 테스트해 주세요.");
            return ResponseEntity.badRequest().body(response);
        }
        String model = systemConfigService.getConfigValue("GEMINI_MODEL", "gemini-1.5-flash");
        if (model == null || model.isBlank()) {
            model = "gemini-1.5-flash";
        }
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model.trim() + ":generateContent";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(
                Map.of("parts", List.of(Map.of("text", "Say OK in one word.")))
        ));
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        try {
            ResponseEntity<Map<String, Object>> resp = new RestTemplate().exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Gemini API 키가 정상적으로 동작합니다.");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            log.warn("Gemini API 키 테스트 실패: {}", e.getMessage());
            String msg = e.getMessage();
            if (msg != null && msg.length() > 200) {
                msg = msg.substring(0, 200) + "...";
            }
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "연결 실패: " + msg);
            return ResponseEntity.ok(response);
        }
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "Gemini API 응답을 확인할 수 없습니다.");
        return ResponseEntity.ok(response);
    }
}
