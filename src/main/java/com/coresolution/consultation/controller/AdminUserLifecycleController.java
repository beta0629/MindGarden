package com.coresolution.consultation.controller;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.NotificationType;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.AdminUserRestoreRequest;
import com.coresolution.consultation.dto.lifecycle.PendingDeletionUserDto;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.NotificationLifecycleService;
import com.coresolution.consultation.service.UserLifecycleService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 어드민 사용자 lifecycle Controller — USER_LIFECYCLE_TERMINATION_POLICY §0.1 Q5.
 *
 * <p>Phase 2-β 정착(v1.1) 이후 어드민 강제 종료(DELETED_BY_ADMIN) 7일 보존 윈도우 내 사용자의
 * 조회 / 되돌리기를 단일 진입점으로 제공한다.</p>
 *
 * <ul>
 *   <li>GET  /api/v1/admin/users/pending-deletion — 7일 윈도우 내 강제 종료 사용자 목록</li>
 *   <li>POST /api/v1/admin/users/{userId}/restore — 7일 내 어드민 되돌리기</li>
 * </ul>
 *
 * <p>모든 엔드포인트는 ADMIN 또는 STAFF 권한 필수 ({@code @PreAuthorize}).
 * tenant 격리는 {@link TenantContextHolder} 와 조회 메서드 자체의 tenantId 필터로 보장된다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserLifecycleController extends BaseApiController {

    /** Q5 결정 — 어드민 강제 종료 7일 보존 윈도우. */
    public static final int RETENTION_WINDOW_DAYS = 7;

    /** 기본 페이지 크기. */
    static final int DEFAULT_PAGE_SIZE = 20;
    static final int MAX_PAGE_SIZE = 100;

    /** 역할 필터 ALL 식별자. */
    static final String ROLE_FILTER_ALL = "ALL";

    private final UserRepository userRepository;
    private final UserLifecycleService userLifecycleService;
    private final NotificationLifecycleService notificationLifecycleService;

    /**
     * 어드민 "삭제 대기" 사용자 페이지 조회 — 7일 보존 윈도우 내 DELETED_BY_ADMIN 사용자.
     *
     * @param page 0-based 페이지 인덱스
     * @param size 페이지 크기 (1 ~ {@link #MAX_PAGE_SIZE})
     * @param role 역할 필터 — CLIENT / CONSULTANT / ALL (기본 ALL)
     * @return 페이지 응답
     */
    @GetMapping("/pending-deletion")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> listPendingDeletion(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "" + DEFAULT_PAGE_SIZE) int size,
            @RequestParam(name = "role", defaultValue = ROLE_FILTER_ALL) String role) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("테넌트 컨텍스트가 없습니다."));
        }

        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);
        Pageable pageable = PageRequest.of(safePage, safeSize,
                Sort.by(Sort.Direction.DESC, "deletedAt"));
        LocalDateTime cutoff = LocalDateTime.now().minusDays(RETENTION_WINDOW_DAYS);

        Page<User> userPage;
        if (role == null || role.isBlank() || ROLE_FILTER_ALL.equalsIgnoreCase(role)) {
            userPage = userRepository.findPendingDeletionByTenantId(tenantId, cutoff, pageable);
        } else {
            UserRole roleEnum = parseRoleFilter(role);
            if (roleEnum == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("지원하지 않는 역할 필터입니다: " + role));
            }
            userPage = userRepository.findPendingDeletionByTenantIdAndRole(
                    tenantId, cutoff, roleEnum, pageable);
        }

        Map<Long, String> adminNameCache = resolveAdminNameCache(userPage.getContent());
        List<PendingDeletionUserDto> content = userPage.getContent().stream()
                .map(u -> toDto(u, adminNameCache))
                .collect(Collectors.toList());

        Map<String, Object> body = new HashMap<>();
        body.put("content", content);
        body.put("totalElements", userPage.getTotalElements());
        body.put("totalPages", userPage.getTotalPages());
        body.put("page", userPage.getNumber());
        body.put("size", userPage.getSize());
        body.put("retentionWindowDays", RETENTION_WINDOW_DAYS);

        return success(body);
    }

    /**
     * 어드민 "되돌리기" — DELETED_BY_ADMIN → ACTIVE 전이 (7일 윈도우 내).
     *
     * @param userId 대상 사용자 users.id
     * @param request {@link AdminUserRestoreRequest} (reason 필수)
     * @param session 현재 어드민 세션
     * @return 전이 결과
     */
    @PostMapping("/{userId}/restore")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> restoreUser(
            @PathVariable Long userId,
            @Valid @RequestBody AdminUserRestoreRequest request,
            HttpSession session) {
        log.info("🔄 어드민 되돌리기 요청: userId={}, reason={}", userId, request.getReason());

        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("테넌트 컨텍스트가 없습니다."));
        }

        User target = userRepository.findByTenantIdAndId(tenantId, userId)
                .orElse(null);
        if (target == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("대상 사용자를 찾을 수 없습니다."));
        }

        if (target.getLifecycleState() != LifecycleState.DELETED_BY_ADMIN) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("강제 종료 대기 상태가 아닙니다."));
        }

        // Q5 7일 보존 윈도우 만료 검증 — deleted_at 기준
        LocalDateTime cutoff = LocalDateTime.now().minusDays(RETENTION_WINDOW_DAYS);
        if (target.getDeletedAt() == null || target.getDeletedAt().isBefore(cutoff)) {
            log.warn("어드민 되돌리기 거부 (7일 윈도우 만료): userId={}, deletedAt={}",
                    userId, target.getDeletedAt());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("이미 익명화 진입, 복원 불가 (7일 보존 윈도우 만료)"));
        }

        User currentAdmin = SessionUtils.getCurrentUser(session);
        Long adminUserId = currentAdmin != null ? currentAdmin.getId()
                : SessionUtils.getCurrentUserId();
        if (adminUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("로그인이 필요합니다."));
        }
        String adminRole = currentAdmin != null && currentAdmin.getRole() != null
                ? currentAdmin.getRole().name() : UserRole.ADMIN.name();

        String reason = "ADMIN_RESTORE: " + request.getReason();
        Actor actor = Actor.user(adminUserId, adminRole);
        TransitionResult result = userLifecycleService.transitionTo(
                userId, LifecycleState.ACTIVE, actor, reason);

        notifyAdminRestore(target, currentAdmin, request.getReason());

        Map<String, Object> body = new HashMap<>();
        body.put("userId", result.getUserId());
        body.put("lifecycleState", result.getToState().getCode());
        body.put("restoredAt", result.getTransitionedAt());

        return success("강제 종료 되돌리기가 완료되었습니다.", body);
    }

    /**
     * 사용자 알림 발송 — EMAIL + (선호 채널) 정책 §10. 본 구현은 in-app 알림(notifications)
     * 1행만 적재한다. 채널 라우팅(EMAIL/KAKAO/SMS)은 dispatcher 후속 위임에서 처리.
     */
    void notifyAdminRestore(User target, User adminUser, String reason) {
        if (target == null || target.getTenantId() == null) {
            log.warn("notifyAdminRestore skipped — target/tenantId null: userId={}",
                    target != null ? target.getId() : null);
            return;
        }
        try {
            Long adminUserId = adminUser != null ? adminUser.getId() : null;
            String title = "관리자에 의한 계정 복원 안내";
            String body = "강제 종료된 계정이 관리자에 의해 복원되었습니다. (사유: " + reason + ")";
            notificationLifecycleService.send(
                    target.getTenantId(), target.getId(), adminUserId,
                    NotificationType.WITHDRAWAL, title, body);
        } catch (Exception e) {
            // 알림 발송 실패는 lifecycle 전이를 롤백하지 않는다 (감사 로그는 이미 기록됨).
            log.error("notifyAdminRestore failed (transition committed): userId={}, error={}",
                    target.getId(), e.getMessage(), e);
        }
    }

    /** 역할 필터 문자열 → enum 매핑. 4종 SSOT: CLIENT / CONSULTANT / STAFF / ADMIN 만 허용.
     *  (PLAY/SPEECH 등 레거시 입력은 {@code UserRole.fromString()} 에서 CONSULTANT 로 매핑되지만,
     *  본 메서드는 strict valueOf() 사용으로 null 반환한다.)
     */
    static UserRole parseRoleFilter(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        try {
            return UserRole.valueOf(code.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    /**
     * 페이지 사용자들의 강제 종료 어드민 이름을 batch 조회 (N+1 회피).
     */
    Map<Long, String> resolveAdminNameCache(List<User> users) {
        List<Long> adminIds = users.stream()
                .map(User::getDeletedByAdminId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (adminIds.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(adminIds).stream()
                .collect(Collectors.toMap(User::getId, User::getName, (a, b) -> a));
    }

    /** User → PendingDeletionUserDto 매핑 (이메일 마스킹 + 남은 일 계산). */
    PendingDeletionUserDto toDto(User user, Map<Long, String> adminNameCache) {
        int daysRemaining = calculateDaysRemaining(user.getDeletedAt());
        String deletedByAdminName = user.getDeletedByAdminId() != null
                ? adminNameCache.get(user.getDeletedByAdminId()) : null;
        return PendingDeletionUserDto.builder()
                .userId(user.getId())
                .name(user.getName())
                .emailMasked(maskEmail(user.getEmail()))
                .role(user.getRole() != null ? user.getRole().name() : null)
                .deletedAt(user.getDeletedAt())
                .daysRemaining(daysRemaining)
                .deletedByAdminId(user.getDeletedByAdminId())
                .deletedByAdminName(deletedByAdminName)
                .build();
    }

    /** 7 - elapsed 계산 (0 ~ 7, 음수면 0). */
    static int calculateDaysRemaining(LocalDateTime deletedAt) {
        if (deletedAt == null) {
            return 0;
        }
        long elapsedDays = Duration.between(deletedAt, LocalDateTime.now()).toDays();
        int remaining = (int) (RETENTION_WINDOW_DAYS - elapsedDays);
        if (remaining < 0) {
            return 0;
        }
        if (remaining > RETENTION_WINDOW_DAYS) {
            return RETENTION_WINDOW_DAYS;
        }
        return remaining;
    }

    /**
     * 이메일 마스킹 — 로컬 파트 첫 글자만 노출, 나머지 *. {@code SafeText} 패턴.
     *
     * <p>예: {@code abc@example.com} → {@code a**@example.com}</p>
     */
    static String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return "";
        }
        int atIdx = email.indexOf('@');
        if (atIdx <= 0) {
            return "*".repeat(Math.min(email.length(), 5));
        }
        String local = email.substring(0, atIdx);
        String domain = email.substring(atIdx);
        if (local.length() <= 1) {
            return local + "*" + domain;
        }
        return local.charAt(0) + "*".repeat(local.length() - 1) + domain;
    }
}
