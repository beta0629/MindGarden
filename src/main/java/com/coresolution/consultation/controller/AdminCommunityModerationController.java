package com.coresolution.consultation.controller;

import java.util.List;
import java.util.Locale;
import com.coresolution.consultation.constant.CommunityModerationStatus;
import com.coresolution.consultation.constant.CommunityReportStatus;
import com.coresolution.consultation.dto.community.CommunityModerationPatchRequest;
import com.coresolution.consultation.dto.community.CommunityModerationQueueItemResponse;
import com.coresolution.consultation.dto.community.CommunityReportQueueItemResponse;
import com.coresolution.consultation.dto.community.CommunityReportResolutionRequest;
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
import org.springframework.web.bind.annotation.RequestParam;
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
     * 검수 큐 목록 — 상태 필터 지원.
     *
     * <p>{@code status} 가 비어 있거나 {@code ALL} 이면 전체(PENDING + APPROVED + REJECTED)를 반환한다.
     * 그 외 값은 {@link CommunityModerationStatus} 와 매칭되어야 하며(대소문자 무시), 매칭되지 않으면 400.</p>
     *
     * @param session  세션
     * @param status   조회 상태 필터 ({@code null} / {@code ""} / {@code ALL} = 전체, PENDING / APPROVED / REJECTED)
     * @param pageable 페이지
     * @return 검수 큐 항목
     */
    @GetMapping("/moderation-queue")
    public ResponseEntity<ApiResponse<List<CommunityModerationQueueItemResponse>>> moderationQueue(
            HttpSession session,
            @RequestParam(value = "status", required = false) String status,
            @PageableDefault(size = 100) Pageable pageable) {
        User admin = requireAdminWithTenant(session);
        CommunityModerationStatus parsed = parseModerationStatusOrNull(status);
        try {
            TenantContextHolder.setTenantId(admin.getTenantId().trim());
            return success(communityService.moderationQueue(admin, parsed, pageable));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * {@code status} 쿼리 파라미터 파싱.
     *
     * <ul>
     *     <li>{@code null} / 빈 문자열 / {@code "ALL"} → {@code null} (전체)</li>
     *     <li>대소문자 무시하여 {@link CommunityModerationStatus} 와 매칭</li>
     *     <li>매칭 실패 시 {@link IllegalArgumentException} → 글로벌 핸들러가 HTTP 400 으로 변환</li>
     * </ul>
     *
     * @param raw 원본 쿼리 파라미터
     * @return 매칭 enum 또는 {@code null}
     */
    private static CommunityModerationStatus parseModerationStatusOrNull(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        String upper = trimmed.toUpperCase(Locale.ROOT);
        if ("ALL".equals(upper)) {
            return null;
        }
        try {
            return CommunityModerationStatus.valueOf(upper);
        } catch (IllegalArgumentException ignore) {
            throw new IllegalArgumentException("지원하지 않는 status 값입니다: " + raw);
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

    /**
     * Apple T2 (1.2 UGC) — 어드민 신고 처리 큐 목록.
     *
     * @param session  세션
     * @param status   상태 필터 (null/ALL/OPEN/UNDER_REVIEW/RESOLVED/REJECTED)
     * @param pageable 페이지
     * @return 신고 큐 항목
     */
    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<CommunityReportQueueItemResponse>>> reportQueue(
            HttpSession session,
            @RequestParam(value = "status", required = false) String status,
            @PageableDefault(size = 50) Pageable pageable) {
        User admin = requireAdminWithTenant(session);
        CommunityReportStatus parsed = parseReportStatusOrNull(status);
        try {
            TenantContextHolder.setTenantId(admin.getTenantId().trim());
            return success(communityService.listReportQueue(admin, parsed, pageable));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * Apple T2 (1.2 UGC) — 신고 처리 (RESOLVED/REJECTED + 액션 적용).
     *
     * @param session  세션
     * @param reportId 신고 row id
     * @param request  처리 결정
     * @return 빈 성공
     */
    @PatchMapping("/reports/{reportId}")
    public ResponseEntity<ApiResponse<Void>> resolveReport(
            HttpSession session,
            @PathVariable("reportId") Long reportId,
            @Valid @RequestBody CommunityReportResolutionRequest request) {
        User admin = requireAdminWithTenant(session);
        try {
            TenantContextHolder.setTenantId(admin.getTenantId().trim());
            communityService.resolveReport(admin, reportId, request);
            return updated("신고가 처리되었습니다.", null);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * Apple T2 (1.2 UGC) — 게시글 숨김 처리.
     *
     * @param session 세션
     * @param postId  게시글 id
     * @param reason  숨김 사유 메모(선택)
     * @return 빈 성공
     */
    @PatchMapping("/posts/{postId}/hide")
    public ResponseEntity<ApiResponse<Void>> hidePost(
            HttpSession session,
            @PathVariable("postId") Long postId,
            @RequestParam(value = "reason", required = false) String reason) {
        User admin = requireAdminWithTenant(session);
        try {
            TenantContextHolder.setTenantId(admin.getTenantId().trim());
            communityService.hidePost(admin, postId, reason, true);
            return updated("게시글이 숨김 처리되었습니다.", null);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * Apple T2 (1.2 UGC) — 게시글 숨김 복원.
     *
     * @param session 세션
     * @param postId  게시글 id
     * @return 빈 성공
     */
    @PatchMapping("/posts/{postId}/unhide")
    public ResponseEntity<ApiResponse<Void>> unhidePost(
            HttpSession session,
            @PathVariable("postId") Long postId) {
        User admin = requireAdminWithTenant(session);
        try {
            TenantContextHolder.setTenantId(admin.getTenantId().trim());
            communityService.hidePost(admin, postId, null, false);
            return updated("게시글 숨김이 해제되었습니다.", null);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * Apple T2 (1.2 UGC) — 댓글 숨김 처리.
     *
     * @param session   세션
     * @param commentId 댓글 id
     * @param reason    숨김 사유 메모(선택)
     * @return 빈 성공
     */
    @PatchMapping("/comments/{commentId}/hide")
    public ResponseEntity<ApiResponse<Void>> hideComment(
            HttpSession session,
            @PathVariable("commentId") Long commentId,
            @RequestParam(value = "reason", required = false) String reason) {
        User admin = requireAdminWithTenant(session);
        try {
            TenantContextHolder.setTenantId(admin.getTenantId().trim());
            communityService.hideComment(admin, commentId, reason, true);
            return updated("댓글이 숨김 처리되었습니다.", null);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * Apple T2 (1.2 UGC) — 댓글 숨김 복원.
     *
     * @param session   세션
     * @param commentId 댓글 id
     * @return 빈 성공
     */
    @PatchMapping("/comments/{commentId}/unhide")
    public ResponseEntity<ApiResponse<Void>> unhideComment(
            HttpSession session,
            @PathVariable("commentId") Long commentId) {
        User admin = requireAdminWithTenant(session);
        try {
            TenantContextHolder.setTenantId(admin.getTenantId().trim());
            communityService.hideComment(admin, commentId, null, false);
            return updated("댓글 숨김이 해제되었습니다.", null);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 신고 큐 상태 파라미터 파싱 (ALL/null = 전체).
     */
    private static CommunityReportStatus parseReportStatusOrNull(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        String upper = trimmed.toUpperCase(Locale.ROOT);
        if ("ALL".equals(upper)) {
            return null;
        }
        try {
            return CommunityReportStatus.valueOf(upper);
        } catch (IllegalArgumentException ignore) {
            throw new IllegalArgumentException("지원하지 않는 status 값입니다: " + raw);
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
