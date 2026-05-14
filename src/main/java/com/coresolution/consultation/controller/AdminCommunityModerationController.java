package com.coresolution.consultation.controller;

import java.util.List;
import com.coresolution.consultation.dto.community.CommunityModerationPatchRequest;
import com.coresolution.consultation.dto.community.CommunityModerationQueueItemResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.CommunityService;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 어드민 커뮤니티 검수 큐(BW-4).
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@RestController
@RequestMapping("/api/v1/admin/community")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCommunityModerationController extends BaseApiController {

    private final CommunityService communityService;

    /**
     * 검수 대기 목록.
     *
     * @param session  세션
     * @param pageable 페이지
     * @return 대기 항목
     */
    @GetMapping("/moderation-queue")
    public ResponseEntity<ApiResponse<List<CommunityModerationQueueItemResponse>>> moderationQueue(
            HttpSession session,
            @PageableDefault(size = 100) Pageable pageable) {
        User admin = requireAdminWithTenant(session);
        try {
            TenantContextHolder.setTenantId(admin.getTenantId().trim());
            return success(communityService.moderationQueue(admin, pageable));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 승인·반려 처리(감사 필드: 사유 코드·메모·처리 시각·처리자).
     *
     * @param session 세션
     * @param postId  게시글 id
     * @param request 결정
     * @return 성공 메시지
     */
    @PatchMapping("/posts/{postId}/moderation")
    public ResponseEntity<ApiResponse<Void>> moderate(
            HttpSession session,
            @PathVariable("postId") Long postId,
            @Valid @RequestBody CommunityModerationPatchRequest request) {
        User admin = requireAdminWithTenant(session);
        try {
            TenantContextHolder.setTenantId(admin.getTenantId().trim());
            communityService.moderatePost(admin, postId, request);
            return updated("검수 처리되었습니다.", null);
        } finally {
            TenantContextHolder.clear();
        }
    }

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
