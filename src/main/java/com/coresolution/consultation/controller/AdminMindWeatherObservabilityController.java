package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.admin.wellness.MindWeatherAdminCardItemResponse;
import com.coresolution.consultation.dto.admin.wellness.MindWeatherAdminSummaryResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AdminMindWeatherObservabilityService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * BW-6 「마음 날씨」어드민 관측 API(읽기 전용).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@RestController
@RequestMapping("/api/v1/admin/wellness/mind-weather")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminMindWeatherObservabilityController extends BaseApiController {

    private final AdminMindWeatherObservabilityService adminMindWeatherObservabilityService;

    /**
     * 카드 목록(페이징).
     *
     * @param session  세션
     * @param pageable 페이지·정렬
     * @return 페이지
     */
    @GetMapping("/cards")
    public ResponseEntity<ApiResponse<Page<MindWeatherAdminCardItemResponse>>> listCards(
            HttpSession session,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        User admin = requireAdminWithTenant(session);
        try {
            TenantContextHolder.setTenantId(admin.getTenantId().trim());
            return success(adminMindWeatherObservabilityService.listCards(admin.getTenantId().trim(), pageable));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 요약 지표.
     *
     * @param session 세션
     * @return 요약
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<MindWeatherAdminSummaryResponse>> summary(HttpSession session) {
        User admin = requireAdminWithTenant(session);
        try {
            TenantContextHolder.setTenantId(admin.getTenantId().trim());
            return success(adminMindWeatherObservabilityService.summarize(admin.getTenantId().trim()));
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
