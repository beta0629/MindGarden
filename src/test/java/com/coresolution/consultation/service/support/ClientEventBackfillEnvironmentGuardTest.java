package com.coresolution.consultation.service.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ClientEventBackfillConstants;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

/**
 * {@link ClientEventBackfillEnvironmentGuard} — .dev 전용·prod 거부.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientEventBackfillEnvironmentGuard")
class ClientEventBackfillEnvironmentGuardTest {

    @Mock
    private Environment environment;

    @Test
    @DisplayName("dev 프로파일만 있으면 허용")
    void isDevOnly_allowsDev() {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"dev"});
        ClientEventBackfillEnvironmentGuard guard =
                new ClientEventBackfillEnvironmentGuard(environment);
        assertThat(guard.isDevOnly()).isTrue();
        guard.requireDevOnly();
    }

    @Test
    @DisplayName("prod 프로파일이면 거부")
    void isDevOnly_rejectsProd() {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"prod"});
        ClientEventBackfillEnvironmentGuard guard =
                new ClientEventBackfillEnvironmentGuard(environment);
        assertThat(guard.isDevOnly()).isFalse();
        assertThatThrownBy(guard::requireDevOnly)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(".dev");
    }

    @Test
    @DisplayName("dev+prod 동시 활성이면 거부")
    void isDevOnly_rejectsDevPlusProd() {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"dev", "production"});
        ClientEventBackfillEnvironmentGuard guard =
                new ClientEventBackfillEnvironmentGuard(environment);
        assertThat(guard.isDevOnly()).isFalse();
    }

    @Test
    @DisplayName("프로파일 없으면 거부")
    void isDevOnly_rejectsEmpty() {
        when(environment.getActiveProfiles()).thenReturn(new String[] {});
        ClientEventBackfillEnvironmentGuard guard =
                new ClientEventBackfillEnvironmentGuard(environment);
        assertThat(guard.isDevOnly()).isFalse();
    }

    @Test
    @DisplayName("workflow ref 가드는 release/dev 만 허용")
    void isReleaseDevRef() {
        assertThat(ClientEventBackfillEnvironmentGuard.isReleaseDevRef(
                        ClientEventBackfillConstants.WORKFLOW_REF_RELEASE_DEV))
                .isTrue();
        assertThat(ClientEventBackfillEnvironmentGuard.isReleaseDevRef("refs/heads/release/prod"))
                .isFalse();
        assertThat(ClientEventBackfillEnvironmentGuard.isReleaseDevRef("refs/heads/main"))
                .isFalse();
    }
}
