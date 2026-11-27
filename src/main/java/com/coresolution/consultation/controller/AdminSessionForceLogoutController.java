package com.coresolution.consultation.controller;

import java.util.List;

import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.auth.AdminForceLogoutRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AuthService;
import com.coresolution.consultation.util.EmailLogMasking;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 강제 로그아웃 — 대상 계정의 모든 세션·Refresh 토큰 종료 및 {@code tokens_invalidated_at} 기록.
 *
 * <ul>
 *   <li>ADMIN 전용 ({@code @PreAuthorize} + 본문 role 재검증, fail-closed)</li>
 *   <li>대상 사용자는 호출 관리자와 동일 테넌트여야 한다. 테넌트는 관리자 인증 컨텍스트에서만 결정하며
 *       요청 본문·헤더 값으로 다른 테넌트를 지정할 수 없다. 교차 테넌트 요청은 403.</li>
 *   <li>테넌트 앱에는 교차 테넌트 관리자 역할이 없다(레거시 슈퍼 관리자 문자열도 {@link UserRole#ADMIN}
 *       으로 매핑). 따라서 모든 관리자는 자기 테넌트 사용자만 강제 로그아웃할 수 있다.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-09-30
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/sessions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSessionForceLogoutController extends BaseApiController {

    static final String MSG_LOGIN_REQUIRED = "로그인이 필요합니다.";
    static final String MSG_ADMIN_ONLY = "관리자만 강제 로그아웃할 수 있습니다.";
    static final String MSG_TARGET_FORBIDDEN = "해당 사용자에 대한 권한이 없습니다.";
    static final String MSG_FORCE_LOGOUT_DONE = "강제 로그아웃이 완료되었습니다.";

    private final UserRepository userRepository;
    private final AuthService authService;

    /**
     * 동일 테넌트 사용자 계정 전체 강제 로그아웃.
     *
     * @param request 대상 이메일
     * @param session 호출 관리자 세션 (JWT 요청은 SecurityContext 로 보완)
     * @return 200 성공 / 401 미인증 / 403 비관리자·교차 테넌트·대상 없음
     */
    @PostMapping("/force-logout")
    public ResponseEntity<ApiResponse<Void>> forceLogout(
            @Valid @RequestBody AdminForceLogoutRequest request,
            HttpSession session) {
        User admin = SessionUtils.getCurrentUser(session);
        if (admin == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(MSG_LOGIN_REQUIRED));
        }
        if (admin.getRole() == null || !admin.getRole().isAdmin()) {
            log.warn("강제 로그아웃 거부 (비관리자): actorId={}, role={}", admin.getId(), admin.getRole());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(MSG_ADMIN_ONLY));
        }

        String adminTenantId = admin.getTenantId();
        if (!StringUtils.hasText(adminTenantId)) {
            log.warn("강제 로그아웃 거부 (관리자 테넌트 없음): actorId={}", admin.getId());
            return forbiddenTarget();
        }
        String contextTenantId = TenantContextHolder.getTenantId();
        if (StringUtils.hasText(contextTenantId) && !adminTenantId.equals(contextTenantId)) {
            log.warn("강제 로그아웃 거부 (테넌트 컨텍스트 불일치): actorId={}", admin.getId());
            return forbiddenTarget();
        }

        String targetEmail = request.getEmail().trim();
        List<User> targets = userRepository.findAllByTenantIdAndEmail(adminTenantId, targetEmail);
        User target = targets.isEmpty() ? null : targets.get(0);
        if (target == null || !adminTenantId.equals(target.getTenantId())) {
            log.warn("강제 로그아웃 거부 (동일 테넌트 대상 없음): actorId={}, email={}",
                    admin.getId(), EmailLogMasking.maskForLog(targetEmail));
            return forbiddenTarget();
        }

        authService.terminateAllSessionsForUser(target, SessionManagementConstants.END_REASON_ADMIN_FORCE);

        log.info("🔓 관리자 강제 로그아웃 완료: actorId={}, targetUserId={}, email={}",
                admin.getId(), target.getId(), EmailLogMasking.maskForLog(targetEmail));
        return success(MSG_FORCE_LOGOUT_DONE, null);
    }

    private static ResponseEntity<ApiResponse<Void>> forbiddenTarget() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(MSG_TARGET_FORBIDDEN));
    }
}
