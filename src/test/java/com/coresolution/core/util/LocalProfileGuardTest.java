package com.coresolution.core.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

/**
 * {@link LocalProfileGuard} — true local만 허용 (dev는 false).
 *
 * @author CoreSolution
 * @since 2026-09-04
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("LocalProfileGuard")
class LocalProfileGuardTest {

    @Mock
    private Environment environment;

    @Test
    @DisplayName("null Environment → false")
    void nullEnvironment_isFalse() {
        assertThat(LocalProfileGuard.isTrueLocalProfile(null)).isFalse();
    }

    @Test
    @DisplayName("activeProfiles=dev → false")
    void devProfile_isFalse() {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"dev"});
        assertThat(LocalProfileGuard.isTrueLocalProfile(environment)).isFalse();
    }

    @Test
    @DisplayName("activeProfiles=local → true")
    void localProfile_isTrue() {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"local"});
        assertThat(LocalProfileGuard.isTrueLocalProfile(environment)).isTrue();
    }

    @Test
    @DisplayName("activeProfiles=local,dev → true (local 포함)")
    void localAndDev_isTrue() {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"local", "dev"});
        assertThat(LocalProfileGuard.isTrueLocalProfile(environment)).isTrue();
    }

    @Test
    @DisplayName("activeProfiles=prod → false")
    void prodProfile_isFalse() {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"prod"});
        assertThat(LocalProfileGuard.isTrueLocalProfile(environment)).isFalse();
    }
}
