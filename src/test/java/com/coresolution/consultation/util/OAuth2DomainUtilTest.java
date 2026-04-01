package com.coresolution.consultation.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * OAuth2 콜백용 apex 도메인 수렴 검증 (운영 *.core-solution.co.kr → core-solution.co.kr)
 */
class OAuth2DomainUtilTest {

    private OAuth2DomainUtil util;

    @BeforeEach
    void setUp() {
        util = new OAuth2DomainUtil();
        // application-prod.yml 과 동일: 운영 apex 우선 → *.core-solution.co.kr 매칭 시 core-solution.co.kr
        ReflectionTestUtils.setField(util, "mainDomainsConfig", "core-solution.co.kr,dev.core-solution.co.kr");
        ReflectionTestUtils.setField(util, "subdomainPatternsConfig",
                "^dev\\.core-solution\\.co\\.kr$,.*\\.dev\\.core-solution\\.co\\.kr,.*\\.core-solution\\.co\\.kr");
        ReflectionTestUtils.setField(util, "removeRegexPattern", true);
        util.init();
    }

    @Test
    void productionTenantHost_mapsToCoreSolutionApex() {
        assertEquals("core-solution.co.kr", util.convertToMainDomain("mindgarden.core-solution.co.kr"));
    }

    @Test
    void devTenantHost_mapsToDevCoreSolutionApex() {
        assertEquals("dev.core-solution.co.kr", util.convertToMainDomain("mindgarden.dev.core-solution.co.kr"));
    }

    @Test
    void devApexHost_mapsToDev() {
        assertEquals("dev.core-solution.co.kr", util.convertToMainDomain("dev.core-solution.co.kr"));
    }

    @Test
    void devProfileStyle_mainDomains_devFirst_stillBranchesByPattern() {
        OAuth2DomainUtil devUtil = new OAuth2DomainUtil();
        ReflectionTestUtils.setField(devUtil, "mainDomainsConfig", "dev.core-solution.co.kr,core-solution.co.kr");
        ReflectionTestUtils.setField(devUtil, "subdomainPatternsConfig",
                "^dev\\.core-solution\\.co\\.kr$,.*\\.dev\\.core-solution\\.co\\.kr,.*\\.core-solution\\.co\\.kr");
        ReflectionTestUtils.setField(devUtil, "removeRegexPattern", true);
        devUtil.init();
        assertEquals("dev.core-solution.co.kr", devUtil.convertToMainDomain("tenant.dev.core-solution.co.kr"));
        assertEquals("core-solution.co.kr", devUtil.convertToMainDomain("tenant.core-solution.co.kr"));
    }
}
