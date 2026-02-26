package com.coresolution.core.interceptor;

import com.coresolution.consultation.entity.User;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 심리검사 API(/api/v1/assessments/psych/*) 요청 시 TenantContext가 비어 있으면
 * SecurityContext의 인증 사용자(User)에서 tenantId를 설정합니다.
 * 필터 체인에서 tenantId가 설정되지 않은 edge case를 보완합니다.
 *
 * @author Core Solution
 * @since 2026-02-27
 */
@Slf4j
@Component
public class TenantContextPsychInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull Object handler) {
        if (TenantContextHolder.getTenantId() != null && !TenantContextHolder.getTenantId().isEmpty()) {
            return true;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return true;
        }
        Object details = auth.getDetails();
        if (details instanceof User user) {
            String tenantId = user.getTenantId();
            if (tenantId != null && !tenantId.isEmpty()) {
                TenantContextHolder.setTenantId(tenantId);
                log.debug("TenantContext set from Psych interceptor (principal): {}", tenantId);
            }
        }
        return true;
    }
}
