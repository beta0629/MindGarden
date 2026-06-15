package com.coresolution.core.controller;

import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.constant.OpsTenantConstants;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.ShopRewardComponentActivationResponse;
import com.coresolution.core.service.TenantComponentActivationService;
import com.coresolution.core.util.LogSanitizer;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 수퍼어드민 — 테넌트 컴포넌트 OPS (Shop·Reward 번들).
 *
 * <h3>권한 가드 — 옵션 3+1 하이브리드 (Defense in Depth)</h3>
 * <ol>
 *   <li>클래스 레벨 {@code @PreAuthorize("hasRole('OPS')")} — Ops Portal 운영자만 호출 가능
 *       ({@code SecurityRoleConstants.ROLE_OPS} Authority).</li>
 *   <li>메서드별 진입부 {@link OpsTenantConstants#isHqTenant(String)} 자체 검증 —
 *       caller 의 컨텍스트 테넌트가 본사인지 확인. {@code @PathVariable tenantId} 는 대상 테넌트로,
 *       caller 의 권한 검증과는 분리된 매개변수.</li>
 * </ol>
 *
 * <p>표준 정합:
 * {@code docs/standards/ROLE_STANDARD.md} §3.2 +
 * {@code docs/project-management/OPS_PORTAL_MIGRATION_PLAN.md} §4.5 (Phase 4).
 * 레거시 {@code hasRole('SUPER_ADMIN')} 매핑은 본 Phase 4 에서 {@code OPS} + HQ 테넌트 가드로
 * 전환 — 4종 SSOT (`ROLE_STANDARD.md` §6.1 §1) 외 enum 잔존 표현식 차단.</p>
 *
 * @author CoreSolution
 * @since 2026-05-22
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/super-admin/tenants/{tenantId}/components")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('OPS')")
public class SuperAdminTenantComponentController extends BaseApiController {

    private static final String HQ_GUARD_DENY_MESSAGE =
        "테넌트 컴포넌트 활성화는 본사(Ops) 테넌트만 호출 가능 — 외부 테넌트 차단";

    private final TenantComponentActivationService tenantComponentActivationService;
    private final OpsTenantConstants opsTenantConstants;

    /**
     * Shop·Reward 3종 컴포넌트 멱등 활성화.
     *
     * @param tenantId 대상 테넌트 ID (활성화 대상 — caller 의 테넌트와는 별개)
     * @param session  HTTP 세션 (활성화 주체)
     * @return 활성화 결과
     */
    @PostMapping("/shop-reward/activate")
    public ResponseEntity<ApiResponse<ShopRewardComponentActivationResponse>> activateShopRewardBundle(
            @PathVariable String tenantId,
            HttpSession session) {
        assertHqTenant();
        String activatedBy = resolveActivatedBy(session);
        ShopRewardComponentActivationResponse result =
                tenantComponentActivationService.activateShopRewardBundle(tenantId, activatedBy);
        return created("Shop·Reward 컴포넌트 활성화가 완료되었습니다.", result);
    }

    private static String resolveActivatedBy(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            return "ops";
        }
        return user.getEmail().trim();
    }

    // ------------------------------------------------------------------
    // Internal — HQ 테넌트 가드 (옵션 3+1 하이브리드, Defense in Depth)
    // ------------------------------------------------------------------

    /**
     * caller 의 컨텍스트 테넌트가 본사(HQ) 인지 검증한다.
     *
     * @throws AccessDeniedException 본사 테넌트가 아닌 경우
     */
    private void assertHqTenant() {
        String currentTenant = TenantContextHolder.getRequiredTenantId();
        if (!opsTenantConstants.isHqTenant(currentTenant)) {
            log.warn("[OPS] 테넌트 컴포넌트 활성화 외부 테넌트 차단 — currentTenant={} (HQ 가드)",
                LogSanitizer.forLog(currentTenant));
            throw new AccessDeniedException(HQ_GUARD_DENY_MESSAGE);
        }
    }
}
