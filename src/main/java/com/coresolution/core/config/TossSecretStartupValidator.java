package com.coresolution.core.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.core.env.PropertyResolver;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 토스 실결제 모드 기동 검증.
 *
 * <p>실결제 모드(payment.toss.simulation-mode=false)에서 PAYMENT_TOSS_SECRET_KEY 가 없으면 기동을 중단한다.
 * 시뮬레이션 모드(기본값)에서는 시크릿 키 없이 정상 기동한다. 값은 로그에 출력하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-30
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TossSecretStartupValidator {

    static final String ENV_PAYMENT_TOSS_SECRET_KEY = "PAYMENT_TOSS_SECRET_KEY";
    static final String PROP_TOSS_SECRET_KEY = "payment.toss.secret-key";
    static final String PROP_TOSS_SIMULATION_MODE = "payment.toss.simulation-mode";

    private final Environment environment;

    /**
     * 실결제 모드에서 토스 시크릿 키 누락 시 기동을 중단한다.
     *
     * @throws IllegalStateException 실결제 모드인데 시크릿 키 미설정
     */
    @PostConstruct
    public void validate() {
        if (isMissingLiveSecret(environment)) {
            String message = "토스 실결제 모드(simulation-mode=false)인데 환경 변수 "
                    + ENV_PAYMENT_TOSS_SECRET_KEY + " 가 설정되지 않았습니다.";
            log.error("❌ {}", message);
            throw new IllegalStateException(message);
        }
    }

    /**
     * 실결제 모드이면서 시크릿 키가 비어 있는지 여부.
     *
     * @param resolver 프로퍼티 조회기
     * @return 실결제 모드 + 시크릿 키 미설정이면 true
     */
    static boolean isMissingLiveSecret(PropertyResolver resolver) {
        boolean simulationMode = resolver.getProperty(PROP_TOSS_SIMULATION_MODE, Boolean.class, Boolean.TRUE);
        return !simulationMode && !StringUtils.hasText(resolver.getProperty(PROP_TOSS_SECRET_KEY));
    }
}
