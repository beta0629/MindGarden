package com.coresolution.consultation.service.support;

import java.util.Arrays;
import java.util.Locale;

import com.coresolution.consultation.constant.ClientEventBackfillConstants;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * {@code client_event} 백필 .dev 전용 환경 가드.
 *
 * <p>활성 프로파일에 {@code dev} 가 있고 {@code prod}/{@code production} 이 없을 때만 허용한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Component
public class ClientEventBackfillEnvironmentGuard {

    private final Environment environment;

    public ClientEventBackfillEnvironmentGuard(Environment environment) {
        this.environment = environment;
    }

    /**
     * 현재 환경이 백필 허용(.dev)인지 검사한다. 아니면 예외.
     *
     * @throws IllegalStateException prod 또는 non-dev
     */
    public void requireDevOnly() {
        if (!isDevOnly()) {
            throw new IllegalStateException(
                    "client_event backfill is allowed only on .dev profile (prod blocked)");
        }
    }

    /**
     * .dev 전용 여부.
     *
     * @return true 이면 허용
     */
    public boolean isDevOnly() {
        String[] profiles = environment.getActiveProfiles();
        if (profiles == null || profiles.length == 0) {
            return false;
        }
        boolean hasDev = false;
        for (String profile : profiles) {
            if (!StringUtils.hasText(profile)) {
                continue;
            }
            String normalized = profile.trim().toLowerCase(Locale.ROOT);
            if (ClientEventBackfillConstants.PROFILE_PROD.equals(normalized)
                    || ClientEventBackfillConstants.PROFILE_PRODUCTION.equals(normalized)) {
                return false;
            }
            if (ClientEventBackfillConstants.PROFILE_DEV.equals(normalized)) {
                hasDev = true;
            }
        }
        return hasDev;
    }

    /**
     * GitHub Actions {@code github.ref} 가 release/dev 인지 검사한다.
     *
     * @param githubRef refs/heads/...
     * @return true 이면 허용
     */
    public static boolean isReleaseDevRef(String githubRef) {
        return ClientEventBackfillConstants.WORKFLOW_REF_RELEASE_DEV.equals(githubRef);
    }

    /**
     * 활성 프로파일 요약(로그용).
     *
     * @return 프로파일 CSV
     */
    public String describeActiveProfiles() {
        return Arrays.toString(environment.getActiveProfiles());
    }
}
