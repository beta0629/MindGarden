package com.coresolution.consultation.sct.service;

import com.coresolution.consultation.util.OAuth2DomainUtil;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * SCT 공개 링크를 테넌트 서브도메인 기준 절대 URL로 조립한다.
 * 온보딩과 동일하게 {@link OAuth2DomainUtil#resolveEnvironmentTenantDomainSuffix} 를 SSOT로 사용한다.
 * 테넌트/서브도메인/접미사 확인 실패 시 fail-closed({@link IllegalStateException}).
 *
 * @author MindGarden
 * @since 2026-03-25
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SctTenantPublicUrlResolver {

    /** 프로토콜만 상수 허용(도메인 문자열 하드코딩 금지). */
    private static final String HTTPS_SCHEME = "https";

    private static final String PUBLIC_SCT_WEB_PREFIX = "/public/sct/";

    private static final String SHORT_LINK_WEB_PREFIX = "/s/";

    /** 로그용 토큰 앞부분 길이 — {@code SctInvitationServiceImpl} tokenPrefix 6자와 정합. */
    static final int TOKEN_LOG_PREFIX_LENGTH = 6;

    private static final String DOMAIN_UNAVAILABLE_MESSAGE =
            "SCT 공개 링크용 테넌트 도메인을 확인할 수 없습니다.";

    private final TenantRepository tenantRepository;
    private final OAuth2DomainUtil oauth2DomainUtil;
    private final Environment environment;

    /**
     * 테넌트 도메인 기준 SCT 공개 절대 URL.
     *
     * @param tenantId 테넌트 ID
     * @param rawToken 평문 초대 토큰
     * @return {@code https://{subdomain}{suffix}/public/sct/{rawToken}}
     * @throws IllegalStateException 테넌트·서브도메인·도메인 접미사 확인 실패
     */
    public String resolveAbsolutePublicUrl(String tenantId, String rawToken) {
        if (!StringUtils.hasText(rawToken)) {
            log.error("SCT 절대 URL 조립 실패: tenantId 또는 rawToken 없음");
            throw new IllegalStateException(DOMAIN_UNAVAILABLE_MESSAGE);
        }
        return resolveAbsoluteUrl(tenantId, PUBLIC_SCT_WEB_PREFIX + rawToken);
    }

    /**
     * 테넌트 도메인 기준 SCT 단축 절대 URL.
     *
     * @param tenantId  테넌트 ID
     * @param shortCode 단축 코드
     * @return {@code https://{subdomain}{suffix}/s/{shortCode}}
     * @throws IllegalStateException 테넌트·서브도메인·도메인 접미사 확인 실패
     */
    public String resolveAbsoluteShortUrl(String tenantId, String shortCode) {
        if (!StringUtils.hasText(shortCode)) {
            log.error("SCT 단축 URL 조립 실패: shortCode 없음");
            throw new IllegalStateException(DOMAIN_UNAVAILABLE_MESSAGE);
        }
        return resolveAbsoluteUrl(tenantId, SHORT_LINK_WEB_PREFIX + shortCode.trim());
    }

    /**
     * 테넌트 호스트 origin만 반환({@code https://{subdomain}{suffix}}).
     *
     * @param tenantId 테넌트
     * @return origin
     */
    public String resolveTenantOrigin(String tenantId) {
        return resolveAbsoluteUrl(tenantId, "");
    }

    private String resolveAbsoluteUrl(String tenantId, String pathAndQuery) {
        if (!StringUtils.hasText(tenantId)) {
            log.error("SCT 절대 URL 조립 실패: tenantId 없음");
            throw new IllegalStateException(DOMAIN_UNAVAILABLE_MESSAGE);
        }
        if (pathAndQuery == null) {
            pathAndQuery = "";
        }
        Tenant tenant = tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId.trim())
                .orElse(null);
        if (tenant == null) {
            log.error("SCT 절대 URL 조립 실패: 테넌트 없음 tenantId={}", tenantId);
            throw new IllegalStateException(DOMAIN_UNAVAILABLE_MESSAGE);
        }
        String subdomain = tenant.getSubdomain();
        if (!StringUtils.hasText(subdomain)) {
            log.error("SCT 절대 URL 조립 실패: subdomain 공백 tenantId={}", tenantId);
            throw new IllegalStateException(DOMAIN_UNAVAILABLE_MESSAGE);
        }
        String domainSuffix;
        try {
            domainSuffix = oauth2DomainUtil.resolveEnvironmentTenantDomainSuffix(
                    environment.getActiveProfiles());
        } catch (IllegalStateException ex) {
            log.error("SCT 절대 URL 조립 실패: 도메인 접미사 결정 불가 tenantId={} cause={}",
                    tenantId, ex.getMessage());
            throw new IllegalStateException(DOMAIN_UNAVAILABLE_MESSAGE, ex);
        }
        if (!StringUtils.hasText(domainSuffix)) {
            log.error("SCT 절대 URL 조립 실패: 도메인 접미사 공백 tenantId={}", tenantId);
            throw new IllegalStateException(DOMAIN_UNAVAILABLE_MESSAGE);
        }
        String hostLabel = subdomain.trim().toLowerCase();
        String suffix = domainSuffix.trim();
        if (!suffix.startsWith(".")) {
            suffix = "." + suffix;
        }
        return HTTPS_SCHEME + "://" + hostLabel + suffix + pathAndQuery;
    }

    /**
     * 절대 URL의 토큰 구간만 앞 {@value #TOKEN_LOG_PREFIX_LENGTH}자 남기고 마스킹.
     *
     * @param absoluteUrl 절대 URL
     * @return 마스킹된 URL(토큰 없으면 원문)
     */
    public static String maskAbsoluteUrlForLog(String absoluteUrl) {
        if (!StringUtils.hasText(absoluteUrl)) {
            return absoluteUrl;
        }
        int idx = absoluteUrl.indexOf(PUBLIC_SCT_WEB_PREFIX);
        if (idx < 0) {
            return absoluteUrl;
        }
        int tokenStart = idx + PUBLIC_SCT_WEB_PREFIX.length();
        if (tokenStart >= absoluteUrl.length()) {
            return absoluteUrl;
        }
        String token = absoluteUrl.substring(tokenStart);
        return absoluteUrl.substring(0, tokenStart) + maskTokenForLog(token);
    }

    /**
     * SMS 본문에서 평문 토큰을 로그용으로 마스킹한 사본.
     *
     * @param message  발송 본문
     * @param rawToken 평문 토큰
     * @return 마스킹된 본문
     */
    public static String maskSmsMessageForLog(String message, String rawToken) {
        if (!StringUtils.hasText(message) || !StringUtils.hasText(rawToken)) {
            return message;
        }
        return message.replace(rawToken, maskTokenForLog(rawToken));
    }

    /**
     * 토큰 앞 {@value #TOKEN_LOG_PREFIX_LENGTH}자만 남기고 나머지 {@code *}.
     *
     * @param rawToken 평문 토큰
     * @return 마스킹 토큰
     */
    public static String maskTokenForLog(String rawToken) {
        if (!StringUtils.hasText(rawToken)) {
            return rawToken;
        }
        int keep = Math.min(TOKEN_LOG_PREFIX_LENGTH, rawToken.length());
        if (keep >= rawToken.length()) {
            return rawToken;
        }
        return rawToken.substring(0, keep) + "*".repeat(rawToken.length() - keep);
    }
}
