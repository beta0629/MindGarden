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

    @Value("${spring.security.oauth2.domain.main-domains:dev.core-solution.co.kr,dev.m-garden.co.kr}")
    private String mainDomainsConfig;

    @Value("${spring.security.oauth2.domain.subdomain-patterns:.*\\.dev\\.core-solution\\.co\\.kr,.*\\.core-solution\\.co\\.kr,.*\\.dev\\.m-garden\\.co\\.kr,.*\\.m-garden\\.co\\.kr}")
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
        String patternStr = pattern.pattern();
        
        // 패턴에서 메인 도메인 추출
        if (patternStr.contains("dev.core-solution.co.kr")) {
            return "dev.core-solution.co.kr";
        } else if (patternStr.contains("core-solution.co.kr") && !host.equals("dev.core-solution.co.kr") && !host.equals("core-solution.co.kr")) {
            return "dev.core-solution.co.kr";
        } else if (patternStr.contains("dev.m-garden.co.kr")) {
            return "dev.m-garden.co.kr";
        } else if (patternStr.contains("m-garden.co.kr") && !host.equals("dev.m-garden.co.kr") && !host.equals("m-garden.co.kr")) {
            return "dev.m-garden.co.kr";
        }
        
        // 기본값: 첫 번째 메인 도메인
        return mainDomains.isEmpty() ? host : mainDomains.get(0);
    }
}

