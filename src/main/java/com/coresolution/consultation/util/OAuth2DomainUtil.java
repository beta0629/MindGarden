package com.coresolution.consultation.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;
import java.util.stream.Collectors;

/**
 * OAuth2 도메인 변환 유틸리티
 * 서브도메인을 메인 도메인으로 변환하여 OAuth2 redirect_uri 일치 문제 해결
 *
 * <p>호스트·apex 문자열은 env({@code OAUTH2_MAIN_DOMAINS}, {@code OAUTH2_SUBDOMAIN_PATTERNS},
 * {@code OAUTH2_TENANT_PARENT_DOMAIN_SUFFIXES}) / Spring 설정만 사용한다. Java 소스에 도메인 하드코딩 금지.</p>
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-16
 */
@Slf4j
@Component
public class OAuth2DomainUtil {

    /**
     * 프론트 {@code subdomainUtils.DEFAULT_SUBDOMAINS} 과 동기: 테넌트가 아닌 인프라용 1단 라벨.
     */
    private static final Set<String> OAUTH_INFRA_SUBDOMAIN_LABELS;

    /** TenantContextFilter 예약 라벨 + 온보딩 reserved (admin, ops, apply) */
    private static final Set<String> NON_TENANT_SUBDOMAIN_LABELS;

    static {
        Set<String> labels = new HashSet<>();
        Collections.addAll(labels, "dev", "app", "api", "staging", "www");
        OAUTH_INFRA_SUBDOMAIN_LABELS = Collections.unmodifiableSet(labels);

        Set<String> nonTenantLabels = new HashSet<>(labels);
        Collections.addAll(nonTenantLabels, "admin", "ops", "apply");
        NON_TENANT_SUBDOMAIN_LABELS = Collections.unmodifiableSet(nonTenantLabels);
    }

    @Value("${spring.security.oauth2.domain.main-domains:${OAUTH2_MAIN_DOMAINS:}}")
    private String mainDomainsConfig;

    @Value("${spring.security.oauth2.domain.subdomain-patterns:${OAUTH2_SUBDOMAIN_PATTERNS:}}")
    private String subdomainPatternsConfig;

    @Value("${spring.security.oauth2.domain.tenant-parent-suffixes:${OAUTH2_TENANT_PARENT_DOMAIN_SUFFIXES:}}")
    private String tenantParentSuffixesConfig;

    @Value("${spring.security.oauth2.domain.remove-regex-pattern:true}")
    private boolean removeRegexPattern;

    private List<String> mainDomains;
    private List<Pattern> subdomainPatterns;
    /** 긴 suffix 우선 — {@code .{mainDomain}} 또는 env 명시 목록 */
    private List<String> tenantParentDomainSuffixes;

    @PostConstruct
    public void init() {
        log.info("OAuth2 도메인 변환 설정 초기화 시작: mainDomainsConfig 길이={}, subdomainPatternsConfig 길이={}",
                mainDomainsConfig != null ? mainDomainsConfig.length() : 0,
                subdomainPatternsConfig != null ? subdomainPatternsConfig.length() : 0);
        mainDomains = Arrays.stream(mainDomainsConfig != null ? mainDomainsConfig.split(",") : new String[0])
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        List<Pattern> patterns = new ArrayList<>();
        if (subdomainPatternsConfig != null) {
            for (String part : subdomainPatternsConfig.split(",")) {
                String trimmed = part.trim();
                if (trimmed.isEmpty()) {
                    continue;
                }
                try {
                    patterns.add(Pattern.compile(trimmed));
                } catch (PatternSyntaxException e) {
                    log.error("OAuth2 subdomain 패턴 오류: property=spring.security.oauth2.domain.subdomain-patterns, error={}",
                            e.getMessage(), e);
                    throw new IllegalStateException("OAuth2 subdomain 패턴 설정 오류: " + e.getMessage(), e);
                }
            }
        }
        subdomainPatterns = patterns;
        tenantParentDomainSuffixes = resolveTenantParentSuffixes();
        if (mainDomains.isEmpty()) {
            log.warn("OAuth2 main-domains 미설정(OAUTH2_MAIN_DOMAINS) — convertToMainDomain 은 호스트 그대로 반환");
        }
        log.info("OAuth2 도메인 변환 설정 로드: mainDomainCount={}, subdomainPatternCount={}, tenantSuffixCount={}, removeRegexPattern={}",
                mainDomains.size(), subdomainPatterns.size(), tenantParentDomainSuffixes.size(), removeRegexPattern);
    }

    private List<String> resolveTenantParentSuffixes() {
        List<String> fromEnv = Arrays.stream(
                        tenantParentSuffixesConfig != null ? tenantParentSuffixesConfig.split(",") : new String[0])
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.startsWith(".") ? s : "." + s)
                .sorted(Comparator.comparingInt(String::length).reversed())
                .collect(Collectors.toList());
        if (!fromEnv.isEmpty()) {
            return fromEnv;
        }
        return mainDomains.stream()
                .map(d -> "." + d)
                .sorted(Comparator.comparingInt(String::length).reversed())
                .collect(Collectors.toList());
    }

    /**
     * 서브도메인을 메인 도메인으로 변환
     *
     * @param host 호스트명 (포트 포함 가능)
     * @return 변환된 메인 도메인 또는 원본 호스트
     */
    public String convertToMainDomain(String host) {
        if (host == null || host.isEmpty()) {
            return host;
        }

        String hostWithoutPort = host.split(":")[0];
        String originalHost = hostWithoutPort;

        if (removeRegexPattern && hostWithoutPort.contains("~")) {
            hostWithoutPort = removeRegexPattern(hostWithoutPort);
            if (!hostWithoutPort.equals(originalHost)) {
                log.info("OAuth2 도메인 변환 - 정규식 패턴 제거: {} -> {}", originalHost, hostWithoutPort);
            }
        }

        // 이미 설정된 apex(main-domains) 이면 변환하지 않음
        for (String apex : mainDomains) {
            if (apex != null && hostWithoutPort.equals(apex.trim())) {
                return hostWithoutPort;
            }
        }

        for (Pattern pattern : subdomainPatterns) {
            if (pattern.matcher(hostWithoutPort).matches()) {
                String mainDomain = resolveOAuthApexHost(hostWithoutPort, pattern);
                if (mainDomain != null) {
                    if (mainDomain.equals(hostWithoutPort)) {
                        return hostWithoutPort;
                    }
                    log.info("OAuth2 도메인 변환 - 서브도메인을 메인 도메인으로 변환: {} -> {}", hostWithoutPort, mainDomain);
                    return mainDomain;
                }
            }
        }

        return hostWithoutPort;
    }

    /**
     * OAuth 콜백이 인프라 호스트로 유입된 뒤 테넌트 서브도메인을 붙일 때 parent 를 apex 로 수렴한다.
     *
     * @param parentDomain 테넌트 라벨 제거 후(또는 원본) 부모 호스트, 포트 없음
     * @return 정규화된 parent (변경 없으면 입력과 동일)
     */
    public String normalizeFrontendParentDomainForRedirect(String parentDomain) {
        if (parentDomain == null || parentDomain.isEmpty() || mainDomains == null || mainDomains.isEmpty()) {
            return parentDomain;
        }
        String devApex = findConfiguredDevApexHost();
        String prodApex = findConfiguredProdApexHost();
        if (devApex != null && parentDomain.equals(devApex)) {
            return parentDomain;
        }
        if (prodApex != null && parentDomain.equals(prodApex)) {
            return parentDomain;
        }
        if (devApex != null && parentDomain.endsWith("." + devApex)) {
            String head = parentDomain.substring(0, parentDomain.length() - devApex.length() - 1);
            if (!head.contains(".") && isOAuthInfraSubdomainLabel(head)) {
                return devApex;
            }
        }
        if (prodApex != null && parentDomain.endsWith("." + prodApex)) {
            String head = parentDomain.substring(0, parentDomain.length() - prodApex.length() - 1);
            if (!head.contains(".") && isOAuthInfraSubdomainLabel(head)) {
                return prodApex;
            }
        }
        return parentDomain;
    }

    /**
     * 요청 Host 기준 테넌트 parent 도메인 (온보딩 subdomain 미리보기 등).
     *
     * @param requestHost X-Forwarded-Host / Host (포트 포함 가능), null 이면 설정 fallback
     * @return parent FQDN
     */
    public String resolveTenantParentDomain(String requestHost) {
        if (requestHost == null || requestHost.trim().isEmpty()) {
            return resolveFallbackTenantParentDomain();
        }

        String hostWithoutPort = requestHost.split(":")[0].trim().toLowerCase();
        String tenantLabel = extractTenantSubdomainLabel(hostWithoutPort);
        String parentDomain = hostWithoutPort;
        if (tenantLabel != null) {
            parentDomain = hostWithoutPort.substring(tenantLabel.length() + 1);
        }
        parentDomain = normalizeTenantParentDomainForPreview(parentDomain);
        if (parentDomain == null || parentDomain.isEmpty()) {
            return resolveFallbackTenantParentDomain();
        }
        return parentDomain;
    }

    /**
     * 온보딩 subdomain-check 등에서 표시할 테넌트 FQDN 미리보기.
     *
     * @param tenantSubdomain 사용자 입력 서브도메인
     * @param requestHost     요청 Host (null 이면 spring.security.oauth2.domain.main-domains fallback)
     * @return {@code {subdomain}.{parent}} 또는 subdomain 비어 있으면 null
     */
    public String buildTenantHost(String tenantSubdomain, String requestHost) {
        if (tenantSubdomain == null || tenantSubdomain.trim().isEmpty()) {
            return null;
        }
        String parent = resolveTenantParentDomain(requestHost);
        if (parent == null || parent.isEmpty()) {
            return null;
        }
        return tenantSubdomain.trim().toLowerCase() + "." + parent;
    }

    private String normalizeTenantParentDomainForPreview(String parentDomain) {
        if (parentDomain == null || parentDomain.isEmpty()) {
            return parentDomain;
        }
        parentDomain = normalizeFrontendParentDomainForRedirect(parentDomain);

        String stagingApex = findConfiguredStagingApexHost();
        if (stagingApex != null && parentDomain.endsWith("." + stagingApex)) {
            String head = parentDomain.substring(0, parentDomain.length() - stagingApex.length() - 1);
            if (!head.contains(".") && isOAuthInfraSubdomainLabel(head)) {
                return stagingApex;
            }
        }
        if (stagingApex != null && parentDomain.equals(stagingApex)) {
            return parentDomain;
        }
        return parentDomain;
    }

    private String extractTenantSubdomainLabel(String hostWithoutPort) {
        if (hostWithoutPort == null || hostWithoutPort.isEmpty()) {
            return null;
        }
        for (String suffix : tenantParentDomainSuffixes) {
            if (!hostWithoutPort.endsWith(suffix)) {
                continue;
            }
            String label = hostWithoutPort.substring(0, hostWithoutPort.length() - suffix.length());
            if (label.isEmpty() || label.contains(".")) {
                return null;
            }
            if (NON_TENANT_SUBDOMAIN_LABELS.contains(label)) {
                return null;
            }
            return label;
        }
        return null;
    }

    private String resolveFallbackTenantParentDomain() {
        String prodApex = findConfiguredProdApexHost();
        if (prodApex != null) {
            return prodApex;
        }
        String devApex = findConfiguredDevApexHost();
        if (devApex != null) {
            return devApex;
        }
        String stagingApex = findConfiguredStagingApexHost();
        if (stagingApex != null) {
            return stagingApex;
        }
        if (mainDomains != null && !mainDomains.isEmpty()) {
            String first = mainDomains.get(0).trim();
            if (!first.isEmpty()) {
                return first;
            }
        }
        return null;
    }

    private String findConfiguredStagingApexHost() {
        return mainDomains.stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty() && hostHasDnsLabel(s, "staging"))
                .findFirst()
                .orElse(null);
    }

    private static boolean isOAuthInfraSubdomainLabel(String label) {
        return label != null && !label.isEmpty() && OAUTH_INFRA_SUBDOMAIN_LABELS.contains(label);
    }

    private String findConfiguredDevApexHost() {
        return mainDomains.stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty() && hostHasDnsLabel(s, "dev"))
                .findFirst()
                .orElse(null);
    }

    private String findConfiguredProdApexHost() {
        return mainDomains.stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty() && isProdApexCandidate(s))
                .findFirst()
                .orElse(null);
    }

    private String removeRegexPattern(String host) {
        for (String mainDomain : mainDomains) {
            if (host.contains(mainDomain)) {
                return mainDomain;
            }
        }

        if (!mainDomains.isEmpty()) {
            return mainDomains.get(0);
        }

        return host;
    }

    /**
     * 매칭된 패턴이 개발 파이프라인(호스트에 {@code .dev.} DNS 라벨을 요구하는 정규식)인지에 따라
     * {@code main-domains} 목록에서 OAuth 콜백용 apex 호스트를 고른다.
     */
    private String resolveOAuthApexHost(String hostWithoutPort, Pattern pattern) {
        if (pattern == null || mainDomains.isEmpty()) {
            return hostWithoutPort;
        }
        final String patternStr = pattern.pattern();
        boolean devPipelinePattern = patternStr.contains("\\.dev\\.") || patternStr.contains(".dev.");

        if (devPipelinePattern) {
            Optional<String> devApex = mainDomains.stream()
                    .map(String::trim)
                    .filter(s -> !s.isEmpty() && hostHasDnsLabel(s, "dev"))
                    .findFirst();
            if (devApex.isPresent()) {
                return devApex.get();
            }
        } else {
            Optional<String> prodApex = mainDomains.stream()
                    .map(String::trim)
                    .filter(s -> !s.isEmpty() && isProdApexCandidate(s))
                    .findFirst();
            if (prodApex.isPresent()) {
                return prodApex.get();
            }
        }

        return findMainDomainForPatternLegacy(hostWithoutPort, pattern);
    }

    /** DNS 라벨에 {@code dev}/{@code staging} 이 없는 apex 후보 */
    private static boolean isProdApexCandidate(String domain) {
        return !hostHasDnsLabel(domain, "dev") && !hostHasDnsLabel(domain, "staging");
    }

    private static boolean hostHasDnsLabel(String host, String label) {
        if (host == null || label == null || label.isEmpty()) {
            return false;
        }
        for (String part : host.split("\\.")) {
            if (label.equalsIgnoreCase(part)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 레거시·다른 TLD: 패턴 문자열과 main-domains 문자열 매칭
     */
    private String findMainDomainForPatternLegacy(String host, Pattern pattern) {
        if (pattern == null) {
            return mainDomains.isEmpty() ? host : mainDomains.get(0).trim();
        }

        final String patternStr = pattern.pattern();

        for (String mainDomain : mainDomains) {
            if (mainDomain == null) {
                continue;
            }
            String trimmed = mainDomain.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            String escaped = trimmed.replace(".", "\\.");
            if (patternStr.contains(trimmed) || patternStr.contains(escaped)) {
                return trimmed;
            }
        }

        return mainDomains.isEmpty() ? host : mainDomains.get(0).trim();
    }
}
