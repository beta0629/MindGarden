package com.coresolution.core.filter;

import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.utils.SessionUtils;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
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
public class TenantContextFilter implements Filter {
    
    // 브랜치 개념 제거: BranchRepository 의존성 제거됨 (표준화 2025-12-05)
    
    /**
     * HTTP 헤더에서 tenant_id 추출 키
     */
    private static final String TENANT_ID_HEADER = "X-Tenant-Id";
    
    /**
     * 세션에서 tenant_id를 저장하는 키
     */
    private static final String SESSION_TENANT_ID = "tenantId";
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpSession session = httpRequest.getSession(false);
        String requestURI = httpRequest.getRequestURI();
        String method = httpRequest.getMethod();
        
        // 1. OPTIONS 요청 (CORS preflight)은 tenantId 검증 건너뛰기
        if ("OPTIONS".equalsIgnoreCase(method)) {
            log.debug("OPTIONS 요청 감지 - tenantId 검증 건너뛰기: {}", requestURI);
            chain.doFilter(request, response);
            return;
        }
        
        // 2. 공개 API는 tenantId 검증 건너뛰기 (SecurityConfig에서 permitAll로 설정된 경로)
        if (isPublicApi(requestURI)) {
            log.debug("공개 API 요청 감지 - tenantId 검증 건너뛰기: {}", requestURI);
            chain.doFilter(request, response);
            return;
        }
        
        // 요청 정보 로깅 (디버깅용)
        log.info("🔍 TenantContextFilter 요청 처리: URI={}, Method={}, Session={}", 
            requestURI, method, session != null ? "있음" : "없음");
        if (session != null) {
            User sessionUser = SessionUtils.getCurrentUser(session);
            log.info("🔍 세션 사용자 정보: userId={}, role={}, tenantId={}", 
                sessionUser != null ? sessionUser.getId() : "null",
                sessionUser != null ? sessionUser.getRole() : "null",
                sessionUser != null ? sessionUser.getTenantId() : "null");
        }
        
        try {
            String tenantId = extractTenantId(httpRequest, session);
            String businessType = extractBusinessType(httpRequest, session);
            
            // ⚠️ 보안: tenantId는 필수 값 (내담자, 상담사, 관리자 모두 필수)
            // tenantId가 없으면 다른 테넌트의 데이터에 접근할 수 있어 매우 위험함
            if (tenantId == null || tenantId.isEmpty()) {
                String clientIP = getClientIP(httpRequest);
                String userAgent = httpRequest.getHeader("User-Agent");
                
                // 세션 정보 로깅 (상세)
                if (session != null) {
                    User user = SessionUtils.getCurrentUser(session);
                    if (user != null) {
                        log.error("🚨 보안 위험: Tenant ID가 없습니다! Request URI: {}, Method: {}, IP: {}, User-Agent: {}, User ID: {}, User Role: {}, User TenantId: {}", 
                            requestURI, method, clientIP, userAgent, user.getId(), user.getRole(), user.getTenantId());
                        log.error("🚨 세션 속성 확인: sessionId={}, TENANT_ID={}, USER_OBJECT={}", 
                            session.getId(),
                            session.getAttribute(SessionConstants.TENANT_ID),
                            session.getAttribute(SessionConstants.USER_OBJECT) != null ? "있음" : "없음");
                    } else {
                        log.error("🚨 보안 위험: Tenant ID가 없습니다! Request URI: {}, Method: {}, IP: {}, User-Agent: {}, 세션에 사용자 정보 없음", 
                            requestURI, method, clientIP, userAgent);
                        log.error("🚨 세션 속성 목록: sessionId={}", session.getId());
                        java.util.Enumeration<String> attrNames = session.getAttributeNames();
                        while (attrNames.hasMoreElements()) {
                            String attrName = attrNames.nextElement();
                            log.error("🚨 세션 속성: {} = {}", attrName, session.getAttribute(attrName));
                        }
                    }
                } else {
                    log.error("🚨 보안 위험: Tenant ID가 없습니다! Request URI: {}, Method: {}, IP: {}, User-Agent: {}, 세션 없음", 
                        requestURI, method, clientIP, userAgent);
                }
                
                // 보안 이벤트 기록 (필요시)
                // securityAuditService.recordSecurityEvent(SecurityEventType.TENANT_ID_MISSING, clientIP, userAgent, ...);
                
                HttpServletResponse httpResponse = (HttpServletResponse) response;
                httpResponse.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write("{\"error\":\"Bad Request\",\"message\":\"Tenant ID is required for security. Please ensure you are logged in and have a valid tenant ID.\"}");
                return;
            }
            
            // TenantContext에 설정
            TenantContextHolder.setTenantId(tenantId);
            log.debug("Tenant context set from filter: {}", tenantId);
            
            if (businessType != null && !businessType.isEmpty()) {
                TenantContextHolder.setBusinessType(businessType);
                log.debug("Business type context set from filter: {}", businessType);
            }
            
            // 다음 필터로 진행
            chain.doFilter(request, response);
            
        } finally {
            // 요청 종료 시 TenantContext 정리 (메모리 누수 방지)
            TenantContextHolder.clear();
        }
    }
    
    /**
     * 공개 API 여부 확인
     * 
     * <p>SecurityConfig의 permitAll 경로와 일치해야 합니다.</p>
     * <p>온보딩 프로세스에서 사용하는 API는 로그인 전 접근이 필요하므로 공개 API로 설정합니다.</p>
     * 
     * <p>표준화 원칙 준수:</p>
     * <ul>
     *   <li>API 설계 표준: /api/v1/ 접두사 사용</li>
     *   <li>보안 표준: SecurityConfig와 일치하는 공개 API 목록</li>
     * </ul>
     * 
     * @param requestURI 요청 URI (쿼리 파라미터 포함)
     * @return 공개 API이면 true, 그렇지 않으면 false
     * @see com.coresolution.consultation.config.SecurityConfig
     */
    private boolean isPublicApi(String requestURI) {
        // 쿼리 파라미터 제거 (예: /api/v1/common-codes?codeGroup=NOTIFICATION_TYPE -> /api/v1/common-codes)
        String path = requestURI;
        if (path.contains("?")) {
            path = path.substring(0, path.indexOf("?"));
        }
        
        // 공개 API 경로 목록 (SecurityConfig의 permitAll 경로와 일치해야 함)
        // 표준화 원칙: 온보딩 관련 API는 공개 API로 설정
        String[] publicPaths = {
            "/api/v1/onboarding",              // 온보딩 API (테넌트 등록)
            "/api/v1/ops/plans/active",        // 활성화된 요금제 목록 (온보딩에서 사용)
            "/api/v1/ops/plans/code",          // plan_code로 요금제 조회 (온보딩에서 사용)
            "/api/v1/ops/auth",                 // Ops Portal 인증 API
            "/api/v1/auth",                     // 인증 API
            "/api/v1/common-codes",             // 공통코드 API
            "/api/v1/business-categories",      // 업종 카테고리 API (온보딩에서 사용)
            "/api/business-categories",        // 레거시 업종 카테고리 API (하위 호환성)
            "/api/v1/admin/css-themes",         // CSS 테마 API
            "/actuator/health",                 // 헬스체크
            "/actuator/info"                    // 정보 조회
        };
        
        for (String publicPath : publicPaths) {
            if (path.equals(publicPath) || path.startsWith(publicPath + "/")) {
                log.debug("공개 API 매칭: {} -> {}", requestURI, publicPath);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * tenant_id 추출
     * 
     * @param request HTTP 요청
     * @param session HTTP 세션
     * @return tenant_id (없으면 null)
     */
    private String extractTenantId(HttpServletRequest request, HttpSession session) {
        // ⚠️ 우선순위 변경: 세션의 User 정보를 최우선으로 확인 (보안상 더 안전)
        // 1. 세션에서 User 정보를 통해 tenant_id 조회 (최우선순위)
        if (session != null) {
            User user = SessionUtils.getCurrentUser(session);
            if (user != null) {
                log.info("🔍 세션에서 User 정보 확인: userId={}, role={}, tenantId={}", 
                    user.getId(), user.getRole(), user.getTenantId());
                
                // 1-1. User 엔티티의 tenantId 직접 확인 (최우선)
                if (user.getTenantId() != null && !user.getTenantId().isEmpty()) {
                    // 세션에 tenant_id 저장 (다음 요청에서 빠르게 조회)
                    session.setAttribute(SESSION_TENANT_ID, user.getTenantId());
                    log.info("✅ Tenant ID extracted from user entity: {}", user.getTenantId());
                    return user.getTenantId();
                } else {
                    log.warn("⚠️ User 엔티티에 tenantId가 없습니다: userId={}, role={}, email={}", 
                        user.getId(), user.getRole(), user.getEmail());
                    
                    // ⚠️ 중요: User 엔티티에 tenantId가 없을 때는 데이터베이스에서 조회 시도
                    // (레거시 데이터 또는 마이그레이션 이슈일 수 있음)
                    // 하지만 보안상 필수이므로 일단 경고만 하고 계속 진행
                    // 실제 tenantId는 헤더나 다른 소스에서 올 수 있음
                }
            } else {
                log.debug("세션에 User 정보가 없습니다.");
            }
            
            // 1-2. 세션에 저장된 tenant_id 사용 (SessionConstants.TENANT_ID도 확인)
            Object sessionTenantId = session.getAttribute(SESSION_TENANT_ID);
            if (sessionTenantId != null) {
                log.info("✅ Tenant ID extracted from session (tenantId): {}", sessionTenantId);
                return sessionTenantId.toString();
            }
            
            // SessionConstants.TENANT_ID도 확인 (다른 방식으로 저장된 경우)
            Object sessionConstantsTenantId = session.getAttribute(SessionConstants.TENANT_ID);
            if (sessionConstantsTenantId != null) {
                String tenantIdStr = sessionConstantsTenantId.toString();
                log.info("✅ Tenant ID extracted from session (SessionConstants.TENANT_ID): {}", tenantIdStr);
                // 세션에 SESSION_TENANT_ID로도 저장 (다음 요청에서 빠르게 조회)
                session.setAttribute(SESSION_TENANT_ID, tenantIdStr);
                return tenantIdStr;
            }
        } else {
            log.debug("세션이 없습니다.");
        }
        
        // 2. HTTP 헤더에서 추출 (우선순위 2)
        String tenantId = request.getHeader(TENANT_ID_HEADER);
        log.info("🔍 Tenant ID 추출 시도: 헤더={}, 모든 헤더={}", tenantId, getHeadersAsString(request));
        if (tenantId != null && !tenantId.isEmpty()) {
            // ⚠️ 기본값/더미 값 체크 (헤더에서 받은 경우에만)
            // "tenant-unknown" 또는 "tenant-default"만 기본값으로 간주
            // "tenant-unknown-consultation-*" 같은 실제 tenantId는 허용
            if (tenantId.equals("tenant-unknown") || tenantId.equals("tenant-default")) {
                log.warn("⚠️ 기본값/더미 tenantId 감지 (헤더): {}, 세션의 User 정보를 우선 사용", tenantId);
                // 기본값이면 세션의 User 정보를 다시 확인
                if (session != null) {
                    User user = SessionUtils.getCurrentUser(session);
                    if (user != null && user.getTenantId() != null && !user.getTenantId().isEmpty()) {
                        // 기본값이 아닌 실제 tenantId가 있으면 사용
                        String userTenantId = user.getTenantId();
                        if (!userTenantId.equals("tenant-unknown") && !userTenantId.equals("tenant-default")) {
                            log.info("✅ 세션의 User에서 실제 tenantId 발견: {}", userTenantId);
                            return userTenantId;
                        }
                    }
                }
                // 기본값이면 null 반환 (백엔드에서 오류 발생)
                log.error("❌ 기본값 tenantId는 사용할 수 없습니다: {}", tenantId);
                return null;
            }
            log.info("✅ Tenant ID extracted from header: {}", tenantId);
            return tenantId;
        }
        
        // 3. Host 헤더에서 테넌트 서브도메인 추출 (우선순위 3)
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
        
        // 4. tenant_id를 찾을 수 없는 경우
        log.warn("❌ Tenant ID not found in request");
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
     * business_type 추출
     * 
     * @param request HTTP 요청
     * @param session HTTP 세션
     * @return business_type (없으면 null)
     */
    private String extractBusinessType(HttpServletRequest request, HttpSession session) {
        // 1. HTTP 헤더에서 추출 (우선순위 1)
        String businessType = request.getHeader("X-Business-Type");
        if (businessType != null && !businessType.isEmpty()) {
            log.debug("Business type extracted from header: {}", businessType);
            return businessType;
        }
        
        // 2. 세션에서 User 정보를 통해 business_type 조회 (우선순위 2)
        if (session != null) {
            User user = SessionUtils.getCurrentUser(session);
            if (user != null) {
                // 브랜치 개념 제거: User의 branchCode를 통한 business_type 조회 로직 제거됨 (표준화 2025-12-05)
                // User 엔티티에 tenantId가 직접 있으므로, 필요시 TenantRepository를 통해 businessType 조회 가능
                // 현재는 세션에서 조회하는 방식 사용
            }
            
            // 3. 세션에 저장된 business_type 사용 (우선순위 3)
            Object sessionBusinessType = session.getAttribute("businessType");
            if (sessionBusinessType != null) {
                log.debug("Business type extracted from session: {}", sessionBusinessType);
                return sessionBusinessType.toString();
            }
        }
        
        // 4. business_type를 찾을 수 없는 경우 - 기본값 CONSULTATION 사용
        log.debug("Business type not found, using default: CONSULTATION");
        return "CONSULTATION"; // 현재는 상담소만 운영 중이므로 기본값
    }
    
    /**
     * 클라이언트 IP 주소 추출
     * 
     * @param request HTTP 요청
     * @return 클라이언트 IP 주소
     */
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty()) {
            return xRealIP;
        }
        
        return request.getRemoteAddr();
    }
    
    /**
     * 디버깅용: 모든 헤더를 문자열로 반환
     */
    private String getHeadersAsString(HttpServletRequest request) {
        StringBuilder sb = new StringBuilder("{");
        java.util.Enumeration<String> headerNames = request.getHeaderNames();
        boolean first = true;
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            if (!first) {
                sb.append(", ");
            }
            sb.append(headerName).append("=").append(request.getHeader(headerName));
            first = false;
        }
        sb.append("}");
        return sb.toString();
    }
}

