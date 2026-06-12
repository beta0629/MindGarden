package com.coresolution.core.controller;

import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.ShopRewardComponentActivationResponse;
import com.coresolution.core.service.TenantComponentActivationService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 수퍼어드민 — 테넌트 컴포넌트 OPS (Shop·Reward 번들).
 *
 * @author CoreSolution
 * @since 2026-05-22
 */
@RestController
@RequestMapping("/api/v1/super-admin/tenants/{tenantId}/components")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
// TODO(PR-2/9 SSOT): SUPER_ADMIN 가드는 코어솔루션 본사(공급사) 권한.
// Ops Portal 분리 별도 후속 PR (ops-portal-migration) 에서 처리.
// 본 PR 에서는 변경 안 함 (회귀 위험 최소화).
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminTenantComponentController extends BaseApiController {

    private final TenantComponentActivationService tenantComponentActivationService;

    /**
     * Shop·Reward 3종 컴포넌트 멱등 활성화.
     *
     * @param tenantId 대상 테넌트 ID
     * @param session  HTTP 세션 (활성화 주체)
     * @return 활성화 결과
     */
    @PostMapping("/shop-reward/activate")
    public ResponseEntity<ApiResponse<ShopRewardComponentActivationResponse>> activateShopRewardBundle(
            @PathVariable String tenantId,
            HttpSession session) {
        String activatedBy = resolveActivatedBy(session);
        ShopRewardComponentActivationResponse result =
                tenantComponentActivationService.activateShopRewardBundle(tenantId, activatedBy);
        return created("Shop·Reward 컴포넌트 활성화가 완료되었습니다.", result);
    }

    private static String resolveActivatedBy(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            return "super-admin";
        }
        return user.getEmail().trim();
    }
}
