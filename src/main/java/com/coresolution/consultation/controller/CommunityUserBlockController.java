package com.coresolution.consultation.controller;

import java.util.List;
import com.coresolution.consultation.dto.community.CommunityUserBlockRequest;
import com.coresolution.consultation.dto.community.CommunityUserBlockResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.CommunityUserBlockService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Apple T2 (1.2 UGC) — 커뮤니티 사용자 차단 API.
 *
 * <p>오케스트레이션 §7 T2-Coder 정확 인용:
 * <ul>
 *   <li>{@code POST /api/v1/community/users/{userId}/block} — 차단</li>
 *   <li>{@code DELETE /api/v1/community/users/{userId}/block} — 차단 해제</li>
 *   <li>{@code GET /api/v1/community/users/blocked} — 차단 목록 조회</li>
 * </ul>
 * </p>
 *
 * <p>차단은 단방향이며 차단된 사용자의 게시글·댓글은 차단자 피드에서 자동 비노출된다.
 * 모든 엔드포인트는 세션 사용자 + 테넌트 격리 검증을 거친다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@RestController
@RequestMapping("/api/v1/community/users")
@RequiredArgsConstructor
public class CommunityUserBlockController extends BaseApiController {

    private final CommunityUserBlockService communityUserBlockService;

    /**
     * 사용자 차단(멱등 — 이미 차단 중이면 NO-OP).
     *
     * @param session       세션
     * @param userId        차단 대상 users.id
     * @param request       차단 사유(선택, 운영 통계용)
     * @return 차단 row id
     */
    @PostMapping("/{userId}/block")
    public ResponseEntity<ApiResponse<Long>> blockUser(
            HttpSession session,
            @PathVariable("userId") Long userId,
            @Valid @RequestBody(required = false) CommunityUserBlockRequest request) {
        User actor = requireTenantUser(session);
        try {
            TenantContextHolder.setTenantId(actor.getTenantId().trim());
            Long blockId = communityUserBlockService.blockUser(actor, userId, request);
            return created("사용자가 차단되었습니다.", blockId);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 차단 해제(soft delete).
     *
     * @param session 세션
     * @param userId  차단 해제 대상 users.id
     * @return 빈 성공
     */
    @DeleteMapping("/{userId}/block")
    public ResponseEntity<ApiResponse<Void>> unblockUser(
            HttpSession session,
            @PathVariable("userId") Long userId) {
        User actor = requireTenantUser(session);
        try {
            TenantContextHolder.setTenantId(actor.getTenantId().trim());
            communityUserBlockService.unblockUser(actor, userId);
            return deleted("차단을 해제했습니다.");
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 차단 목록 조회.
     *
     * @param session  세션
     * @param pageable 페이지 (기본 size=50, createdAt DESC)
     * @return 차단 사용자 목록
     */
    @GetMapping("/blocked")
    public ResponseEntity<ApiResponse<List<CommunityUserBlockResponse>>> listBlocked(
            HttpSession session,
            @PageableDefault(size = 50) Pageable pageable) {
        User actor = requireTenantUser(session);
        try {
            TenantContextHolder.setTenantId(actor.getTenantId().trim());
            return success(communityUserBlockService.listBlockedUsers(actor, pageable));
        } finally {
            TenantContextHolder.clear();
        }
    }

    private static User requireTenantUser(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        if (user.getTenantId() == null || user.getTenantId().isBlank()) {
            throw new AccessDeniedException("테넌트 정보가 없습니다.");
        }
        return user;
    }
}
