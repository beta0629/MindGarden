package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.dto.NotificationSchedulerFlagDto;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.util.AdminRoleUtils;
import com.coresolution.consultation.utils.SessionUtils;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 알림 자동 발송 스케줄러 ON/OFF 어드민 토글 컨트롤러 (PR-2).
 *
 * <p>운영자/어드민이 코드/SQL 없이 화면에서 4 종 스케줄러 플래그를 즉시 토글하기 위한 진입점.
 * PR-1 에서 정착된 DB SSOT(전역 행 {@code tenant_id = ''}) 위에 동작하며, 화이트리스트로
 * {@link NotificationSchedulerFlagKeys#all()} 외의 키 변경을 차단한다.
 *
 * <p>RBAC: ADMIN 역할만 허용 ({@link AdminRoleUtils#isAdmin}). 미인증/일반 사용자/세션 만료는
 * 403 으로 거부한다. 감사 로그는 {@code system_config.updated_by} 에 사용자 이메일(없으면 ID)
 * 을 기록하여 PR-1 핫픽스 감사 패턴(SchedulerExecutionLog 외부 트레이스) 과 별개로 변경 이력을
 * 남긴다.
 *
 * <p>경로 표준화: {@code /api/v1/admin/notification-scheduler/*} (PR-2 신설). 기존
 * {@link SystemConfigController} 의 일반 키-밸류 API 는 테넌트 종속이라 전역 토글에 부적합하므로
 * 본 컨트롤러를 신설한다 (옵션 A).
 *
 * @author MindGarden
 * @since 2026-05-25
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/notification-scheduler")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()") // B8 (2026-06-14): 무가드 회귀 방지 fallback. 메서드 본문 inline ADMIN 체크는 그대로 우선 적용.
public class AdminNotificationSchedulerController {

    /** 응답 메시지 — i18n 가능하도록 키만 노출하지만, 백엔드 fallback 텍스트도 한국어로 통일. */
    private static final String MSG_FORBIDDEN = "접근 권한이 없습니다.";
    private static final String MSG_KEY_NOT_ALLOWED = "허용되지 않은 플래그 키입니다.";
    private static final String MSG_VALUE_REQUIRED = "value 는 필수입니다.";
    private static final String MSG_GET_FAILED = "스케줄러 플래그 조회 실패";
    private static final String MSG_PUT_FAILED = "스케줄러 플래그 저장 실패";

    private final SystemConfigService systemConfigService;

    /**
     * 4 종 스케줄러 플래그 일괄 조회.
     *
     * @param session HTTP 세션 (RBAC 체크용)
     * @return {@code {success, flags: [{key, value, description, updatedBy, updatedAt}, ...]}}
     */
    @GetMapping("/flags")
    public ResponseEntity<Map<String, Object>> listFlags(HttpSession session) {
        if (!hasAdminPermission(session)) {
            return forbidden();
        }
        try {
            List<NotificationSchedulerFlagDto> flags =
                    systemConfigService.listNotificationSchedulerFlags();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("flags", flags);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("[NotificationSchedulerFlag] listFlags 실패", e);
            return badRequest(MSG_GET_FAILED + ": " + safeMessage(e));
        }
    }

    /**
     * 단일 키 토글 저장 (whitelist + audit).
     *
     * @param key      플래그 키 (path variable, {@link NotificationSchedulerFlagKeys#all()} 화이트리스트)
     * @param request  {@code {value: boolean}} 본문
     * @param session  HTTP 세션 (RBAC + audit 사용자 식별)
     * @return {@code {success, flag: {...}}}
     */
    @PutMapping("/flags/{key}")
    public ResponseEntity<Map<String, Object>> updateFlag(
            @PathVariable("key") String key,
            @RequestBody(required = false) Map<String, Object> request,
            HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (!isAdmin(user)) {
            return forbidden();
        }
        if (!NotificationSchedulerFlagKeys.all().contains(key)) {
            log.warn("[NotificationSchedulerFlag] 허용되지 않은 키 변경 시도: key={}, by={}",
                    key, auditActor(user));
            return badRequest(MSG_KEY_NOT_ALLOWED);
        }
        Boolean value = extractBoolean(request);
        if (value == null) {
            return badRequest(MSG_VALUE_REQUIRED);
        }
        try {
            NotificationSchedulerFlagDto saved = systemConfigService.setGlobalBoolean(
                    key, value, auditActor(user));
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("flag", saved);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("[NotificationSchedulerFlag] updateFlag 실패: key={}", key, e);
            return badRequest(MSG_PUT_FAILED + ": " + safeMessage(e));
        }
    }

    /**
     * 세션 사용자가 ADMIN 권한인지 확인.
     *
     * @param session HTTP 세션
     * @return ADMIN 이면 true, 미인증/일반 사용자면 false
     */
    private boolean hasAdminPermission(HttpSession session) {
        return isAdmin(SessionUtils.getCurrentUser(session));
    }

    private boolean isAdmin(User user) {
        return user != null && AdminRoleUtils.isAdmin(user);
    }

    /**
     * 감사 로그용 식별자 — 이메일 우선, 없으면 ID, 그것도 없으면 "ADMIN".
     */
    private String auditActor(User user) {
        if (user == null) {
            return "ADMIN";
        }
        String email = user.getEmail();
        if (email != null && !email.isBlank()) {
            return email.trim();
        }
        Long id = user.getId();
        if (id != null) {
            return "user#" + id;
        }
        return "ADMIN";
    }

    /**
     * 요청 본문에서 {@code value} 키의 boolean 을 추출. {@code true|"true"|"1"|"on"|"yes"} 만 ON.
     *
     * @param request 요청 본문 (null 허용)
     * @return 파싱된 boolean, 추출 실패 시 null
     */
    private Boolean extractBoolean(Map<String, Object> request) {
        if (request == null) {
            return null;
        }
        Object raw = request.get("value");
        if (raw instanceof Boolean) {
            return (Boolean) raw;
        }
        if (raw instanceof String) {
            String normalized = ((String) raw).trim().toLowerCase();
            if (normalized.isEmpty()) {
                return null;
            }
            return "true".equals(normalized)
                    || "1".equals(normalized)
                    || "on".equals(normalized)
                    || "yes".equals(normalized);
        }
        if (raw instanceof Number) {
            return ((Number) raw).intValue() != 0;
        }
        return null;
    }

    private ResponseEntity<Map<String, Object>> forbidden() {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", MSG_FORBIDDEN);
        return ResponseEntity.status(403).body(body);
    }

    private ResponseEntity<Map<String, Object>> badRequest(String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", message);
        return ResponseEntity.badRequest().body(body);
    }

    private String safeMessage(Exception e) {
        String msg = e.getMessage();
        if (msg == null) {
            return e.getClass().getSimpleName();
        }
        return msg.length() > 300 ? msg.substring(0, 300) + "..." : msg;
    }
}
