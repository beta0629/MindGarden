package com.coresolution.consultation.config;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Rate Limiting 설정. 로그인 시도·계정 연동 공개 API·Trinity 공개 온보딩 생성 POST 등 민감 경로에만 IP 기준 제한을 적용합니다.
 * 전역 {@code /api/*} 단일 상한(기존 사실상 비활성 값)은 제거되었습니다.
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Configuration
@RequiredArgsConstructor
public class RateLimitingConfig {

    private final MindgardenSecurityProperties mindgardenSecurityProperties;

    private static final ObjectMapper RATE_LIMIT_JSON = new ObjectMapper();

    /**
     * Rate Limiting 필터 Bean
     *
     * @return 필터 인스턴스
     */
    @Bean
    public RateLimitingFilter rateLimitingFilter(ObjectProvider<MeterRegistry> meterRegistryProvider) {
        return new RateLimitingFilter(mindgardenSecurityProperties, meterRegistryProvider);
    }

    /**
     * Rate Limiting 필터 구현
     */
    @Slf4j
    public static class RateLimitingFilter extends OncePerRequestFilter {

        private final MindgardenSecurityProperties properties;

        private final Map<String, RequestInfo> requestCounts = new ConcurrentHashMap<>();

        private static final String RATE_KEY_SUFFIX_LOGIN = "_login";
        private static final String RATE_KEY_SUFFIX_INTEGRATION = "_integration";
        private static final String RATE_KEY_SUFFIX_ONBOARDING_CREATE = "_onboarding_create";

        private static final String METRIC_RATE_LIMIT_BLOCKED = "mindgarden.rate_limit.blocked";
        private static final String TAG_REASON = "reason";
        private static final String REASON_LOGIN = "login";
        private static final String REASON_INTEGRATION = "integration";
        private static final String REASON_ONBOARDING_CREATE = "onboarding_create";
        private static final String REASON_UNKNOWN = "unknown";

        private static final int MAX_LOGIN_ATTEMPTS = 999999;
        private static final long LOGIN_COOLDOWN_MINUTES = 0L;

        private final ObjectProvider<MeterRegistry> meterRegistryProvider;

        /**
         * @param properties 보안·레이트리밋 설정
         * @param meterRegistryProvider Micrometer 레지스트리(테스트 등에서 빈 없을 수 있음)
         */
        public RateLimitingFilter(MindgardenSecurityProperties properties,
            ObjectProvider<MeterRegistry> meterRegistryProvider) {
            this.properties = properties;
            this.meterRegistryProvider = meterRegistryProvider;
        }

        @Override
        protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

            String clientIp = getClientIpAddress(request);

            cleanupOldRequests();

            if (shouldApplyRateLimit(request)) {
                if (!isAllowed(clientIp, request)) {
                    handleRateLimitExceeded(response, request);
                    return;
                }
            }

            incrementRequestCount(clientIp, request);

            filterChain.doFilter(request, response);
        }

        private boolean shouldApplyRateLimit(HttpServletRequest request) {
            String requestPath = request.getRequestURI();
            return isLoginRateLimitPath(requestPath)
                || isAccountIntegrationPublicPath(requestPath)
                || isOnboardingCreatePublicRequest(request);
        }

        private boolean isLoginRateLimitPath(String requestPath) {
            return requestPath.contains("/login");
        }

        private boolean isAccountIntegrationPublicPath(String requestPath) {
            String prefix = properties.getRateLimit().getIntegrationPathPrefix();
            return prefix != null && !prefix.isEmpty() && requestPath.startsWith(prefix);
        }

        /**
         * Trinity 공개 플로우: {@code POST} 이고 URI가 {@link MindgardenSecurityProperties.RateLimit#getOnboardingCreatePath()} 와 정확히 일치할 때만.
         * {@code /api/v1/ops/onboarding/requests} 는 여기에 해당하지 않는다.
         */
        private boolean isOnboardingCreatePublicRequest(HttpServletRequest request) {
            if (!"POST".equalsIgnoreCase(request.getMethod())) {
                return false;
            }
            String configured = properties.getRateLimit().getOnboardingCreatePath();
            return configured != null && configured.equals(request.getRequestURI());
        }

        private boolean isAllowed(String clientIp, HttpServletRequest request) {
            String requestPath = request.getRequestURI();
            if (isLoginRateLimitPath(requestPath)) {
                return isLoginAllowed(clientIp);
            }
            if (isAccountIntegrationPublicPath(requestPath)) {
                return isIntegrationAllowed(clientIp);
            }
            if (isOnboardingCreatePublicRequest(request)) {
                return isOnboardingCreateAllowed(clientIp);
            }
            return true;
        }

        private boolean isLoginAllowed(String clientIp) {
            RequestInfo loginInfo = requestCounts.get(clientIp + RATE_KEY_SUFFIX_LOGIN);

            if (loginInfo == null) {
                return true;
            }

            if (loginInfo.getCount() >= MAX_LOGIN_ATTEMPTS) {
                long timeSinceLastAttempt = System.currentTimeMillis() - loginInfo.getLastRequestTime();
                long cooldownMs = LOGIN_COOLDOWN_MINUTES * 60 * 1000;

                if (timeSinceLastAttempt > cooldownMs) {
                    requestCounts.remove(clientIp + RATE_KEY_SUFFIX_LOGIN);
                    return true;
                }
                return false;
            }

            return true;
        }

        private boolean isIntegrationAllowed(String clientIp) {
            String key = clientIp + RATE_KEY_SUFFIX_INTEGRATION;
            RequestInfo info = requestCounts.get(key);
            int maxPerMinute = properties.getRateLimit().getIntegrationRequestsPerMinute();
            return info == null || info.getCount() < maxPerMinute;
        }

        private boolean isOnboardingCreateAllowed(String clientIp) {
            String key = clientIp + RATE_KEY_SUFFIX_ONBOARDING_CREATE;
            RequestInfo info = requestCounts.get(key);
            int maxPerMinute = properties.getRateLimit().getOnboardingCreateRequestsPerMinute();
            return info == null || info.getCount() < maxPerMinute;
        }

        private void incrementRequestCount(String clientIp, HttpServletRequest request) {
            String requestPath = request.getRequestURI();
            if (isLoginRateLimitPath(requestPath)) {
                RequestInfo loginInfo = requestCounts.get(clientIp + RATE_KEY_SUFFIX_LOGIN);
                if (loginInfo == null) {
                    loginInfo = new RequestInfo();
                    requestCounts.put(clientIp + RATE_KEY_SUFFIX_LOGIN, loginInfo);
                } else {
                    loginInfo.increment();
                }
            } else if (isAccountIntegrationPublicPath(requestPath)) {
                String key = clientIp + RATE_KEY_SUFFIX_INTEGRATION;
                RequestInfo integrationInfo = requestCounts.get(key);
                if (integrationInfo == null) {
                    integrationInfo = new RequestInfo();
                    requestCounts.put(key, integrationInfo);
                } else {
                    integrationInfo.increment();
                }
            } else if (isOnboardingCreatePublicRequest(request)) {
                String key = clientIp + RATE_KEY_SUFFIX_ONBOARDING_CREATE;
                RequestInfo onboardingInfo = requestCounts.get(key);
                if (onboardingInfo == null) {
                    onboardingInfo = new RequestInfo();
                    requestCounts.put(key, onboardingInfo);
                } else {
                    onboardingInfo.increment();
                }
            }
        }

        private void cleanupOldRequests() {
            long currentTime = System.currentTimeMillis();
            long expireTime = 60 * 1000L;

            requestCounts.entrySet().removeIf(entry ->
                (currentTime - entry.getValue().getLastRequestTime()) > expireTime);
        }

        private void handleRateLimitExceeded(HttpServletResponse response, HttpServletRequest request)
            throws IOException {
            recordRateLimitBlocked(request);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);

            String requestPath = request.getRequestURI();
            if (isLoginRateLimitPath(requestPath)) {
                errorResponse.put("message", "로그인 시도 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요.");
                errorResponse.put("retryAfter", LOGIN_COOLDOWN_MINUTES * 60);
            } else if (isOnboardingCreatePublicRequest(request)) {
                errorResponse.put("message", "온보딩 생성 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
                errorResponse.put("retryAfter", 60);
            } else {
                errorResponse.put("message", "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
                errorResponse.put("retryAfter", 60);
            }

            errorResponse.put("timestamp", System.currentTimeMillis());
            errorResponse.put("status", HttpStatus.TOO_MANY_REQUESTS.value());

            response.getWriter().write(RATE_LIMIT_JSON.writeValueAsString(errorResponse));
        }

        /**
         * 429 차단 시 전용 카운터(알람용 태그 {@code reason}). {@link MetricsInterceptor} 의 {@code api.errors} 와 별도.
         */
        private void recordRateLimitBlocked(HttpServletRequest request) {
            MeterRegistry registry = meterRegistryProvider.getIfAvailable();
            if (registry == null) {
                return;
            }
            String reason = resolveBlockReason(request);
            Counter.builder(METRIC_RATE_LIMIT_BLOCKED)
                .tag(TAG_REASON, reason)
                .register(registry)
                .increment();
        }

        /**
         * {@link #isAllowed(String, HttpServletRequest)} 분기와 동일 순서로 단일 reason 결정.
         */
        private String resolveBlockReason(HttpServletRequest request) {
            String requestPath = request.getRequestURI();
            if (isLoginRateLimitPath(requestPath)) {
                return REASON_LOGIN;
            }
            if (isAccountIntegrationPublicPath(requestPath)) {
                return REASON_INTEGRATION;
            }
            if (isOnboardingCreatePublicRequest(request)) {
                return REASON_ONBOARDING_CREATE;
            }
            return REASON_UNKNOWN;
        }

        private String getClientIpAddress(HttpServletRequest request) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }

            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty()) {
                return xRealIp;
            }

            return request.getRemoteAddr();
        }
    }

    /**
     * IP(및 접미사)별 요청 횟수
     */
    private static class RequestInfo {
        private int count;
        private long lastRequestTime;

        RequestInfo() {
            this.count = 1;
            this.lastRequestTime = System.currentTimeMillis();
        }

        void increment() {
            this.count++;
            this.lastRequestTime = System.currentTimeMillis();
        }

        int getCount() {
            return count;
        }

        long getLastRequestTime() {
            return lastRequestTime;
        }
    }
}
