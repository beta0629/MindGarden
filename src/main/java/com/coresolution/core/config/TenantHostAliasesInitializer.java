package com.coresolution.core.config;

import com.coresolution.core.util.TenantHostSubdomainUtil;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * DEV 전용: {@code tenant.host-aliases} / {@code TENANT_HOST_ALIASES} 를
 * {@link TenantHostSubdomainUtil} 에 주입한다 (필터가 Spring 없이 env 만으로도 동작 가능하도록
 * util 자체도 env 를 읽지만, yml 기본값을 앱 기동 시 반영한다).
 *
 * @author CoreSolution
 * @since 2026-10-13
 */
@Slf4j
@Configuration
@Profile("dev")
public class TenantHostAliasesInitializer {

    @Value("${tenant.host-aliases:${TENANT_HOST_ALIASES:}}")
    private String hostAliasesConfig;

    /**
     * 기동 시 호스트 별칭 맵을 util 에 적용한다.
     */
    @PostConstruct
    public void init() {
        TenantHostSubdomainUtil.configureHostAliases(hostAliasesConfig);
        log.info("Tenant host aliases configured (dev): rawLength={}",
                hostAliasesConfig != null ? hostAliasesConfig.length() : 0);
    }
}
