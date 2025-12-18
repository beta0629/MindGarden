package com.coresolution.consultation.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

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

    @Value("${spring.security.oauth2.domain.main-domains:dev.core-solution.co.kr}")
    private String mainDomainsConfig;

    @Value("${spring.security.oauth2.domain.subdomain-patterns:.*\\.dev\\.core-solution\\.co\\.kr,.*\\.core-solution\\.co\\.kr}")
    private String subdomainPatternsConfig;

    @Value("${spring.security.oauth2.domain.remove-regex-pattern:true}")
    private boolean removeRegexPattern;

    private List<String> mainDomains;
    private List<Pattern> subdomainPatterns;

    @PostConstruct
    public void init() {
        // 메인 도메인 목록 초기화
        mainDomains = Arrays.asList(mainDomainsConfig.split(","));
        
        // 서브도메인 패턴 초기화
        subdomainPatterns = Arrays.stream(subdomainPatternsConfig.split(","))
                .map(String::trim)
                .map(Pattern::compile)
                .toList();
        
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

        // 서브도메인 패턴 매칭 및 메인 도메인 변환
        for (Pattern pattern : subdomainPatterns) {
            if (pattern.matcher(hostWithoutPort).matches()) {
                // 패턴에 매칭되는 경우, 해당 패턴의 메인 도메인 찾기
                String mainDomain = findMainDomainForPattern(hostWithoutPort, pattern);
                if (mainDomain != null && !mainDomain.equals(hostWithoutPort)) {
                    log.info("OAuth2 도메인 변환 - 서브도메인을 메인 도메인으로 변환: {} -> {}", hostWithoutPort, mainDomain);
                    return mainDomain;
                }
            }
        }

        // 변환되지 않은 경우 원본 반환
        return hostWithoutPort;
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
     * 패턴에 매칭되는 메인 도메인 찾기
     */
    private String findMainDomainForPattern(String host, Pattern pattern) {
        if (pattern == null) {
            return mainDomains.isEmpty() ? host : mainDomains.get(0);
        }

        final String patternStr = pattern.pattern();

        // 1) 패턴 문자열에 메인 도메인이 직접 포함된 경우(또는 \.로 escape된 경우) 우선 매핑
        // 예) ".*\\.dev\\.m-garden\\.co\\.kr" 에서 "dev.m-garden.co.kr" 을 찾음
        for (String mainDomain : mainDomains) {
            if (mainDomain == null) {
                continue;
            }
            String trimmed = mainDomain.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            // 정규식 문자열에는 '.'이 '\\.'로 들어갈 수 있으므로 둘 다 대응
            String escaped = trimmed.replace(".", "\\.");
            if (patternStr.contains(trimmed) || patternStr.contains(escaped)) {
                return trimmed;
            }
        }

        // 2) 패턴 문자열이 "m-garden.co.kr" 또는 "core-solution.co.kr" 같은 상위 도메인만 포함하는 케이스 대응
        // (예: ".*\\.m-garden\\.co\\.kr" 은 "dev.m-garden.co.kr" 을 직접 포함하지 않음)
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

        // 기본값: 첫 번째 메인 도메인
        return mainDomains.isEmpty() ? host : mainDomains.get(0).trim();
    }
}

