package com.coresolution.consultation.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

/**
 * OAuth2 도메인 변환 유틸리티
 * 서브도메인을 메인 도메인으로 변환하여 OAuth2 redirect_uri 일치 문제 해결
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

    static {
        Set<String> labels = new HashSet<>();
        Collections.addAll(labels, "dev", "app", "api", "staging", "www");
        OAUTH_INFRA_SUBDOMAIN_LABELS = Collections.unmodifiableSet(labels);
    }

    @Value("${spring.security.oauth2.domain.main-domains:dev.core-solution.co.kr}")
    private String mainDomainsConfig;

    @Value("${spring.security.oauth2.domain.subdomain-patterns:^dev\\.core-solution\\.co\\.kr$,.*\\.dev\\.core-solution\\.co\\.kr,.*\\.core-solution\\.co\\.kr}")
    private String subdomainPatternsConfig;

    @Value("${spring.security.oauth2.domain.remove-regex-pattern:true}")
    private boolean removeRegexPattern;

    private List<String> mainDomains;
    private List<Pattern> subdomainPatterns;

    @PostConstruct
    public void init() {
        log.info("OAuth2 도메인 변환 설정 초기화 시작: mainDomainsConfig={}, subdomainPatternsConfig={}",
                mainDomainsConfig, subdomainPatternsConfig);
        // 메인 도메인 목록 초기화
        mainDomains = Arrays.asList(mainDomainsConfig.split(","));
        // 서브도메인 패턴 초기화 (잘못된 정규식 시 로그 후 예외)
        List<Pattern> patterns = new ArrayList<>();
        for (String part : subdomainPatternsConfig.split(",")) {
            String trimmed = part.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            try {
                patterns.add(Pattern.compile(trimmed));
            } catch (PatternSyntaxException e) {
                log.error("OAuth2 subdomain 패턴 오류: property=spring.security.oauth2.domain.subdomain-patterns, value={}, error={}",
                        subdomainPatternsConfig, e.getMessage(), e);
                throw new IllegalStateException("OAuth2 subdomain 패턴 설정 오류: " + e.getMessage(), e);
            }
        }
        subdomainPatterns = patterns;
        log.info("OAuth2 도메인 변환 설정 로드: mainDomains={}, subdomainPatterns={}, removeRegexPattern={}",
                mainDomains, subdomainPatternsConfig, removeRegexPattern);
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

        // 정규식 패턴 제거 (Nginx 서브도메인 정규식 패턴이 포함된 경우)
        if (removeRegexPattern && hostWithoutPort.contains("~")) {
            hostWithoutPort = removeRegexPattern(hostWithoutPort);
            if (!hostWithoutPort.equals(originalHost)) {
                log.info("OAuth2 도메인 변환 - 정규식 패턴 제거: {} -> {}", originalHost, hostWithoutPort);
            }
        }

        // 서브도메인 패턴 매칭 및 메인 도메인 변환 (프로필별 spring.security.oauth2.domain.* 로 분기)
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

        // 변환되지 않은 경우 원본 반환
        return hostWithoutPort;
    }

    /**
     * OAuth 콜백이 {@code app.*} / {@code api.*} 등 인프라 호스트로 유입된 뒤, 테넌트 서브도메인을 붙일 때
     * parent 가 {@code tenant.app.core-solution.co.kr} 형이 되지 않도록 apex 로 수렴한다.
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

    private static boolean isOAuthInfraSubdomainLabel(String label) {
        return label != null && !label.isEmpty() && OAUTH_INFRA_SUBDOMAIN_LABELS.contains(label);
    }

    private String findConfiguredDevApexHost() {
        return mainDomains.stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty() && s.contains("dev.core-solution"))
                .findFirst()
                .orElse(null);
    }

    private String findConfiguredProdApexHost() {
        return mainDomains.stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty() && isCoreSolutionProdApexCandidate(s))
                .findFirst()
                .orElse(null);
    }

    /**
     * 정규식 패턴 제거
     */
    private String removeRegexPattern(String host) {
        // 정규식 패턴에서 도메인 추출 시도
        for (String mainDomain : mainDomains) {
            if (host.contains(mainDomain)) {
                return mainDomain;
            }
        }
        
        // 추출 실패 시 첫 번째 메인 도메인 사용
        if (!mainDomains.isEmpty()) {
            return mainDomains.get(0);
        }
        
        return host;
    }

    /**
     * 매칭된 패턴이 "개발 파이프라인"(호스트에 .dev. 세그먼트를 요구하는 정규식)인지에 따라
     * {@code main-domains} 목록에서 OAuth 콜백용 apex 호스트를 고른다.
     * 운영: 보통 첫 패턴은 {@code .*\\.dev\\.core-solution\\.co\\.kr}, 둘째는 {@code .*\\.core-solution\\.co\\.kr}.
     */
    private String resolveOAuthApexHost(String hostWithoutPort, Pattern pattern) {
        if (pattern == null || mainDomains.isEmpty()) {
            return hostWithoutPort;
        }
        final String patternStr = pattern.pattern();
        boolean devPipelinePattern = patternStr.contains("\\.dev\\.") || patternStr.contains("dev\\.core-solution");

        if (devPipelinePattern) {
            Optional<String> devApex = mainDomains.stream()
                    .map(String::trim)
                    .filter(s -> !s.isEmpty() && s.contains("dev.core-solution"))
                    .findFirst();
            if (devApex.isPresent()) {
                return devApex.get();
            }
        } else {
            Optional<String> prodApex = mainDomains.stream()
                    .map(String::trim)
                    .filter(s -> !s.isEmpty() && isCoreSolutionProdApexCandidate(s))
                    .findFirst();
            if (prodApex.isPresent()) {
                return prodApex.get();
            }
        }

        return findMainDomainForPatternLegacy(hostWithoutPort, pattern);
    }

    /** {@code dev.core-solution.co.kr} 같은 개발용 apex 은 제외한 core-solution 운영 apex 후보 */
    private static boolean isCoreSolutionProdApexCandidate(String domain) {
        if (!domain.contains("core-solution")) {
            return false;
        }
        return !domain.contains("dev.core-solution");
    }

    /**
     * 레거시·다른 TLD(m-garden 등): 패턴 문자열과 main-domains 문자열 매칭
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

        if (patternStr.contains("m-garden") || patternStr.contains("m\\-garden")) {
            for (String mainDomain : mainDomains) {
                if (mainDomain != null && mainDomain.contains("m-garden")) {
                    return mainDomain.trim();
                }
            }
        }
        if (patternStr.contains("core-solution") || patternStr.contains("core\\-solution")) {
            for (String mainDomain : mainDomains) {
                if (mainDomain != null && mainDomain.contains("core-solution")) {
                    return mainDomain.trim();
                }
            }
        }

        return mainDomains.isEmpty() ? host : mainDomains.get(0).trim();
    }
}

