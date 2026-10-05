package com.coresolution.core.config;

import java.util.ArrayList;
import java.util.List;
import com.coresolution.consultation.config.MindgardenSecurityProperties;
import com.coresolution.core.util.ClientIpTrust;
import com.coresolution.core.util.HttpRequestClientIp;
import org.springframework.stereotype.Component;

/**
 * {@code mindgarden.security.client-ip} 를 클라이언트 IP 판정에 넣는다.
 * 대역과 헤더 이름은 YAML에만 둔다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Component
public class ClientIpConfiguration {

    /**
     * @param properties 보안 설정
     */
    public ClientIpConfiguration(MindgardenSecurityProperties properties) {
        HttpRequestClientIp.configure(toTrust(properties));
    }

    private static ClientIpTrust toTrust(MindgardenSecurityProperties properties) {
        if (properties == null || properties.getClientIp() == null
                || properties.getClientIp().getTrustedProxies() == null) {
            return ClientIpTrust.none();
        }
        List<ClientIpTrust.Rule> rules = new ArrayList<>();
        for (MindgardenSecurityProperties.ClientIp.TrustedProxy proxy : properties.getClientIp().getTrustedProxies()) {
            if (proxy == null) {
                continue;
            }
            rules.add(new ClientIpTrust.Rule(proxy.getHeader(), proxy.getCidrs()));
        }
        return ClientIpTrust.of(rules);
    }
}
