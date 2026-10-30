package com.coresolution.consultation.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;
import com.coresolution.consultation.dto.lifecycle.WithdrawalOptions;
import com.coresolution.consultation.dto.lifecycle.WithdrawalRequestDto;
import com.coresolution.consultation.dto.lifecycle.WithdrawalStatusDto;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.UserLifecycleService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.security.PasswordService;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 자발 회원 탈퇴 Controller — USER_LIFECYCLE_TERMINATION_POLICY §2.3 자발 경로.
 *
 * <p>3 엔드포인트:</p>
 * <ul>
 *   <li>POST /api/v1/mypage/withdrawal/request — 본인 확인 후 WITHDRAWAL_PENDING 진입</li>
 *   <li>POST /api/v1/mypage/withdrawal/cancel — 30일 유예 내 본인 취소 (ACTIVE 복귀)</li>
 *   <li>GET  /api/v1/mypage/withdrawal/status — 현재 유예 상태·만료 시각 조회</li>
 * </ul>
 *
 * <p>모든 엔드포인트는 본인 인증 필수. {@link SessionUtils#getCurrentUser(HttpSession)} 로
 * 현재 사용자 식별. 본인 PK 외 다른 PK 로의 조작은 절대 허용하지 않는다 (테넌트 격리·본인
 * 의지 우선).</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/mypage/withdrawal")
@RequiredArgsConstructor
public class UserWithdrawalController extends BaseApiController {

    /** Q3 결정 — 자발 탈퇴 30일 유예. */
    public static final int WITHDRAWAL_GRACE_PERIOD_DAYS = 30;

    /**
     * 소셜(SIWA 등) 사용자 본인 확인 문구 — 대소문자 구분.
     * App Store 5.1.1(v) 계정 삭제: 임시 비밀번호를 모르는 SIWA 사용자용.
     */
    public static final String SOCIAL_CONFIRM_PHRASE = "DELETE";

    private final UserLifecycleService userLifecycleService;
    private final UserService userService;
    private final PasswordService passwordService;

    /**
     * 자발 탈퇴 신청 — ACTIVE → WITHDRAWAL_PENDING 전이.
     *
     * @param session 세션
     * @param request 비밀번호 재확인 또는 소셜 confirmPhrase + 사유
     * @return 전이 결과
     */
    @PostMapping("/request")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestWithdrawal(
            HttpSession session,
            @Valid @RequestBody WithdrawalRequestDto request) {
        User currentUser = requireCurrentUser(session);
        ensureTenantBound(currentUser);

        ResponseEntity<ApiResponse<Map<String, Object>>> identityRejected =
                verifyWithdrawalIdentity(currentUser, request);
        if (identityRejected != null) {
            return identityRejected;
        }

        Actor actor = Actor.user(currentUser.getId(), currentUser.getRole().name());
        WithdrawalOptions options = WithdrawalOptions.of(request.isDeleteCommunityBodyOrFalse());
        TransitionResult result = userLifecycleService.requestWithdrawal(
                currentUser.getId(), actor, options);

        Map<String, Object> body = new HashMap<>();
        body.put("userId", result.getUserId());
        body.put("lifecycleState", result.getToState().getCode());
        body.put("withdrawalRequestedAt", result.getTransitionedAt());
        body.put("withdrawalExpiresAt",
                result.getTransitionedAt().plusDays(WITHDRAWAL_GRACE_PERIOD_DAYS));
        body.put("graceDays", WITHDRAWAL_GRACE_PERIOD_DAYS);
        body.put("deleteCommunityBody", options.isDeleteCommunityBody());

        return success("회원 탈퇴 신청이 접수되었습니다.", body);
    }

    /**
     * 자발 탈퇴 취소 — WITHDRAWAL_PENDING → ACTIVE 복귀 (30일 유예 내).
     *
     * @param session 세션
     * @return 전이 결과
     */
    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancelWithdrawal(HttpSession session) {
        User currentUser = requireCurrentUser(session);
        ensureTenantBound(currentUser);

        if (currentUser.getLifecycleState() != LifecycleState.WITHDRAWAL_PENDING) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("탈퇴 신청 상태가 아닙니다."));
        }

        Actor actor = Actor.user(currentUser.getId(), currentUser.getRole().name());
        TransitionResult result = userLifecycleService.cancelWithdrawal(currentUser.getId(), actor);

        Map<String, Object> body = new HashMap<>();
        body.put("userId", result.getUserId());
        body.put("lifecycleState", result.getToState().getCode());
        body.put("transitionedAt", result.getTransitionedAt());

        return success("회원 탈퇴 신청이 취소되었습니다.", body);
    }

    /**
     * 자발 탈퇴 현황 조회 — 30일 유예 만료 시각 + 취소 가능 여부.
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<WithdrawalStatusDto>> getStatus(HttpSession session) {
        User currentUser = requireCurrentUser(session);
        ensureTenantBound(currentUser);

        WithdrawalStatusDto status = WithdrawalStatusDto.builder()
                .userId(currentUser.getId())
                .lifecycleState(currentUser.getLifecycleState())
                .withdrawalRequestedAt(currentUser.getWithdrawalRequestedAt())
                .withdrawalExpiresAt(resolveWithdrawalExpiresAt(currentUser))
                .cancellable(currentUser.getLifecycleState() == LifecycleState.WITHDRAWAL_PENDING)
                .build();

        return success(status);
    }

    private LocalDateTime resolveWithdrawalExpiresAt(User user) {
        if (user.getLifecycleState() != LifecycleState.WITHDRAWAL_PENDING
                || user.getWithdrawalRequestedAt() == null) {
            return null;
        }
        return user.getWithdrawalRequestedAt().plusDays(WITHDRAWAL_GRACE_PERIOD_DAYS);
    }

    private User requireCurrentUser(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }
        // userService 조회로 최신 lifecycle_state 동기 (세션 캐시 stale 보호)
        return userService.findById(user.getId()).orElse(user);
    }

    /**
     * 테넌트 fail-closed — 컨텍스트·사용자 tenantId 공백/null 거부, 불일치 거부.
     * AdminUserLifecycle 패턴과 동일하게 테넌트 없는 요청을 허용하지 않는다.
     *
     * @param user 현재 사용자
     * @throws IllegalStateException 테넌트 바인딩 실패
     */
    private void ensureTenantBound(User user) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("테넌트 컨텍스트가 없습니다.");
        }
        if (user.getTenantId() == null || user.getTenantId().isBlank()) {
            throw new IllegalStateException("사용자 테넌트 정보가 없습니다.");
        }
        if (!tenantId.equals(user.getTenantId())) {
            throw new IllegalStateException("테넌트 컨텍스트 불일치");
        }
    }

    /**
     * 본인 확인 — 비밀번호 경로 또는 소셜 confirmPhrase 경로.
     *
     * @param user 현재 사용자
     * @param request 탈퇴 요청
     * @return 거부 시 ResponseEntity, 통과 시 null
     */
    private ResponseEntity<ApiResponse<Map<String, Object>>> verifyWithdrawalIdentity(
            User user, WithdrawalRequestDto request) {
        boolean hasPassword = StringUtils.hasText(request.getPassword());
        boolean hasConfirm = StringUtils.hasText(request.getConfirmPhrase());

        if (!hasPassword && !hasConfirm) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("비밀번호 또는 확인 문구가 필요합니다."));
        }

        if (hasPassword) {
            if (!passwordService.matches(request.getPassword(), user.getPassword())) {
                log.warn("Withdrawal request rejected: password mismatch userId={}", user.getId());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("비밀번호가 일치하지 않습니다."));
            }
            return null;
        }

        // password blank → social confirmPhrase only
        if (!isSocialLinked(user)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("비밀번호 재확인이 필요합니다."));
        }
        if (!SOCIAL_CONFIRM_PHRASE.equals(request.getConfirmPhrase())) {
            log.warn("Withdrawal request rejected: confirmPhrase mismatch userId={}", user.getId());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("확인 문구가 일치하지 않습니다."));
        }
        return null;
    }

    /**
     * 소셜 연동 사용자 여부 — appleSub 또는 socialProvider 비공백.
     *
     * @param user 사용자
     * @return 소셜 연동이면 true
     */
    private boolean isSocialLinked(User user) {
        return StringUtils.hasText(user.getAppleSub())
                || StringUtils.hasText(user.getSocialProvider());
    }
}
