package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.admin.wellness.MindGardenAdminSnapshotResponse;
import com.coresolution.consultation.dto.admin.wellness.MindGardenAdminSummaryResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ClientMindGardenService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * BW-6 「마음 정원」어드민 관측 API(읽기 전용).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@RestController
@RequestMapping("/api/v1/admin/wellness/mind-garden")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminMindGardenObservabilityController extends BaseApiController {

    private final ClientMindGardenService clientMindGardenService;

    /**
     * 테넌트 내 사용자별 인메모리 스냅샷 목록.
     *
     * @param session  세션
     * @param pageable 페이지(정렬은 서비스에서 최근 동기 기준 고정)
     * @return 페이지
     */
    @GetMapping("/snapshots")
    public ResponseEntity<ApiResponse<Page<MindGardenAdminSnapshotResponse>>> snapshots(
            HttpSession session,
            @PageableDefault(size = 20) Pageable pageable) {
        User admin = requireAdminWithTenant(session);
        try {
            TenantContextHolder.setTenantId(admin.getTenantId().trim());
            return success(clientMindGardenService.listSnapshotsForAdmin(admin.getTenantId().trim(), pageable));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 테넌트 단위 요약.
     *
     * @param session 세션
     * @return 요약
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<MindGardenAdminSummaryResponse>> summary(HttpSession session) {
        User admin = requireAdminWithTenant(session);
        try {
            TenantContextHolder.setTenantId(admin.getTenantId().trim());
            return success(clientMindGardenService.summarizeForAdmin(admin.getTenantId().trim()));
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
