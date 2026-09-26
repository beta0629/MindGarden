package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.EmailLogMasking;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 클라이언트 설정 관리 컨트롤러.
 * <p>세션 User 우선, 없으면 Authentication principal 을 JWT userId 또는 이메일로 해석한다.</p>
 *
 * @author MindGarden
 * @since 2025-12-05
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/clients") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()") // B8 (2026-06-14): 무가드 회귀 방지 fallback. 메서드 본문 inline 인증 체크는 그대로 우선 적용.
public class ClientSettingsController extends BaseApiController {

    private final UserService userService;

    /**
     * 클라이언트 설정 조회.
     *
     * @param session 브라우저 세션(세션 User 우선)
     * @return 클라이언트 설정 정보
     * @throws AccessDeniedException 미인증
     * @throws EntityNotFoundException 인증됐으나 사용자를 찾을 수 없음
     */
    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getClientSettings(HttpSession session) {
        log.info("📋 클라이언트 설정 조회 요청");

        User user = resolveAuthenticatedUser(session);

        Map<String, Object> settings = new HashMap<>();
        settings.put("notifications", Map.of(
            "email", user.getEmailNotification() != null ? user.getEmailNotification() : true,
            "sms", user.getSmsNotification() != null ? user.getSmsNotification() : false,
            "push", user.getPushNotification() != null ? user.getPushNotification() : true
        ));

        settings.put("privacy", Map.of(
            "profileVisibility", user.getProfileVisibility() != null ? user.getProfileVisibility() : "private",
            "dataSharing", user.getDataSharing() != null ? user.getDataSharing() : false
        ));

        settings.put("consultation", Map.of(
            "autoReminder", user.getAutoReminder() != null ? user.getAutoReminder() : true,
            "sessionDuration", user.getPreferredSessionDuration() != null ? user.getPreferredSessionDuration() : 50
        ));

        log.info("✅ 클라이언트 설정 조회 성공 - 사용자: {}", EmailLogMasking.maskForLog(user.getEmail()));
        return success(settings);
    }

    /**
     * 클라이언트 설정 저장.
     *
     * @param session 브라우저 세션(세션 User 우선)
     * @param settings 저장할 설정 정보
     * @return 저장 결과
     * @throws AccessDeniedException 미인증
     * @throws EntityNotFoundException 인증됐으나 사용자를 찾을 수 없음
     */
    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateClientSettings(
            HttpSession session,
            @RequestBody Map<String, Object> settings) {
        log.info("💾 클라이언트 설정 저장 요청");

        User user = resolveAuthenticatedUser(session);

        @SuppressWarnings("unchecked")
        Map<String, Object> notifications = (Map<String, Object>) settings.get("notifications");
        if (notifications != null) {
            user.setEmailNotification((Boolean) notifications.get("email"));
            user.setSmsNotification((Boolean) notifications.get("sms"));
            user.setPushNotification((Boolean) notifications.get("push"));
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> privacy = (Map<String, Object>) settings.get("privacy");
        if (privacy != null) {
            user.setProfileVisibility((String) privacy.get("profileVisibility"));
            user.setDataSharing((Boolean) privacy.get("dataSharing"));
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> consultation = (Map<String, Object>) settings.get("consultation");
        if (consultation != null) {
            user.setAutoReminder((Boolean) consultation.get("autoReminder"));
            user.setPreferredSessionDuration((Integer) consultation.get("sessionDuration"));
        }

        User updatedUser = userService.save(user);

        log.info("✅ 클라이언트 설정 저장 성공 - 사용자: {}", EmailLogMasking.maskForLog(updatedUser.getEmail()));

        Map<String, Object> data = new HashMap<>();
        data.put("userId", updatedUser.getId());
        data.put("email", updatedUser.getEmail());
        data.put("updatedAt", updatedUser.getUpdatedAt());

        return updated("설정이 성공적으로 저장되었습니다.", data);
    }

    /**
     * 세션 User 우선, 없으면 Authentication principal 해석.
     * JWT 필터는 principal 을 userId(숫자 문자열)로 두고, 세션 인증은 이메일을 쓴다.
     *
     * @param session HTTP 세션
     * @return 인증된 사용자
     * @throws AccessDeniedException 미인증
     * @throws EntityNotFoundException 사용자를 찾을 수 없음 (404, RuntimeException 500 아님)
     */
    private User resolveAuthenticatedUser(HttpSession session) {
        User sessionUser = SessionUtils.getCurrentUser(session);
        if (sessionUser != null) {
            return sessionUser;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof User userPrincipal) {
            return userPrincipal;
        }

        String name = auth.getName();
        if (name == null || name.isBlank()) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }

        Optional<User> found;
        if (isNumericPrincipal(name)) {
            try {
                found = userService.findById(Long.parseLong(name));
            } catch (NumberFormatException ex) {
                throw new EntityNotFoundException("User", name);
            }
        } else {
            found = userService.findByEmail(name);
        }
        return found.orElseThrow(() -> new EntityNotFoundException("User", name));
    }

    /**
     * JWT principal 이 userId 숫자 문자열인지 여부.
     *
     * @param name Authentication#getName()
     * @return 숫자만 있으면 true
     */
    private static boolean isNumericPrincipal(String name) {
        if (name == null || name.isEmpty()) {
            return false;
        }
        for (int i = 0; i < name.length(); i++) {
            if (!Character.isDigit(name.charAt(i))) {
                return false;
            }
        }
        return true;
    }
}
