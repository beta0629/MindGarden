package com.mindgarden.ops.service.onboarding;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.file.Files;
import java.nio.file.Path;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 온보딩 임시 비밀번호가 요청마다 생성되고, 고정 폴백 문자열이 소스에 없는지를 검증한다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@DisplayName("온보딩 임시 비밀번호 생성")
class OnboardingTemporaryPasswordGeneratorTest {

    /** 제거 대상이던 고정 폴백. 소스에 남아 있으면 실패한다. */
    private static final String FORBIDDEN_FALLBACK = "TempPassword123!";

    @Test
    @DisplayName("OnboardingService 소스에 고정 폴백 문자열이 없다")
    void onboardingServiceSourceDoesNotContainLegacyFallback() throws Exception {
        String service = Files.readString(Path.of(
                "src/main/java/com/mindgarden/ops/service/onboarding/OnboardingService.java"));
        String generator = Files.readString(Path.of(
                "src/main/java/com/mindgarden/ops/service/onboarding/OnboardingTemporaryPasswordGenerator.java"));

        assertThat(service).doesNotContain(FORBIDDEN_FALLBACK);
        assertThat(generator).doesNotContain(FORBIDDEN_FALLBACK);
    }

    @Test
    @DisplayName("체크리스트가 없으면 정책 통과 비밀번호를 요청마다 인코딩한다")
    void missingChecklist_encodesAFreshPolicyPassword() {
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(encoder.encode(anyString())).thenAnswer(invocation -> "ENC:" + invocation.getArgument(0));
        OnboardingService service = newService(encoder);

        String first = service.resolveAdminPasswordHash(null);
        String second = service.resolveAdminPasswordHash("");

        assertThat(first).startsWith("ENC:");
        assertThat(second).startsWith("ENC:");
        assertThat(first).isNotEqualTo(second);
        assertThat(first).doesNotContain(FORBIDDEN_FALLBACK);
        assertThat(second).doesNotContain(FORBIDDEN_FALLBACK);
        assertThat(OnboardingTemporaryPasswordGenerator.meetsLoginPolicy(first.substring(4))).isTrue();
        assertThat(OnboardingTemporaryPasswordGenerator.meetsLoginPolicy(second.substring(4))).isTrue();
    }

    @Test
    @DisplayName("저장된 BCrypt 해시는 다시 인코딩하지 않는다")
    void storedBcryptHash_isKeptAsIs() {
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        OnboardingService service = newService(encoder);
        String bcrypt = "$2a$10$" + "a".repeat(53);
        String json = "{\"adminPassword\":\"" + bcrypt + "\"}";

        assertThat(service.resolveAdminPasswordHash(json)).isEqualTo(bcrypt);
        verify(encoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("정책 통과 평문은 그 값을 인코딩하고 고정 폴백으로 바꾸지 않는다")
    void policyPlaintext_isEncodedWithoutFallback() {
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(encoder.encode(anyString())).thenAnswer(invocation -> "ENC:" + invocation.getArgument(0));
        OnboardingService service = newService(encoder);
        String chosen = "Kq8!mN3@bX";

        assertThat(service.resolveAdminPasswordHash("{\"adminPassword\":\"" + chosen + "\"}"))
                .isEqualTo("ENC:" + chosen);
    }

    private static OnboardingService newService(PasswordEncoder encoder) {
        return new OnboardingService(null, null, null, encoder, new ObjectMapper());
    }
}
