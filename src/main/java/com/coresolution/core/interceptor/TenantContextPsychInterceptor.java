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
 * 심리검사 API(/api/v1/assessments/psych/*) 요청 시 인증된 사용자의 tenantId를
 * TenantContext에 설정합니다. 재로그인·세션 갱신 후에도 목록이 비어 보이는 문제를
 * 방지하기 위해, 필터에서 헤더 등으로 설정된 값이 있어도 인증 principal의 tenantId를
 * 우선 사용합니다.
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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return true;
        }
        // 인증된 User에서 tenantId 확보 (재로그인 후에도 동일 사용자·동일 테넌트로 조회되도록)
        User user = null;
        Object details = auth.getDetails();
        if (details instanceof User u) {
            user = u;
        }
        if (user == null) {
            Object principal = auth.getPrincipal();
            if (principal instanceof User u) {
                user = u;
            }
        }
        if (user != null) {
            String tenantId = user.getTenantId();
            if (tenantId != null && !tenantId.isEmpty()) {
                String current = TenantContextHolder.getTenantId();
                if (!tenantId.equals(current)) {
                    log.debug("Psych API: TenantContext를 인증 사용자 기준으로 설정 (기존={}, 사용자={})", current, tenantId);
                }
                TenantContextHolder.setTenantId(tenantId);
            }
        }
        return true;
    }
}
