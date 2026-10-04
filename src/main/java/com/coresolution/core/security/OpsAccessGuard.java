package com.coresolution.core.security;

import com.coresolution.core.constant.OpsTenantConstants;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.util.LogSanitizer;
import com.coresolution.core.util.OpsPermissionUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/**
 * 서버 전역(플랫폼) 운영 API 가드 — Ops 운영자이면서 본사(HQ) 테넌트일 때만 허용한다.
 *
 * <p>백업 파일·서버 전체 API 성능 통계처럼 특정 테넌트에 속하지 않는 자원은 테넌트 관리자에게 열지 않는다.
 * {@code ROLE_OPS} 만으로는 외부 테넌트가 Ops 권한을 갖게 되는 경우를 막지 못하므로 본사 테넌트 검증을 함께 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OpsAccessGuard {

    public static final String DENIAL_HQ_OPS_ONLY = "본사 운영자만 이용할 수 있습니다.";

    private final OpsTenantConstants opsTenantConstants;

    /**
     * Ops 운영자 + 본사 테넌트인지 검증한다.
     *
     * @throws org.springframework.security.authentication.AuthenticationCredentialsNotFoundException 미인증
     * @throws AccessDeniedException Ops 권한이 없거나 본사 테넌트가 아닌 경우 ({@link #DENIAL_HQ_OPS_ONLY})
     */
    public void requireHqOps() {
        try {
            OpsPermissionUtils.requireOps();
        } catch (AccessDeniedException e) {
            throw new AccessDeniedException(DENIAL_HQ_OPS_ONLY);
        }
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || !opsTenantConstants.isHqTenant(tenantId)) {
            log.warn("[OPS] 플랫폼 운영 API 외부 테넌트 차단 — tenant={}", LogSanitizer.forLog(tenantId));
            throw new AccessDeniedException(DENIAL_HQ_OPS_ONLY);
        }
    }
}
