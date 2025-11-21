package com.coresolution.core.filter;

import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.BranchRepository;
import com.coresolution.consultation.utils.SessionUtils;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Tenant Context Filter
 * HTTP 요청에서 tenant_id를 추출하여 TenantContext에 설정
 * 
 * 우선순위:
 * 1. HTTP 헤더 (X-Tenant-Id)
 * 2. 세션의 User 정보를 통해 Branch의 tenant_id 조회
 * 3. 세션에 저장된 tenant_id
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Component
@Order(1) // SessionBasedAuthenticationFilter 이전에 실행
@RequiredArgsConstructor
public class TenantContextFilter implements Filter {
    
    private final BranchRepository branchRepository;
    
    /**
     * HTTP 헤더에서 tenant_id 추출 키
     */
    private static final String TENANT_ID_HEADER = "X-Tenant-Id";
    
    /**
     * 세션에서 tenant_id를 저장하는 키
     */
    private static final String SESSION_TENANT_ID = "tenantId";
    
    /**
     * 세션에서 branch_id를 저장하는 키
     */
    private static final String SESSION_BRANCH_ID = "branchId";
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpSession session = httpRequest.getSession(false);
        
        try {
            String tenantId = extractTenantId(httpRequest, session);
            String branchId = extractBranchId(httpRequest, session);
            
            // TenantContext에 설정
            if (tenantId != null && !tenantId.isEmpty()) {
                TenantContextHolder.setTenantId(tenantId);
                log.debug("Tenant context set from filter: {}", tenantId);
            }
            
            if (branchId != null && !branchId.isEmpty()) {
                TenantContextHolder.setBranchId(branchId);
                log.debug("Branch context set from filter: {}", branchId);
            }
            
            // 다음 필터로 진행
            chain.doFilter(request, response);
            
        } finally {
            // 요청 종료 시 TenantContext 정리 (메모리 누수 방지)
            TenantContextHolder.clear();
        }
    }
    
    /**
     * tenant_id 추출
     * 
     * @param request HTTP 요청
     * @param session HTTP 세션
     * @return tenant_id (없으면 null)
     */
    private String extractTenantId(HttpServletRequest request, HttpSession session) {
        // 1. HTTP 헤더에서 추출 (우선순위 1)
        String tenantId = request.getHeader(TENANT_ID_HEADER);
        if (tenantId != null && !tenantId.isEmpty()) {
            log.debug("Tenant ID extracted from header: {}", tenantId);
            return tenantId;
        }
        
        // 1-1. Host 헤더에서 테넌트 서브도메인 추출 (우선순위 1-1)
        // 예: tenant1.dev.core-solution.co.kr → tenant1
        // 예: tenant1.core-solution.co.kr → tenant1
        String host = request.getHeader("Host");
        if (host != null && !host.isEmpty()) {
            String subdomain = extractTenantSubdomain(host);
            if (subdomain != null && !subdomain.isEmpty()) {
                // 서브도메인을 tenant_id로 사용 (향후 매핑 테이블 조회로 변경 가능)
                log.debug("Tenant subdomain extracted from Host header: {} (from {})", subdomain, host);
                // TODO: 서브도메인 → tenant_id 매핑 테이블 조회 로직 추가 필요
                // 현재는 서브도메인을 그대로 tenant_id로 사용 (임시)
                return subdomain;
            }
        }
        
        // 2. 세션에서 User 정보를 통해 Branch의 tenant_id 조회 (우선순위 2)
        if (session != null) {
            User user = SessionUtils.getCurrentUser(session);
            if (user != null && user.getBranchCode() != null) {
                try {
                    Branch branch = branchRepository.findByBranchCodeAndIsDeletedFalse(user.getBranchCode())
                        .orElse(null);
                    
                    if (branch != null && branch.getTenantId() != null) {
                        // Branch 엔티티에서 tenant_id 조회
                        // 세션에 tenant_id 저장 (다음 요청에서 빠르게 조회)
                        session.setAttribute(SESSION_TENANT_ID, branch.getTenantId());
                        log.debug("Tenant ID extracted from user branch: {}", branch.getTenantId());
                        return branch.getTenantId();
                    }
                } catch (Exception e) {
                    log.warn("Failed to extract tenant ID from user branch: {}", e.getMessage());
                }
            }
            
            // 3. 세션에 저장된 tenant_id 사용 (우선순위 3)
            Object sessionTenantId = session.getAttribute(SESSION_TENANT_ID);
            if (sessionTenantId != null) {
                log.debug("Tenant ID extracted from session: {}", sessionTenantId);
                return sessionTenantId.toString();
            }
        }
        
        // 4. tenant_id를 찾을 수 없는 경우
        log.trace("Tenant ID not found in request");
        return null;
    }
    
    /**
     * Host 헤더에서 테넌트 서브도메인 추출
     * 
     * @param host Host 헤더 값 (예: tenant1.dev.core-solution.co.kr, tenant1.core-solution.co.kr)
     * @return 테넌트 서브도메인 (예: tenant1) 또는 null
     */
    private String extractTenantSubdomain(String host) {
        if (host == null || host.isEmpty()) {
            return null;
        }
        
        // 포트 제거 (예: tenant1.dev.core-solution.co.kr:443 → tenant1.dev.core-solution.co.kr)
        String hostWithoutPort = host.split(":")[0];
        
        // 개발 환경: *.dev.core-solution.co.kr
        // 운영 환경: *.core-solution.co.kr
        // 기존: *.m-garden.co.kr
        
        // 패턴 매칭
        String[] patterns = {
            "\\.dev\\.core-solution\\.co\\.kr$",  // *.dev.core-solution.co.kr
            "\\.core-solution\\.co\\.kr$",        // *.core-solution.co.kr
            "\\.dev\\.m-garden\\.co\\.kr$",       // *.dev.m-garden.co.kr (기존)
            "\\.m-garden\\.co\\.kr$"              // *.m-garden.co.kr (기존)
        };
        
        for (String pattern : patterns) {
            if (hostWithoutPort.matches(".*" + pattern)) {
                // 서브도메인 추출
                String subdomain = hostWithoutPort.replaceFirst(pattern, "");
                
                // 기본 도메인 제외 (dev.core-solution.co.kr, app.core-solution.co.kr 등)
                String[] defaultSubdomains = {
                    "dev", "app", "api", "staging", "www"
                };
                
                for (String defaultSub : defaultSubdomains) {
                    if (subdomain.equals(defaultSub)) {
                        return null; // 기본 서브도메인은 테넌트가 아님
                    }
                }
                
                // 서브도메인이 있으면 반환
                if (!subdomain.isEmpty()) {
                    return subdomain;
                }
            }
        }
        
        return null;
    }
    
    /**
     * branch_id 추출
     * 
     * @param request HTTP 요청
     * @param session HTTP 세션
     * @return branch_id (없으면 null)
     */
    private String extractBranchId(HttpServletRequest request, HttpSession session) {
        // 1. HTTP 헤더에서 추출 (우선순위 1)
        String branchId = request.getHeader("X-Branch-Id");
        if (branchId != null && !branchId.isEmpty()) {
            log.debug("Branch ID extracted from header: {}", branchId);
            return branchId;
        }
        
        // 2. 세션에서 User 정보를 통해 branch_id 조회 (우선순위 2)
        if (session != null) {
            User user = SessionUtils.getCurrentUser(session);
            if (user != null) {
                // User의 branchCode 사용 (branch_id는 User 엔티티에 없을 수 있음)
                if (user.getBranchCode() != null) {
                    // branchCode를 branch_id로 사용 (임시)
                    // 향후 User 엔티티에 branch_id 필드가 추가되면 그걸 사용
                    session.setAttribute(SESSION_BRANCH_ID, user.getBranchCode());
                    log.debug("Branch ID extracted from user branchCode: {}", user.getBranchCode());
                    return user.getBranchCode();
                }
            }
            
            // 3. 세션에 저장된 branch_id 사용 (우선순위 3)
            Object sessionBranchId = session.getAttribute(SESSION_BRANCH_ID);
            if (sessionBranchId != null) {
                log.debug("Branch ID extracted from session: {}", sessionBranchId);
                return sessionBranchId.toString();
            }
            
            // 4. 세션의 branchCode 사용 (기존 시스템 호환성)
            Object branchCode = session.getAttribute("branchCode");
            if (branchCode != null) {
                log.debug("Branch ID extracted from session branchCode: {}", branchCode);
                return branchCode.toString();
            }
        }
        
        // 5. branch_id를 찾을 수 없는 경우
        log.trace("Branch ID not found in request");
        return null;
    }
}

