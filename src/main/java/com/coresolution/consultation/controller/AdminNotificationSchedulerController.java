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
 * 403 으로 거부한다.
 *
 * <p>P0 보안(2026-10-03): 조회 전용으로 축소. 전역 행 변경은 한 테넌트 관리자가 전체 테넌트의
 * 알림 발송을 바꾸는 결과가 되므로 {@code PUT /flags/{key}} 는 ADMIN 이라도 403 이다.
 * 응답의 마지막 변경자는 다른 관리자 이메일 대신 역할 라벨로만 노출한다
 * ({@link NotificationSchedulerFlagDto#fromEntity}).
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
    private static final String MSG_GET_FAILED = "스케줄러 플래그 조회 실패";

    /**
     * P0 보안(2026-10-03): 본 플래그는 {@code tenant_id=''} 전역 행이라 한 테넌트 관리자의 변경이
     * 모든 테넌트의 알림 발송에 영향을 준다. 테넌트 관리자 경로에서는 변경을 차단하고 조회만 허용한다.
     */
    private static final String MSG_OPS_ONLY =
            "전역 스케줄러 플래그는 운영자 전용입니다. 테넌트 관리자 경로에서는 변경할 수 없습니다.";

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
     * 단일 키 토글 저장 — P0 보안(2026-10-03) 이후 테넌트 관리자 경로에서는 차단된다.
     *
     * <p>이 플래그는 {@code system_config} 전역 행({@code tenant_id=''})이므로 한 테넌트의
     * 관리자가 변경하면 전체 테넌트의 자동 알림 발송이 함께 멈추거나 켜진다. 전역 스위치는
     * 운영자 전용 경로로만 변경하며, 본 엔드포인트는 ADMIN 이라도 403 을 반환한다.
     *
     * @param key     플래그 키 (path variable)
     * @param request {@code {value: boolean}} 본문 (사용하지 않음)
     * @param session HTTP 세션 (RBAC)
     * @return 403 (운영자 전용)
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
        log.warn("[NotificationSchedulerFlag] 전역 플래그 변경 차단(운영자 전용): key={}", key);
        return opsOnly();
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

    private ResponseEntity<Map<String, Object>> forbidden() {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", MSG_FORBIDDEN);
        return ResponseEntity.status(403).body(body);
    }

    private ResponseEntity<Map<String, Object>> opsOnly() {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", MSG_OPS_ONLY);
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
