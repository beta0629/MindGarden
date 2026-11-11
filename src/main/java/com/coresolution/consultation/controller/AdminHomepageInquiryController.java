package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.constant.HomepageInquiryConstants;
import com.coresolution.consultation.dto.AdminListPageResult;
import com.coresolution.consultation.dto.request.AdminHomepageInquiryStatusUpdateRequest;
import com.coresolution.consultation.dto.response.AdminHomepageInquiryDetailResponse;
import com.coresolution.consultation.dto.response.AdminHomepageInquiryListItemResponse;
import com.coresolution.consultation.dto.response.AdminHomepageInquiryNewCountResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.HomepageInquiryService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 센터 관리자 홈페이지 문의 API.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@Slf4j
@RestController
@RequestMapping(HomepageInquiryConstants.ADMIN_API_BASE)
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminHomepageInquiryController extends BaseApiController {

    private final HomepageInquiryService homepageInquiryService;

    /**
     * 목록(마스킹).
     *
     * @param status 상태 필터
     * @param page page
     * @param size size
     * @param session 세션
     * @return 목록 + count
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size,
            HttpSession session) {
        String tenantId = requireTenantId(session);
        AdminListPageResult<AdminHomepageInquiryListItemResponse> result =
                homepageInquiryService.listForAdmin(tenantId, status, page, size);
        Map<String, Object> body = new HashMap<>();
        body.put("items", result.getContent());
        body.put("count", result.getTotalCount());
        return success(body);
    }

    /**
     * 신규 문의 건수(뱃지).
     *
     * @param session 세션
     * @return newCount
     */
    @GetMapping("/new-count")
    public ResponseEntity<ApiResponse<AdminHomepageInquiryNewCountResponse>> newCount(
            HttpSession session) {
        String tenantId = requireTenantId(session);
        return success(homepageInquiryService.countNew(tenantId));
    }

    /**
     * 상세(복호화) + 접근 로그.
     *
     * @param id 문의 PK
     * @param session 세션
     * @param request HTTP
     * @return 상세
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminHomepageInquiryDetailResponse>> detail(
            @PathVariable("id") Long id,
            HttpSession session,
            HttpServletRequest request) {
        String tenantId = requireTenantId(session);
        User viewer = SessionUtils.getCurrentUser(session);
        return success(homepageInquiryService.getDetailForAdmin(tenantId, id, viewer, request));
    }

    /**
     * 상태 변경.
     *
     * @param id 문의 PK
     * @param body 상태
     * @param session 세션
     * @return 상세
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AdminHomepageInquiryDetailResponse>> updateStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminHomepageInquiryStatusUpdateRequest body,
            HttpSession session) {
        String tenantId = requireTenantId(session);
        User actor = SessionUtils.getCurrentUser(session);
        return updated(homepageInquiryService.updateStatus(tenantId, id, body, actor));
    }

    private String requireTenantId(HttpSession session) {
        String tenantId = TenantContextHolder.getTenantId();
        if (!StringUtils.hasText(tenantId)) {
            User user = SessionUtils.getCurrentUser(session);
            if (user != null) {
                tenantId = user.getTenantId();
            }
        }
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalStateException("tenantId는 필수입니다.");
        }
        TenantContextHolder.setTenantId(tenantId);
        return tenantId;
    }
}
