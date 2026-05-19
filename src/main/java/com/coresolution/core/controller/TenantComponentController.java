package com.coresolution.core.controller;

import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.TenantActiveComponentsResponse;
import com.coresolution.core.service.TenantComponentActivationService;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 테넌트 컴포넌트 플래그 조회 (LNB·가드용).
 *
 * @author CoreSolution
 * @since 2026-05-19
 */
@RestController
@RequestMapping("/api/v1/tenant/components")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("isAuthenticated()")
public class TenantComponentController extends BaseApiController {

    private final TenantComponentActivationService tenantComponentActivationService;

    /**
     * 현재 테넌트의 ACTIVE component_code 목록.
     *
     * @param session HTTP 세션
     * @return 활성 컴포넌트 코드
     */
    @GetMapping("/active-codes")
    public ResponseEntity<ApiResponse<TenantActiveComponentsResponse>> listActiveCodes(HttpSession session) {
        String tenantId = resolveTenantId(session);
        List<String> codes = tenantComponentActivationService.listActiveComponentCodes(tenantId);
        return success(TenantActiveComponentsResponse.builder()
                .activeComponentCodes(codes)
                .build());
    }

    private static String resolveTenantId(HttpSession session) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && !tenantId.isBlank()) {
            return tenantId.trim();
        }
        User user = SessionUtils.getCurrentUser(session);
        if (user == null || user.getTenantId() == null || user.getTenantId().isBlank()) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        return user.getTenantId().trim();
    }
}
