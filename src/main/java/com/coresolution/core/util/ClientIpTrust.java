package com.coresolution.core.util;

import java.util.ArrayList;
import java.util.List;
import org.springframework.security.web.util.matcher.IpAddressMatcher;
import org.springframework.util.StringUtils;

/**
 * 바로 앞 TCP 피어가 설정한 신뢰 대역에 속할 때만, 그 대역에 묶인 헤더를 클라이언트 IP로 인정한다.
 * 헤더 이름과 대역은 호출 측 설정에서 온다. 이 클래스는 헤더를 고르지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public final class ClientIpTrust {

    private static final ClientIpTrust NONE = new ClientIpTrust(List.of());

    private final List<CompiledRule> rules;

    private ClientIpTrust(List<CompiledRule> rules) {
        this.rules = rules;
    }

    /**
     * 전달 헤더를 전혀 믿지 않는다. 클라이언트 IP는 연결 주소만 쓴다.
     *
     * @return 빈 신뢰 정책
     */
    public static ClientIpTrust none() {
        return NONE;
    }

    /**
     * 규칙을 컴파일한다. 헤더가 비었거나 대역이 없는 규칙은 건너뛴다. 대역 문자열이 잘못되면 예외다.
     *
     * @param rules 헤더와 CIDR 목록
     * @return 신뢰 정책
     */
    public static ClientIpTrust of(List<Rule> rules) {
        if (rules == null || rules.isEmpty()) {
            return NONE;
        }
        List<CompiledRule> compiled = new ArrayList<>();
        for (Rule rule : rules) {
            if (rule == null || !StringUtils.hasText(rule.header()) || rule.cidrs() == null) {
                continue;
            }
            List<IpAddressMatcher> matchers = new ArrayList<>();
            for (String cidr : rule.cidrs()) {
                if (!StringUtils.hasText(cidr)) {
                    continue;
                }
                matchers.add(new IpAddressMatcher(cidr.trim()));
            }
            if (!matchers.isEmpty()) {
                compiled.add(new CompiledRule(rule.header().trim(), List.copyOf(matchers)));
            }
        }
        if (compiled.isEmpty()) {
            return NONE;
        }
        return new ClientIpTrust(List.copyOf(compiled));
    }

    /**
     * 피어 주소에 맞는 헤더 이름을 반환한다. 없으면 {@code null}.
     *
     * @param remoteAddr {@link jakarta.servlet.ServletRequest#getRemoteAddr()}
     * @return 설정 헤더 이름 또는 {@code null}
     */
    public String headerForPeer(String remoteAddr) {
        if (!StringUtils.hasText(remoteAddr)) {
            return null;
        }
        for (CompiledRule rule : rules) {
            for (IpAddressMatcher matcher : rule.matchers()) {
                if (matchesPeer(matcher, remoteAddr)) {
                    return rule.header();
                }
            }
        }
        return null;
    }

    private static boolean matchesPeer(IpAddressMatcher matcher, String remoteAddr) {
        try {
            return matcher.matches(remoteAddr);
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    /**
     * 신뢰 프록시 한 줄. {@code header}는 그 프록시가 덮어쓰는 헤더 이름이다.
     *
     * @param header 헤더 이름
     * @param cidrs 피어 CIDR
     */
    public record Rule(String header, List<String> cidrs) {
    }

    private record CompiledRule(String header, List<IpAddressMatcher> matchers) {
    }
}
