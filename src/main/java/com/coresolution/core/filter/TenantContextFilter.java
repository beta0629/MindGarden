package com.coresolution.core.filter;

import java.io.IOException;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.util.EmailLogMasking;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.constant.PublicApiPathPolicy;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.util.HttpRequestClientIp;
import com.coresolution.core.util.LocalProfileGuard;
import com.coresolution.core.util.TenantHostSubdomainUtil;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;

/**
 * Tenant Context Filter HTTP 요청에서 tenant_id를 추출하여 TenantContext에 설정
 *
 * 우선순위: 1. HTTP 헤더 (X-Tenant-Id) 2. 세션의 User 정보를 통해 Branch의 tenant_id 조회 3. 세션에 저장된 tenant_id
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
    private final com.coresolution.core.repository.TenantRepository tenantRepository;
    private final org.springframework.core.env.Environment environment;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private UserRepository userRepository;

    // 로컬 개발 환경용 기본 테넌트 ID (서브도메인이 없을 때 사용)
    @org.springframework.beans.factory.annotation.Value("${local.default-tenant-id:${LOCAL_DEFAULT_TENANT_ID:}}")
    private String localDefaultTenantId;

    public TenantContextFilter(com.coresolution.core.repository.TenantRepository tenantRepository,
                               org.springframework.core.env.Environment environment) {
        this.tenantRepository = tenantRepository;
        this.environment = environment;
    }
    
    /**
     * 로컬 프로파일 여부 확인.
     * {@code local} 만 true — SSOT {@link LocalProfileGuard}.
     * 공유 .dev({@code spring.profiles.active=dev})는 Host/서브도메인·X-Forwarded-Host만 사용.
     *
     * @return 로컬 프로파일이면 true
     */
    private boolean isLocalProfile() {
        return LocalProfileGuard.isTrueLocalProfile(environment);
    }

    /**
     * HTTP 헤더에서 tenant_id 추출 키
     */
    private static final String TENANT_ID_HEADER = "X-Tenant-Id";

    /**
     * 세션에서 tenant_id를 저장하는 키
     */
    private static final String SESSION_TENANT_ID = "tenantId";

    /** nginx 가 같은 서버에서 프록시할 때의 직접 연결 주소. */
    private static final java.util.Set<String> LOOPBACK_ADDRESSES =
            java.util.Set.of("127.0.0.1", "0:0:0:0:0:0:0:1", "::1");

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

        // 2. 공개 API는 tenantId 검증은 건너뛰지만, 서브도메인에서 tenantId 추출은 시도
        // (비밀번호 찾기 등 일부 공개 API는 tenantId가 필요함)
        if (isPublicApi(requestURI)) {
            log.debug("공개 API 요청 감지 - tenantId 추출 시도 (검증은 건너뛰기): {}", requestURI);
            try {
                String tenantId = null;
                String businessType = null;
                try {
                    tenantId = extractTenantId(httpRequest, session);
                    businessType = extractBusinessType(httpRequest, session);
                } catch (Exception e) {
                    log.warn("⚠️ 공개 API에서 tenantId 추출 중 오류 (무시하고 계속 진행): URI={}, error={}", requestURI, e.getMessage());
                }
                // tenantId가 있으면 TenantContext에 설정 (비밀번호 찾기 등에서 사용)
                if (tenantId != null && !tenantId.isEmpty()) {
                    TenantContextHolder.setTenantId(tenantId);
                    if (businessType != null && !businessType.isEmpty()) {
                        TenantContextHolder.setBusinessType(businessType);
                    }
                    log.debug("✅ 공개 API에서 tenantId 추출 성공: tenantId={}, URI={}", tenantId, requestURI);
                } else {
                    log.debug("⚠️ 공개 API에서 tenantId를 찾을 수 없음 (정상일 수 있음): URI={}", requestURI);
                }
                chain.doFilter(request, response);
            } finally {
                TenantContextHolder.clear();
            }
            return;
        }

        // 요청 정보 로깅 (디버깅용)
        log.info("🔍 TenantContextFilter 요청 처리: URI={}, Method={}, Session={}", requestURI, method,
                session != null ? "있음" : "없음");
        if (session != null) {
            User sessionUser = SessionUtils.getCurrentUser(session);
            log.info("🔍 세션 사용자 정보: userId={}, role={}, tenantId={}",
                    sessionUser != null ? sessionUser.getId() : "null",
                    sessionUser != null ? sessionUser.getRole() : "null",
                    sessionUser != null ? sessionUser.getTenantId() : "null");
            
            // 세션 속성 확인 (디버깅용)
            Object tenantIdAttr = session.getAttribute(SESSION_TENANT_ID);
            Object tenantIdConst = session.getAttribute(SessionConstants.TENANT_ID);
            Object userObject = session.getAttribute(SessionConstants.USER_OBJECT);
            log.info("🔍 세션 속성 확인: SESSION_TENANT_ID={}, SessionConstants.TENANT_ID={}, USER_OBJECT={}",
                    tenantIdAttr != null ? tenantIdAttr.toString() : "null",
                    tenantIdConst != null ? tenantIdConst.toString() : "null",
                    userObject != null ? "있음" : "없음");
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
                        log.error(
                                "🚨 보안 위험: Tenant ID가 없습니다! Request URI: {}, Method: {}, IP: {}, User-Agent: {}, User ID: {}, User Role: {}, User TenantId: {}",
                                requestURI, method, clientIP, userAgent, user.getId(),
                                user.getRole(), user.getTenantId());
                        log.error("🚨 세션 속성 확인: sessionId={}, TENANT_ID={}, USER_OBJECT={}",
                                session.getId(), session.getAttribute(SessionConstants.TENANT_ID),
                                session.getAttribute(SessionConstants.USER_OBJECT) != null ? "있음"
                                        : "없음");
                    } else {
                        log.error(
                                "🚨 보안 위험: Tenant ID가 없습니다! Request URI: {}, Method: {}, IP: {}, User-Agent: {}, 세션에 사용자 정보 없음",
                                requestURI, method, clientIP, userAgent);
                        log.error("🚨 세션 속성 목록: sessionId={}", session.getId());
                        java.util.Enumeration<String> attrNames = session.getAttributeNames();
                        while (attrNames.hasMoreElements()) {
                            String attrName = attrNames.nextElement();
                            log.error("🚨 세션 속성: {} = {}", attrName,
                                    session.getAttribute(attrName));
                        }
                    }
                } else {
                    log.error(
                            "🚨 보안 위험: Tenant ID가 없습니다! Request URI: {}, Method: {}, IP: {}, User-Agent: {}, 세션 없음",
                            requestURI, method, clientIP, userAgent);
                }

                // 보안 이벤트 기록 (필요시)
                // securityAuditService.recordSecurityEvent(SecurityEventType.TENANT_ID_MISSING,
                // clientIP, userAgent, ...);

                HttpServletResponse httpResponse = (HttpServletResponse) response;
                httpResponse.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                httpResponse.setContentType("application/json;charset=UTF-8");
                // 표준화: ErrorResponse 형식과 일치하도록 수정
                String errorJson = "{\"success\":false,\"message\":\"Tenant ID is required for security. Please ensure you are logged in and have a valid tenant ID.\",\"errorCode\":\"TENANT_ID_REQUIRED\",\"status\":400}";
                httpResponse.getWriter().write(errorJson);
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
     * <p>
     * SecurityConfig의 permitAll 경로와 일치해야 합니다.
     * </p>
     * <p>
     * 온보딩 프로세스에서 사용하는 API는 로그인 전 접근이 필요하므로 공개 API로 설정합니다.
     * </p>
     *
     * <p>
     * 표준화 원칙 준수:
     * </p>
     * <ul>
     * <li>API 설계 표준: /api/v1/ 접두사 사용</li>
     * <li>보안 표준: SecurityConfig와 일치하는 공개 API 목록</li>
     * </ul>
     *
     * <p>
     * {@code isPublicApi} 분기와 {@link com.coresolution.consultation.config.SecurityConfig}의 permitAll·
     * 비-API(HTML·정적·SPA) 서빙 정책을 함께 바꿀 때는 반드시 동기화할 것.
     * </p>
     *
     * @param requestURI 요청 URI (쿼리 파라미터 포함)
     * @return 공개 API이면 true, 그렇지 않으면 false
     * @see com.coresolution.consultation.config.SecurityConfig
     */
    private boolean isPublicApi(String requestURI) {
        boolean publicApi = PublicApiPathPolicy.isPublicApi(requestURI);
        if (publicApi) {
            log.debug("공개 경로 매칭: {}", requestURI);
        }
        return publicApi;
    }

    /**
     * 세션·헤더·User에서 테넌트 힌트를 수집한다. DB {@code findByTenantIdAndId}에 쓰이며,
     * 모두 없을 때만 {@code findById} 폴백을 허용한다.
     * 순서: {@link SessionConstants#TENANT_ID} → {@code X-Tenant-Id} → 세션 User의 {@code tenantId}.
     *
     * @param session HTTP 세션
     * @param request HTTP 요청
     * @param user    세션에 올라온 User( tenantId 비어 있을 수 있음 )
     * @return 비어 있지 않은 테넌트 ID 또는 null
     */
    private String resolveTenantHintForUserReload(HttpSession session, HttpServletRequest request, User user) {
        if (session != null) {
            Object scTenant = session.getAttribute(SessionConstants.TENANT_ID);
            if (scTenant != null && !scTenant.toString().isEmpty()) {
                return scTenant.toString();
            }
            Object sessionTenant = session.getAttribute(SESSION_TENANT_ID);
            if (sessionTenant != null && !sessionTenant.toString().isEmpty()) {
                return sessionTenant.toString();
            }
        }
        String headerTenant = request.getHeader(TENANT_ID_HEADER);
        if (headerTenant != null && !headerTenant.isEmpty()
                && !headerTenant.contains("[object") && !headerTenant.contains("Promise")
                && !"tenant-unknown".equals(headerTenant)
                && !"tenant-default".equals(headerTenant)) {
            return headerTenant;
        }
        if (user != null && user.getTenantId() != null && !user.getTenantId().isEmpty()) {
            return user.getTenantId();
        }
        return null;
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
                log.info("🔍 세션에서 User 정보 확인: userId={}, role={}, tenantId={}", user.getId(),
                        user.getRole(), user.getTenantId());

                // 1-1. User 엔티티의 tenantId 직접 확인 (최우선)
                if (user.getTenantId() != null && !user.getTenantId().isEmpty()) {
                    // 세션에 tenant_id 저장 (다음 요청에서 빠르게 조회)
                    session.setAttribute(SESSION_TENANT_ID, user.getTenantId());
                    log.info("✅ Tenant ID extracted from user entity: {}", user.getTenantId());
                    return user.getTenantId();
                }
                // 1-1-1. 세션 User에 tenantId가 없을 때 DB에서 조회 후 세션 보완 (재로그인/직렬화 이슈 대응)
                if (user.getId() != null && userRepository != null) {
                    log.debug("Tenant ID 복구(DB) 시도: userId={}, URI={}", user.getId(), request.getRequestURI());
                    try {
                        String lookupTenantId = resolveTenantHintForUserReload(session, request, user);
                        java.util.Optional<User> dbUserOpt;
                        if (lookupTenantId != null && !lookupTenantId.isEmpty()) {
                            dbUserOpt = userRepository.findByTenantIdAndId(lookupTenantId, user.getId());
                        } else {
                            log.warn(
                                "⚠️ 테넌트 힌트 없음 — findById 폴백(크로스 테넌트 위험): userId={}, URI={}",
                                user.getId(), request.getRequestURI());
                            dbUserOpt = userRepository.findById(user.getId());
                        }
                        if (dbUserOpt.isPresent()) {
                            User dbUser = dbUserOpt.get();
                            if (dbUser.getTenantId() != null && !dbUser.getTenantId().isEmpty()) {
                                user.setTenantId(dbUser.getTenantId());
                                SessionUtils.setCurrentUser(session, user);
                                session.setAttribute(SESSION_TENANT_ID, dbUser.getTenantId());
                                session.setAttribute(SessionConstants.TENANT_ID, dbUser.getTenantId());
                                log.info("✅ Tenant ID 복구(DB): userId={}, tenantId={}", user.getId(), dbUser.getTenantId());
                                return dbUser.getTenantId();
                            }
                        }
                    } catch (Exception e) {
                        log.warn("⚠️ User tenantId DB 조회 실패 (무시): userId={}, error={}", user.getId(), e.getMessage());
                    }
                }
                log.warn("⚠️ User 엔티티에 tenantId가 없습니다: userId={}, role={}, email={}",
                        user.getId(), user.getRole(), EmailLogMasking.maskForLog(user.getEmail()));
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
                log.info("✅ Tenant ID extracted from session (SessionConstants.TENANT_ID): {}",
                        tenantIdStr);
                // 세션에 SESSION_TENANT_ID로도 저장 (다음 요청에서 빠르게 조회)
                session.setAttribute(SESSION_TENANT_ID, tenantIdStr);
                return tenantIdStr;
            }
        } else {
            log.debug("세션이 없습니다.");
        }

        // 1-3. JSESSIONID 없이 Bearer만 쓰는 모바일 — SecurityContext JWT details의 User tenantId
        User securityUser = SessionUtils.getCurrentUser(session);
        if (securityUser != null && securityUser.getTenantId() != null
                && !securityUser.getTenantId().isEmpty()) {
            String fromJwtUser = securityUser.getTenantId();
            if (!"tenant-unknown".equals(fromJwtUser) && !"tenant-default".equals(fromJwtUser)) {
                if (session != null) {
                    session.setAttribute(SESSION_TENANT_ID, fromJwtUser);
                    session.setAttribute(SessionConstants.TENANT_ID, fromJwtUser);
                }
                log.info("✅ Tenant ID extracted from SecurityContext user: {}", fromJwtUser);
                return fromJwtUser;
            }
        }

        // STRICT 공개 데이터 경로(카탈로그·파일·공통코드 등): 비로그인은 Host 로만 테넌트를 해석한다.
        // 클라이언트가 정하는 X-Tenant-Id·X-Tenant-Subdomain 은 타 테넌트 조회에 쓰일 수 있어 무시한다.
        boolean strictHost = PublicApiPathPolicy.isStrictHostPath(request.getRequestURI());

        // 2. HTTP 헤더에서 추출 (우선순위 2)
        String tenantId = strictHost ? null : request.getHeader(TENANT_ID_HEADER);
        if (strictHost && request.getHeader(TENANT_ID_HEADER) != null) {
            log.warn("STRICT 공개 경로에서 X-Tenant-Id 헤더 무시: URI={}", request.getRequestURI());
        }
        log.info("🔍 Tenant ID 추출 시도: 헤더={}, 모든 헤더={}", tenantId, getHeadersAsString(request));
        if (tenantId != null && !tenantId.isEmpty()) {
            // ⚠️ 잘못된 값 체크: Promise 객체나 잘못된 형식 필터링
            if (tenantId.contains("[object") || tenantId.contains("Promise") || tenantId.contains("Object")) {
                log.warn("⚠️ 잘못된 tenantId 형식 감지 (헤더): {}, 헤더 무시하고 서브도메인에서 추출 시도", tenantId);
                // 잘못된 값이면 헤더를 무시하고 서브도메인에서 추출 시도
                tenantId = null;
            }
            
            // ⚠️ 기본값/더미 값 체크 (헤더에서 받은 경우에만)
            if (tenantId != null && (tenantId.equals("tenant-unknown") || tenantId.equals("tenant-default"))) {
                log.warn("⚠️ 기본값/더미 tenantId 감지 (헤더): {}, 세션의 User 정보를 우선 사용", tenantId);
                // 기본값이면 세션의 User 정보를 다시 확인
                if (session != null) {
                    User user = SessionUtils.getCurrentUser(session);
                    if (user != null && user.getTenantId() != null
                            && !user.getTenantId().isEmpty()) {
                        // 기본값이 아닌 실제 tenantId가 있으면 사용
                        String userTenantId = user.getTenantId();
                        if (!userTenantId.equals("tenant-unknown")
                                && !userTenantId.equals("tenant-default")) {
                            log.info("✅ 세션의 User에서 실제 tenantId 발견: {}", userTenantId);
                            return userTenantId;
                        }
                    }
                }
                // 기본값이면 null 반환 (백엔드에서 오류 발생)
                log.error("❌ 기본값 tenantId는 사용할 수 없습니다: {}", tenantId);
                tenantId = null; // null로 설정하여 서브도메인에서 추출 시도
            }
            
            // 유효한 tenantId가 있으면 반환
            if (tenantId != null && !tenantId.isEmpty()) {
                log.info("✅ Tenant ID extracted from header: {}", tenantId);
                return tenantId;
            }
        }

        // 3. Host 헤더에서 테넌트 서브도메인 추출 (우선순위 3)
        // 예: mindgarden.dev.core-solution.co.kr → mindgarden → tenant-incheon-counseling-001
        // 예: tenant1.core-solution.co.kr → tenant1 → tenant-seoul-consultation-001
        String host = request.getHeader("Host");
        if (host != null && !host.isEmpty()) {
            // 진짜 local 프로파일이고 localhost인 경우에만 기본 테넌트 사용
            // (dev 프로파일 공유 서버는 Host/서브도메인·X-Forwarded-Host만 사용)
            boolean isLocalhost = host.contains("localhost") || host.contains("127.0.0.1");
            boolean isLocalProfile = isLocalProfile();

            if (isLocalProfile && isLocalhost && localDefaultTenantId != null && !localDefaultTenantId.isEmpty()) {
                log.info("로컬 프로파일 감지 - 기본 테넌트 사용: tenantId={}", localDefaultTenantId);
                return localDefaultTenantId;
            }

            String tenantIdFromHost = resolveTenantIdFromHostValue(host);
            if (tenantIdFromHost != null && !tenantIdFromHost.isEmpty()) {
                return tenantIdFromHost;
            }
        }

        // 3.4. Host가 localhost이거나 서브도메인을 못 뽑은 경우 X-Forwarded-Host로 재시도
        // (nginx 등이 Host를 localhost로 넘기고 X-Forwarded-Host에 실제 도메인을 넣는 경우)
        String forwardedHost = request.getHeader("X-Forwarded-Host");
        // STRICT 경로는 nginx(루프백)가 $host 로 덮어쓴 값만 신뢰한다. 8080 직접 접근 등 외부 직접 요청의 값은 무시.
        if (strictHost && !isLoopbackPeer(request)) {
            forwardedHost = null;
        }
        if (forwardedHost != null && !forwardedHost.isEmpty()) {
            String firstForwardedHost = forwardedHost.split(",")[0].trim();
            boolean hostIsLocalOrMissing = host == null || host.isEmpty()
                    || host.contains("localhost") || host.contains("127.0.0.1");
            if (hostIsLocalOrMissing || extractTenantSubdomain(host) == null) {
                String tenantIdFromForwarded = resolveTenantIdFromHostValue(firstForwardedHost);
                if (tenantIdFromForwarded != null && !tenantIdFromForwarded.isEmpty()) {
                    log.info("✅ X-Forwarded-Host로 테넌트 조회 성공: forwardedHost={}, tenantId={}",
                            firstForwardedHost, tenantIdFromForwarded);
                    return tenantIdFromForwarded;
                }
            }
        }

        // 3.5. X-Tenant-Subdomain 헤더 (API가 다른 호스트일 때 프론트에서 현재 페이지 서브도메인 전달)
        String subdomainHeader = strictHost ? null : request.getHeader("X-Tenant-Subdomain");
        if (subdomainHeader != null && !subdomainHeader.isEmpty()) {
            try {
                return tenantRepository.findBySubdomainIgnoreCase(subdomainHeader.trim())
                        .map(tenant -> {
                            String foundTenantId = tenant.getTenantId();
                            log.info("✅ X-Tenant-Subdomain으로 테넌트 조회 성공: subdomain={}, tenantId={}",
                                    subdomainHeader, foundTenantId);
                            return foundTenantId;
                        })
                        .orElseGet(() -> {
                            log.warn("⚠️ X-Tenant-Subdomain으로 테넌트를 찾을 수 없음: subdomain={}",
                                    subdomainHeader);
                            return null;
                        });
            } catch (Exception e) {
                log.error("❌ X-Tenant-Subdomain 테넌트 조회 중 오류: subdomain={}, error={}",
                        subdomainHeader, e.getMessage(), e);
            }
        }

        // 4. 로컬 프로파일이지만 서브도메인도 없는 경우 기본 테넌트 사용
        if (host != null && (host.contains("localhost") || host.contains("127.0.0.1"))) {
            boolean isLocalProfile = isLocalProfile();
            if (isLocalProfile && localDefaultTenantId != null && !localDefaultTenantId.isEmpty()) {
                log.info("로컬 프로파일 감지 (서브도메인 없음) - 기본 테넌트 사용: tenantId={}", localDefaultTenantId);
                return localDefaultTenantId;
            } else if (isLocalProfile) {
                log.warn("⚠️ 로컬 프로파일에서 테넌트 정보가 없습니다. local.default-tenant-id 또는 LOCAL_DEFAULT_TENANT_ID 환경 변수를 설정해주세요.");
            }
        }

        // 5. tenant_id를 찾을 수 없는 경우
        log.warn("❌ Tenant ID not found in request");
        return null;
    }

    /**
     * 직접 연결한 상대가 루프백(같은 서버의 nginx)인지. X-Forwarded-Host 신뢰 판단에 쓴다.
     * {@code server.forward-headers-strategy} 를 쓰지 않으므로 remoteAddr 는 실제 연결 상대다.
     */
    private static boolean isLoopbackPeer(HttpServletRequest request) {
        String remote = request.getRemoteAddr();
        return LOOPBACK_ADDRESSES.contains(remote);
    }

    /**
     * Host(또는 X-Forwarded-Host) 값에서 서브도메인을 추출해 테넌트 ID를 조회한다.
     *
     * @param hostValue Host 헤더 값 (포트 포함 가능)
     * @return tenant_id 또는 null
     */
    private String resolveTenantIdFromHostValue(String hostValue) {
        if (hostValue == null || hostValue.isEmpty()) {
            return null;
        }
        String subdomain = extractTenantSubdomain(hostValue);
        if (subdomain == null || subdomain.isEmpty()) {
            return null;
        }
        log.info("서브도메인 추출: host={}, subdomain={}", hostValue, subdomain);
        try {
            return tenantRepository.findBySubdomainIgnoreCase(subdomain)
                    .map(tenant -> {
                        String foundTenantId = tenant.getTenantId();
                        log.info("✅ 서브도메인으로 테넌트 조회 성공: subdomain={}, tenantId={}",
                                subdomain, foundTenantId);
                        return foundTenantId;
                    })
                    .orElseGet(() -> {
                        log.warn("⚠️ 서브도메인으로 테넌트를 찾을 수 없음: subdomain={}", subdomain);
                        return null;
                    });
        } catch (Exception e) {
            log.error("❌ 서브도메인으로 테넌트 조회 중 오류 발생: subdomain={}, error={}",
                    subdomain, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Host 헤더에서 테넌트 서브도메인 추출.
     * suffix·예약 라벨·{@code TENANT_HOST_ALIASES} 는 {@link TenantHostSubdomainUtil} SSOT 에 위임한다.
     *
     * @param host Host 헤더 값 (예: tenant1.dev.core-solution.co.kr, mindgarden-dev.core-solution.co.kr)
     * @return 테넌트 서브도메인 (예: tenant1, mindgarden) 또는 null
     */
    private String extractTenantSubdomain(String host) {
        return TenantHostSubdomainUtil.extractTenantSubdomain(host);
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
        return HttpRequestClientIp.resolve(request);
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

