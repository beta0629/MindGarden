package com.coresolution.consultation.config;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;
import com.coresolution.core.util.HttpRequestClientIp;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Rate Limiting 설정. 로그인 시도·계정 연동 공개 API·Trinity 공개 온보딩({@code /api/v1/onboarding/} 접두 조회 등)·온보딩 생성 POST 등 민감 경로에만 IP 기준 제한을 적용합니다.
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
        private static final String RATE_KEY_SUFFIX_ONBOARDING_PUBLIC = "_onboarding_public";
        private static final String RATE_KEY_SUFFIX_KR_PUBLIC_DATA = "_kr_public_data";
        private static final String RATE_KEY_SUFFIX_HOMEPAGE_INQUIRY_MINUTE = "_homepage_inquiry_min";
        private static final String RATE_KEY_SUFFIX_HOMEPAGE_INQUIRY_DAY = "_homepage_inquiry_day";

        private static final String METRIC_RATE_LIMIT_BLOCKED = "mindgarden.rate_limit.blocked";
        private static final String TAG_REASON = "reason";
        private static final String REASON_LOGIN = "login";
        private static final String REASON_INTEGRATION = "integration";
        private static final String REASON_ONBOARDING_CREATE = "onboarding_create";
        private static final String REASON_ONBOARDING_PUBLIC = "onboarding_public";
        private static final String REASON_KR_PUBLIC_DATA = "kr_public_data";
        private static final String REASON_HOMEPAGE_INQUIRY = "homepage_inquiry";
        private static final String REASON_UNKNOWN = "unknown";

        private static final int MAX_LOGIN_ATTEMPTS = 999999;
        private static final long LOGIN_COOLDOWN_MINUTES = 0L;
        private static final long MINUTE_WINDOW_MS = 60_000L;
        private static final long DAY_WINDOW_MS = 24L * 60L * 60L * 1000L;
        /** 전역 map 스캔 cleanup 최소 간격 — 매 요청 O(n) 방지 */
        private static final long CLEANUP_INTERVAL_MS = 60_000L;

        private final ObjectProvider<MeterRegistry> meterRegistryProvider;
        private final AtomicLong lastCleanupEpochMs = new AtomicLong(0L);

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

            // 전역 ConcurrentHashMap 전체 스캔은 매 요청이 아니라 ~60초 스로틀.
            // 홈페이지 문의 경로에서는 해당 IP 의 day/min 키만 만료 시 즉시 제거한다.
            maybeCleanupOldRequests();
            if (isHomepageInquiryPublicRequest(request)) {
                purgeExpiredHomepageInquiryKeysForIp(clientIp);
            }

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
                || isOnboardingCreatePublicRequest(request)
                || isOnboardingPublicRateLimitRequest(request)
                || isKrPublicDataRateLimitRequest(request)
                || isHomepageInquiryPublicRequest(request);
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

        /**
         * 공개 온보딩 접두({@link MindgardenSecurityProperties.RateLimit#getOnboardingPublicPathPrefix()}) 일치 시.
         * {@code POST} 이고 URI가 {@link MindgardenSecurityProperties.RateLimit#getOnboardingCreatePath()} 와 정확히 같으면 제외(전용 버킷만 사용).
         */
        private boolean isOnboardingPublicRateLimitRequest(HttpServletRequest request) {
            String path = request.getRequestURI();
            String prefix = properties.getRateLimit().getOnboardingPublicPathPrefix();
            if (prefix == null || prefix.isEmpty() || !path.startsWith(prefix)) {
                return false;
            }
            if ("POST".equalsIgnoreCase(request.getMethod())) {
                String createPath = properties.getRateLimit().getOnboardingCreatePath();
                if (createPath != null && createPath.equals(path)) {
                    return false;
                }
            }
            return true;
        }

        private boolean isKrPublicDataRateLimitRequest(HttpServletRequest request) {
            String prefix = properties.getRateLimit().getKrPublicDataPathPrefix();
            return prefix != null && !prefix.isEmpty() && request.getRequestURI().startsWith(prefix);
        }

        /**
         * 홈페이지 공개 문의: {@code POST} 이고 정규화 URI 가
         * {@link MindgardenSecurityProperties.RateLimit#getHomepageInquiryPathPrefix()} 로 시작하며
         * {@code /inquiries} 로 끝날 때. 익명 IP 기준 분·일 버킷을 함께 적용한다.
         * matrix/semicolon({@code /inquiries;bypass=1}) 우회를 막기 위해 {@link #normalizeRequestPath(String)} 사용.
         * {@link com.coresolution.consultation.service.impl.AdminTestNotificationRateLimiter} 와는 무관하다.
         */
        private boolean isHomepageInquiryPublicRequest(HttpServletRequest request) {
            if (!"POST".equalsIgnoreCase(request.getMethod())) {
                return false;
            }
            String prefix = properties.getRateLimit().getHomepageInquiryPathPrefix();
            if (prefix == null || prefix.isEmpty()) {
                return false;
            }
            String path = normalizeRequestPath(request.getRequestURI());
            if (!path.startsWith(prefix)) {
                return false;
            }
            return path.endsWith("/inquiries")
                || path.matches("^/api/v1/public/tenants/[^/]+/inquiries$");
        }

        /**
         * 레이트리밋 path 매칭용 URI 정규화.
         * query 제거 후 각 path segment 의 matrix/semicolon({@code ;...}) 을 제거한다.
         * 예: {@code /api/v1/public/tenants/x/inquiries;bypass=1} → {@code .../inquiries}
         *
         * @param uri raw request URI (nullable)
         * @return 정규화된 path (never null)
         */
        static String normalizeRequestPath(String uri) {
            if (uri == null || uri.isEmpty()) {
                return "";
            }
            String path = uri;
            int queryIdx = path.indexOf('?');
            if (queryIdx >= 0) {
                path = path.substring(0, queryIdx);
            }
            if (path.indexOf(';') < 0) {
                return path;
            }
            StringBuilder normalized = new StringBuilder(path.length());
            int start = 0;
            for (int i = 0; i <= path.length(); i++) {
                if (i == path.length() || path.charAt(i) == '/') {
                    String segment = path.substring(start, i);
                    int semi = segment.indexOf(';');
                    if (semi >= 0) {
                        segment = segment.substring(0, semi);
                    }
                    normalized.append(segment);
                    if (i < path.length()) {
                        normalized.append('/');
                    }
                    start = i + 1;
                }
            }
            return normalized.toString();
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
            if (isOnboardingPublicRateLimitRequest(request)) {
                return isOnboardingPublicAllowed(clientIp);
            }
            if (isKrPublicDataRateLimitRequest(request)) {
                return isKrPublicDataAllowed(clientIp);
            }
            if (isHomepageInquiryPublicRequest(request)) {
                return isHomepageInquiryAllowed(clientIp);
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

        private boolean isOnboardingPublicAllowed(String clientIp) {
            String key = clientIp + RATE_KEY_SUFFIX_ONBOARDING_PUBLIC;
            RequestInfo info = requestCounts.get(key);
            int maxPerMinute = properties.getRateLimit().getOnboardingPublicRequestsPerMinute();
            return info == null || info.getCount() < maxPerMinute;
        }

        private boolean isKrPublicDataAllowed(String clientIp) {
            String key = clientIp + RATE_KEY_SUFFIX_KR_PUBLIC_DATA;
            RequestInfo info = requestCounts.get(key);
            int maxPerMinute = properties.getRateLimit().getKrPublicDataRequestsPerMinute();
            return info == null || info.getCount() < maxPerMinute;
        }

        private boolean isHomepageInquiryAllowed(String clientIp) {
            int maxPerMinute = properties.getRateLimit().getHomepageInquiryRequestsPerMinute();
            int maxPerDay = properties.getRateLimit().getHomepageInquiryRequestsPerDay();
            return isWindowAllowed(clientIp + RATE_KEY_SUFFIX_HOMEPAGE_INQUIRY_MINUTE, maxPerMinute, MINUTE_WINDOW_MS)
                && isWindowAllowed(clientIp + RATE_KEY_SUFFIX_HOMEPAGE_INQUIRY_DAY, maxPerDay, DAY_WINDOW_MS);
        }

        /**
         * 고정 윈도우: 최초 요청 시각 기준 {@code windowMs} 경과 시 버킷을 폐기하고 허용한다.
         */
        private boolean isWindowAllowed(String key, int max, long windowMs) {
            RequestInfo info = requestCounts.get(key);
            if (info == null) {
                return true;
            }
            long now = System.currentTimeMillis();
            if ((now - info.getWindowStartTime()) > windowMs) {
                requestCounts.remove(key);
                return true;
            }
            return info.getCount() < max;
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
            } else if (isOnboardingPublicRateLimitRequest(request)) {
                String key = clientIp + RATE_KEY_SUFFIX_ONBOARDING_PUBLIC;
                RequestInfo publicInfo = requestCounts.get(key);
                if (publicInfo == null) {
                    publicInfo = new RequestInfo();
                    requestCounts.put(key, publicInfo);
                } else {
                    publicInfo.increment();
                }
            } else if (isKrPublicDataRateLimitRequest(request)) {
                String key = clientIp + RATE_KEY_SUFFIX_KR_PUBLIC_DATA;
                RequestInfo publicDataInfo = requestCounts.get(key);
                if (publicDataInfo == null) {
                    publicDataInfo = new RequestInfo();
                    requestCounts.put(key, publicDataInfo);
                } else {
                    publicDataInfo.increment();
                }
            } else if (isHomepageInquiryPublicRequest(request)) {
                incrementKeyedCount(clientIp + RATE_KEY_SUFFIX_HOMEPAGE_INQUIRY_MINUTE);
                incrementKeyedCount(clientIp + RATE_KEY_SUFFIX_HOMEPAGE_INQUIRY_DAY);
            }
        }

        private void incrementKeyedCount(String key) {
            RequestInfo info = requestCounts.get(key);
            if (info == null) {
                requestCounts.put(key, new RequestInfo());
            } else {
                info.increment();
            }
        }

        /**
         * 전역 map 만료 스캔을 {@link #CLEANUP_INTERVAL_MS} 간격으로만 수행한다.
         * 매 HTTP 요청마다 O(n) 스캔하면 unique-IP junk POST 로 day 키가 쌓일 때 전 API 가 비용 부담한다.
         */
        private void maybeCleanupOldRequests() {
            long now = System.currentTimeMillis();
            long last = lastCleanupEpochMs.get();
            if (now - last < CLEANUP_INTERVAL_MS) {
                return;
            }
            if (!lastCleanupEpochMs.compareAndSet(last, now)) {
                return;
            }
            cleanupOldRequests();
        }

        private void cleanupOldRequests() {
            long currentTime = System.currentTimeMillis();

            requestCounts.entrySet().removeIf(entry -> {
                long windowMs = entry.getKey().endsWith(RATE_KEY_SUFFIX_HOMEPAGE_INQUIRY_DAY)
                    ? DAY_WINDOW_MS
                    : MINUTE_WINDOW_MS;
                return (currentTime - entry.getValue().getLastRequestTime()) > windowMs;
            });
        }

        /**
         * 홈페이지 문의 요청 시 해당 IP 의 min/day 버킷만 만료됐으면 즉시 제거한다.
         */
        private void purgeExpiredHomepageInquiryKeysForIp(String clientIp) {
            long now = System.currentTimeMillis();
            purgeKeyIfExpired(clientIp + RATE_KEY_SUFFIX_HOMEPAGE_INQUIRY_MINUTE, MINUTE_WINDOW_MS, now);
            purgeKeyIfExpired(clientIp + RATE_KEY_SUFFIX_HOMEPAGE_INQUIRY_DAY, DAY_WINDOW_MS, now);
        }

        private void purgeKeyIfExpired(String key, long windowMs, long now) {
            RequestInfo info = requestCounts.get(key);
            if (info == null) {
                return;
            }
            if ((now - info.getLastRequestTime()) > windowMs) {
                requestCounts.remove(key, info);
            }
        }

        private void handleRateLimitExceeded(HttpServletResponse response, HttpServletRequest request)
            throws IOException {
            recordRateLimitBlocked(request);

            String requestPath = request.getRequestURI();
            String blockReason = resolveBlockReason(request);
            log.warn("HTTP 429 rate limit exceeded: uri={}, reason={}", requestPath, blockReason);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);

            if (isLoginRateLimitPath(requestPath)) {
                errorResponse.put("message", "로그인 시도 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요.");
                errorResponse.put("retryAfter", LOGIN_COOLDOWN_MINUTES * 60);
            } else if (isOnboardingCreatePublicRequest(request)) {
                errorResponse.put("message", "온보딩 생성 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
                errorResponse.put("retryAfter", 60);
            } else if (isAccountIntegrationPublicPath(requestPath)) {
                errorResponse.put("message",
                    "계정 연동·이메일 인증 API 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
                errorResponse.put("retryAfter", 60);
            } else if (isOnboardingPublicRateLimitRequest(request)) {
                errorResponse.put("message", "온보딩 공개 API 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
                errorResponse.put("retryAfter", 60);
            } else if (isKrPublicDataRateLimitRequest(request)) {
                errorResponse.put("message", "공공데이터 조회 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
                errorResponse.put("retryAfter", 60);
            } else if (isHomepageInquiryPublicRequest(request)) {
                errorResponse.put("message", "문의 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
                String clientIp = getClientIpAddress(request);
                RequestInfo minuteInfo =
                    requestCounts.get(clientIp + RATE_KEY_SUFFIX_HOMEPAGE_INQUIRY_MINUTE);
                int maxPerMinute = properties.getRateLimit().getHomepageInquiryRequestsPerMinute();
                boolean minuteExceeded = minuteInfo != null && minuteInfo.getCount() >= maxPerMinute;
                errorResponse.put("retryAfter", minuteExceeded ? 60 : 3600);
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
            if (isOnboardingPublicRateLimitRequest(request)) {
                return REASON_ONBOARDING_PUBLIC;
            }
            if (isKrPublicDataRateLimitRequest(request)) {
                return REASON_KR_PUBLIC_DATA;
            }
            if (isHomepageInquiryPublicRequest(request)) {
                return REASON_HOMEPAGE_INQUIRY;
            }
            return REASON_UNKNOWN;
        }

        private String getClientIpAddress(HttpServletRequest request) {
            return HttpRequestClientIp.resolve(request);
        }
    }

    /**
     * IP(및 접미사)별 요청 횟수
     */
    private static class RequestInfo {
        private int count;
        private long lastRequestTime;
        private final long windowStartTime;

        RequestInfo() {
            long now = System.currentTimeMillis();
            this.count = 1;
            this.lastRequestTime = now;
            this.windowStartTime = now;
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

        long getWindowStartTime() {
            return windowStartTime;
        }
    }
}
