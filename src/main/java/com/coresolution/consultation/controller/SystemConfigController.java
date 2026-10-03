package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.constant.SystemConfigAccessPolicy;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.service.SessionSecurityPolicyService;
import com.coresolution.consultation.util.SecretValueMasking;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 시스템 설정 관리 컨트롤러
 * 관리자 전용 (ADMIN)
 *
 * <p>P1 보안(2026-10-03): AI 프로바이더 화면(키·URL·모델·기본 프로바이더·키 테스트·모델 목록)과
 * 플랫폼 세션 스위치는 운영자 소관이다. 테넌트 관리자 경로에서는 조회(마스킹)만 허용하고 쓰기·외부
 * 호출은 403 이다. 키 테스트 엔드포인트는 요청 본문의 URL 로 저장된 키를 보낼 수 있어 키 유출 경로였다.
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

    private static final String MSG_NO_TENANT = "테넌트 정보가 없습니다.";

    /** P0 보안(2026-10-03): 허용 목록 밖 키는 값을 노출하지 않고 404 로 거부. */
    private static final String MSG_KEY_NOT_ALLOWED = "허용되지 않은 설정 키입니다.";

    /** 운영자 전용 설정 — 테넌트 관리자 경로에서는 변경·외부 호출 불가. */
    static final String MSG_KEY_OPS_ONLY = "운영자 전용 설정입니다. 테넌트 관리자 경로에서는 변경할 수 없습니다.";

    private final SystemConfigService systemConfigService;

    /** 세션 보안 플래그 인메모리 캐시 무효화 */
    private final SessionSecurityPolicyService sessionSecurityPolicyService;

    /**
     * 권한 체크: ADMIN
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
            return com.coresolution.consultation.util.AdminRoleUtils.isAdmin(role);
        } catch (Exception e) {
            log.error("권한 체크 중 오류 발생", e);
            return false;
        }
    }

    /**
     * 세션 사용자의 tenantId 를 반환한다. 요청 헤더·파라미터는 신뢰하지 않는다.
     *
     * @param session HTTP 세션
     * @return tenantId, 없으면 null
     */
    private String resolveSessionTenantId(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        String tenantId = (user != null) ? user.getTenantId() : null;
        return (tenantId == null || tenantId.isBlank()) ? null : tenantId;
    }

    /**
     * 세션 tenantId 로 {@code TenantContext} 를 고정한 뒤 작업을 수행하고 원래 값을 복원한다.
     *
     * @param tenantId 세션에서 확인된 tenantId
     * @param action   수행할 작업
     * @param <T>      반환 타입
     * @return 작업 결과
     */
    private <T> T withSessionTenant(String tenantId, java.util.function.Supplier<T> action) {
        String previousTenantId = TenantContextHolder.getTenantId();
        TenantContextHolder.setTenantId(tenantId);
        try {
            return action.get();
        } finally {
            if (previousTenantId != null && !previousTenantId.isBlank()) {
                TenantContextHolder.setTenantId(previousTenantId);
            } else {
                TenantContextHolder.clear();
            }
        }
    }

    private ResponseEntity<Map<String, Object>> errorResponse(int status, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return ResponseEntity.status(status).body(response);
    }

    /**
     * 운영자 전용 엔드포인트 공통 응답. 비관리자는 403(권한 없음), 관리자는 403(운영자 전용).
     *
     * @param session  HTTP 세션
     * @param endpoint 로그용 엔드포인트 이름
     * @return 403 응답
     */
    private ResponseEntity<Map<String, Object>> opsOnly(HttpSession session, String endpoint) {
        if (!hasAdminPermission(session)) {
            return errorResponse(403, "접근 권한이 없습니다.");
        }
        log.warn("운영자 전용 시스템 설정 경로 호출 차단: endpoint={}", endpoint);
        return errorResponse(403, MSG_KEY_OPS_ONLY);
    }

    /**
     * 설정 값 조회.
     *
     * <p>P0 보안(2026-10-03): {@link SystemConfigAccessPolicy#READABLE_KEYS} 허용 목록 밖의 키는
     * 값을 노출하지 않고 404 로 거부한다. 시크릿성 키(API 키·시크릿·토큰)는 마지막 4자리만 남긴
     * 마스킹 값과 설정 여부 플래그만 응답한다. 조회는 세션 tenantId 로만 스코프된다.
     */
    @GetMapping("/{configKey:.+}")
    public ResponseEntity<Map<String, Object>> getConfig(@PathVariable String configKey, HttpSession session) {
        if (!hasAdminPermission(session)) {
            return errorResponse(403, "접근 권한이 없습니다.");
        }
        if (!SystemConfigAccessPolicy.isReadable(configKey)) {
            log.warn("허용되지 않은 설정 키 조회 시도: configKey={}", configKey);
            return errorResponse(404, MSG_KEY_NOT_ALLOWED);
        }
        String tenantId = resolveSessionTenantId(session);
        if (tenantId == null) {
            return errorResponse(403, MSG_NO_TENANT);
        }
        return withSessionTenant(tenantId, () -> {
            try {
                String value = systemConfigService.getConfigValue(configKey, "");
                boolean secret = SystemConfigAccessPolicy.isSecretValueKey(configKey);
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("configKey", configKey);
                response.put("configValue", secret ? SecretValueMasking.mask(value) : value);
                response.put("configured", SecretValueMasking.isConfigured(value));
                response.put("masked", secret);
                response.put("opsOnly", SystemConfigAccessPolicy.isOpsOnlyWrite(configKey));
                return ResponseEntity.ok(response);
            } catch (Exception e) {
                log.error("설정 조회 실패: {}", configKey, e);
                return errorResponse(400, "설정 조회 실패");
            }
        });
    }

    /**
     * 설정 값 저장.
     *
     * <p>P0 보안(2026-10-03): {@link SystemConfigAccessPolicy#WRITABLE_KEYS} 외의 키는 저장할 수
     * 없다. {@link SystemConfigAccessPolicy#OPS_ONLY_WRITE_KEYS} (AI 프로바이더·플랫폼 세션 스위치)는
     * 운영자 전용이라 테넌트 경로에서는 403 이다.
     */
    @PostMapping("/{configKey:.+}")
    public ResponseEntity<Map<String, Object>> setConfig(
            @PathVariable String configKey,
            @RequestBody Map<String, String> request,
            HttpSession session) {
        if (!hasAdminPermission(session)) {
            return errorResponse(403, "접근 권한이 없습니다.");
        }
        if (SystemConfigAccessPolicy.isOpsOnlyWrite(configKey)) {
            log.warn("운영자 전용 설정 키 변경 시도 차단: configKey={}", configKey);
            return errorResponse(403, MSG_KEY_OPS_ONLY);
        }
        if (!SystemConfigAccessPolicy.isWritable(configKey)) {
            log.warn("허용되지 않은 설정 키 저장 시도: configKey={}", configKey);
            return errorResponse(404, MSG_KEY_NOT_ALLOWED);
        }
        String tenantId = resolveSessionTenantId(session);
        if (tenantId == null) {
            return errorResponse(403, MSG_NO_TENANT);
        }
        String configValue = (request != null) ? request.get("configValue") : null;
        if (configValue == null) {
            return errorResponse(400, "configValue는 필수입니다.");
        }
        String description = request.get("description");
        String category = request.get("category");
        return withSessionTenant(tenantId, () -> {
            try {
                systemConfigService.setConfigValue(configKey, configValue, description, category);

                if (sessionSecurityPolicyService.isSessionSecurityConfigKey(configKey)) {
                    sessionSecurityPolicyService.invalidateCache(tenantId);
                }

                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "설정이 저장되었습니다.");
                return ResponseEntity.ok(response);
            } catch (Exception e) {
                log.error("설정 저장 실패: {}", configKey, e);
                return errorResponse(400, "설정 저장 실패");
            }
        });
    }

    /**
     * 카테고리별 설정 조회.
     *
     * <p>P0 보안(2026-10-03): 세션 tenantId 로만 스코프되며 시크릿성 키 값은 마스킹된다.
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<Map<String, Object>> getConfigsByCategory(@PathVariable String category, HttpSession session) {
        if (!hasAdminPermission(session)) {
            return errorResponse(403, "접근 권한이 없습니다.");
        }
        String tenantId = resolveSessionTenantId(session);
        if (tenantId == null) {
            return errorResponse(403, MSG_NO_TENANT);
        }
        return withSessionTenant(tenantId, () -> {
            try {
                List<String> configs = systemConfigService.getConfigsByCategory(category);
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("category", category);
                response.put("configs", configs);
                return ResponseEntity.ok(response);
            } catch (Exception e) {
                log.error("카테고리별 설정 조회 실패: {}", category, e);
                return errorResponse(400, "설정 조회 실패");
            }
        });
    }

    /**
     * OpenAI 설정 조회.
     *
     * <p>P0 보안(2026-10-03): API 키는 마스킹 값과 설정 여부만 응답한다 (평문 미노출).
     */
    @GetMapping("/openai")
    public ResponseEntity<Map<String, Object>> getOpenAIConfig(HttpSession session) {
        if (!hasAdminPermission(session)) {
            return errorResponse(403, "접근 권한이 없습니다.");
        }
        try {
            String apiKey = systemConfigService.getOpenAIApiKey();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("apiKey", SecretValueMasking.mask(apiKey));
            response.put("apiKeyConfigured", SecretValueMasking.isConfigured(apiKey));
            response.put("apiUrl", systemConfigService.getOpenAIApiUrl());
            response.put("model", systemConfigService.getOpenAIModel());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("OpenAI 설정 조회 실패", e);
            return errorResponse(400, "OpenAI 설정 조회 실패");
        }
    }

    /**
     * 기본 AI 프로바이더 조회 (상태 표시용).
     */
    @GetMapping("/ai-default-provider")
    public ResponseEntity<Map<String, Object>> getAiDefaultProvider(HttpSession session) {
        if (!hasAdminPermission(session)) {
            return errorResponse(403, "접근 권한이 없습니다.");
        }
        try {
            String providerId = systemConfigService.getAiDefaultProvider();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("providerId", providerId);
            response.put("opsOnly", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("기본 AI 프로바이더 조회 실패", e);
            return errorResponse(400, "기본 AI 프로바이더 조회 실패");
        }
    }

    /**
     * 기본 AI 프로바이더 저장 — 운영자 전용 (테넌트 경로 403).
     *
     * @param request 사용하지 않음
     * @param session HTTP 세션
     * @return 403
     */
    @PostMapping("/ai-default-provider")
    public ResponseEntity<Map<String, Object>> setAiDefaultProvider(
            @RequestBody(required = false) Map<String, String> request,
            HttpSession session) {
        return opsOnly(session, "ai-default-provider");
    }

    /**
     * OpenAI API 키 테스트 — 운영자 전용 (테넌트 경로 403, 외부 호출 없음).
     *
     * @param body    사용하지 않음
     * @param session HTTP 세션
     * @return 403
     */
    @PostMapping("/test-openai")
    public ResponseEntity<Map<String, Object>> testOpenAIKey(
            @RequestBody(required = false) Map<String, String> body,
            HttpSession session) {
        return opsOnly(session, "test-openai");
    }

    /**
     * Gemini 모델 목록 조회 — 운영자 전용 (테넌트 경로 403, 외부 호출 없음).
     *
     * @param body    사용하지 않음
     * @param session HTTP 세션
     * @return 403
     */
    @PostMapping("/gemini-models")
    public ResponseEntity<Map<String, Object>> getGeminiModels(
            @RequestBody(required = false) Map<String, String> body,
            HttpSession session) {
        return opsOnly(session, "gemini-models");
    }

    /**
     * OpenAI 모델 목록 조회 — 운영자 전용 (테넌트 경로 403, 외부 호출 없음).
     *
     * @param body    사용하지 않음
     * @param session HTTP 세션
     * @return 403
     */
    @PostMapping("/openai-models")
    public ResponseEntity<Map<String, Object>> getOpenAIModels(
            @RequestBody(required = false) Map<String, String> body,
            HttpSession session) {
        return opsOnly(session, "openai-models");
    }

    /**
     * Gemini API 키 테스트 — 운영자 전용 (테넌트 경로 403, 외부 호출 없음).
     *
     * @param body    사용하지 않음
     * @param session HTTP 세션
     * @return 403
     */
    @PostMapping("/test-gemini")
    public ResponseEntity<Map<String, Object>> testGeminiKey(
            @RequestBody(required = false) Map<String, String> body,
            HttpSession session) {
        return opsOnly(session, "test-gemini");
    }
}
