package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.DormantUserDetailResponse;
import com.coresolution.consultation.dto.lifecycle.DormantUserSummaryResponse;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AdminLifecycleService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 어드민 휴면 사용자 모니터링 Controller — Phase 4
 * (USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.9 + §10.12).
 *
 * <p>4 endpoint:</p>
 * <ul>
 *   <li>GET    /api/v1/admin/lifecycle/dormant-users?page=...&size=... — 페이지네이션 목록</li>
 *   <li>GET    /api/v1/admin/lifecycle/dormant-users/{userId} — 상세 (vault 메타데이터, PII 미노출)</li>
 *   <li>POST   /api/v1/admin/lifecycle/dormant-users/{userId}/reactivate — 강제 복귀</li>
 *   <li>DELETE /api/v1/admin/lifecycle/dormant-users/{userId} — 강제 즉시 익명화</li>
 * </ul>
 *
 * <p>모든 endpoint 는 어드민 권한 + tenantId 격리 필수. {@link SessionUtils#getCurrentUser}
 * 기반 본인 인증 후 admin role 검증.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/lifecycle/dormant-users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminLifecycleDormantUsersController extends BaseApiController {

    private final AdminLifecycleService adminLifecycleService;

    /**
     * 휴면 사용자 페이지네이션 목록.
     *
     * @param session  세션
     * @param pageable 페이지 정보 (default 20)
     * @return 목록 응답
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<DormantUserSummaryResponse>>> list(
            HttpSession session,
            @PageableDefault(size = 20) Pageable pageable) {
        User admin = requireAdminWithTenant(session);
        try {
            TenantContextHolder.setTenantId(admin.getTenantId().trim());
            Page<DormantUserSummaryResponse> page =
                    adminLifecycleService.listDormantUsers(admin.getTenantId(), pageable);
            return success(page);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 휴면 사용자 상세.
     *
     * @param session 세션
     * @param userId  대상 users.id
     * @return 상세 응답
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<DormantUserDetailResponse>> detail(
            HttpSession session,
            @PathVariable("userId") Long userId) {
        User admin = requireAdminWithTenant(session);
        try {
            TenantContextHolder.setTenantId(admin.getTenantId().trim());
            DormantUserDetailResponse response =
                    adminLifecycleService.getDormantUserDetail(admin.getTenantId(), userId);
            return success(response);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 휴면 사용자 강제 복귀.
     *
     * @param session 세션
     * @param userId  대상 users.id
     * @return 전이 결과
     */
    @PostMapping("/{userId}/reactivate")
    public ResponseEntity<ApiResponse<TransitionResult>> reactivate(
            HttpSession session,
            @PathVariable("userId") Long userId) {
        User admin = requireAdminWithTenant(session);
        try {
            TenantContextHolder.setTenantId(admin.getTenantId().trim());
            Actor actor = Actor.user(admin.getId(), admin.getRole().name());
            TransitionResult result = adminLifecycleService.reactivateDormantUser(
                    admin.getTenantId(), userId, actor);
            return success("휴면 사용자가 활성 상태로 복귀했습니다.", result);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 휴면 사용자 강제 즉시 익명화.
     *
     * @param session 세션
     * @param userId  대상 users.id
     * @return 전이 결과
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<TransitionResult>> forceAnonymize(
            HttpSession session,
            @PathVariable("userId") Long userId) {
        User admin = requireAdminWithTenant(session);
        try {
            TenantContextHolder.setTenantId(admin.getTenantId().trim());
            Actor actor = Actor.user(admin.getId(), admin.getRole().name());
            TransitionResult result = adminLifecycleService.forceAnonymizeDormantUser(
                    admin.getTenantId(), userId, actor);
            return success("휴면 사용자가 즉시 익명화되었습니다.", result);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 어드민 세션 사용자 + 테넌트 컨텍스트 검증.
     *
     * @param session 세션
     * @return admin user
     */
    private static User requireAdminWithTenant(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        if (user.getRole() == null || !user.getRole().isAdmin()) {
            throw new AccessDeniedException("관리자만 이용할 수 있습니다.");
        }
        if (user.getTenantId() == null || user.getTenantId().isBlank()) {
            throw new AccessDeniedException("테넌트 정보가 없습니다.");
        }
        return user;
    }
}
