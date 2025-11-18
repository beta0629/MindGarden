package com.mindgarden.consultation.integration;

import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.UserPasskey;
import com.mindgarden.consultation.repository.UserPasskeyRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.PasskeyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Passkey 인증 통합 테스트
 * Week 17-18: Passkey 인증 구현
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@SpringBootTest(classes = com.mindgarden.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("Passkey 인증 통합 테스트")
class PasskeyIntegrationTest {

    @Autowired
    private PasskeyService passkeyService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserPasskeyRepository passkeyRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        // 테스트용 사용자 생성
        testUser = new User();
        testUser.setEmail("passkey-test@example.com");
        testUser.setName("Passkey Test User");
        testUser.setUsername("passkey-test-user");
        testUser.setPassword("test-password-123");
        testUser = userRepository.save(testUser);
    }

    @Test
    @DisplayName("Passkey 등록 시작 - 통합 테스트")
    void testStartRegistration_Integration() {
        // When
        Map<String, Object> result = passkeyService.startRegistration(testUser.getId(), "테스트 기기");

        // Then
        assertThat(result).isNotNull();
        assertThat(result.get("success")).isEqualTo(true);
        assertThat(result.get("options")).isNotNull();
        
        @SuppressWarnings("unchecked")
        Map<String, Object> options = (Map<String, Object>) result.get("options");
        assertThat(options.get("challenge")).isNotNull();
        assertThat(options.get("challengeKey")).isNotNull();
    }

    @Test
    @DisplayName("Passkey 등록 완료 - 통합 테스트")
    void testFinishRegistration_Integration() {
        // Given
        Map<String, Object> startResult = passkeyService.startRegistration(testUser.getId(), "테스트 기기");
        @SuppressWarnings("unchecked")
        Map<String, Object> options = (Map<String, Object>) startResult.get("options");
        String challengeKey = (String) options.get("challengeKey");

        Map<String, Object> credential = new java.util.HashMap<>();
        credential.put("id", "test-credential-id-123");
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("clientDataJSON", "test-client-data");
        response.put("attestationObject", "test-attestation-object");
        credential.put("response", response);
        credential.put("type", "public-key");

        // When
        Map<String, Object> result = passkeyService.finishRegistration(
                testUser.getId(), credential, challengeKey, "테스트 기기");

        // Then
        assertThat(result).isNotNull();
        assertThat(result.get("success")).isEqualTo(true);
        assertThat(result.get("passkeyId")).isNotNull();

        // Passkey가 실제로 저장되었는지 확인
        Long passkeyId = ((Number) result.get("passkeyId")).longValue();
        UserPasskey savedPasskey = passkeyRepository.findById(passkeyId).orElse(null);
        assertThat(savedPasskey).isNotNull();
        assertThat(savedPasskey.getCredentialId()).isEqualTo("test-credential-id-123");
    }

    @Test
    @DisplayName("Passkey 인증 시작 - 통합 테스트")
    void testStartAuthentication_Integration() {
        // Given: Passkey 등록
        Map<String, Object> startResult = passkeyService.startRegistration(testUser.getId(), "테스트 기기");
        @SuppressWarnings("unchecked")
        Map<String, Object> options = (Map<String, Object>) startResult.get("options");
        String challengeKey = (String) options.get("challengeKey");

        Map<String, Object> credential = new java.util.HashMap<>();
        credential.put("id", "test-credential-id-456");
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("clientDataJSON", "test-client-data");
        response.put("attestationObject", "test-attestation-object");
        credential.put("response", response);
        credential.put("type", "public-key");

        passkeyService.finishRegistration(testUser.getId(), credential, challengeKey, "테스트 기기");

        // When
        Map<String, Object> result = passkeyService.startAuthentication(testUser.getEmail());

        // Then
        assertThat(result).isNotNull();
        assertThat(result.get("success")).isEqualTo(true);
        @SuppressWarnings("unchecked")
        Map<String, Object> authOptions = (Map<String, Object>) result.get("options");
        assertThat(authOptions.get("challenge")).isNotNull();
        assertThat(authOptions.get("allowCredentials")).isNotNull();
    }

    @Test
    @DisplayName("Passkey 목록 조회 - 통합 테스트")
    void testListPasskeys_Integration() {
        // Given: Passkey 등록
        Map<String, Object> startResult = passkeyService.startRegistration(testUser.getId(), "테스트 기기 1");
        @SuppressWarnings("unchecked")
        Map<String, Object> options = (Map<String, Object>) startResult.get("options");
        String challengeKey = (String) options.get("challengeKey");

        Map<String, Object> credential = new java.util.HashMap<>();
        credential.put("id", "test-credential-id-789");
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("clientDataJSON", "test-client-data");
        response.put("attestationObject", "test-attestation-object");
        credential.put("response", response);
        credential.put("type", "public-key");

        passkeyService.finishRegistration(testUser.getId(), credential, challengeKey, "테스트 기기 1");

        // When
        Map<String, Object> result = passkeyService.listPasskeys(testUser.getId());

        // Then
        assertThat(result).isNotNull();
        assertThat(result.get("success")).isEqualTo(true);
        @SuppressWarnings("unchecked")
        java.util.List<Map<String, Object>> passkeys = 
                (java.util.List<Map<String, Object>>) result.get("passkeys");
        assertThat(passkeys).isNotEmpty();
        assertThat(passkeys.get(0).get("deviceName")).isEqualTo("테스트 기기 1");
    }

    @Test
    @DisplayName("Passkey 삭제 - 통합 테스트")
    void testDeletePasskey_Integration() {
        // Given: Passkey 등록
        Map<String, Object> startResult = passkeyService.startRegistration(testUser.getId(), "삭제 테스트 기기");
        @SuppressWarnings("unchecked")
        Map<String, Object> options = (Map<String, Object>) startResult.get("options");
        String challengeKey = (String) options.get("challengeKey");

        Map<String, Object> credential = new java.util.HashMap<>();
        credential.put("id", "test-credential-id-delete");
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("clientDataJSON", "test-client-data");
        response.put("attestationObject", "test-attestation-object");
        credential.put("response", response);
        credential.put("type", "public-key");

        Map<String, Object> finishResult = passkeyService.finishRegistration(
                testUser.getId(), credential, challengeKey, "삭제 테스트 기기");
        Long passkeyId = ((Number) finishResult.get("passkeyId")).longValue();

        // When
        Map<String, Object> result = passkeyService.deletePasskey(testUser.getId(), passkeyId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.get("success")).isEqualTo(true);

        // Passkey가 실제로 삭제되었는지 확인
        UserPasskey deletedPasskey = passkeyRepository.findById(passkeyId).orElse(null);
        assertThat(deletedPasskey).isNotNull();
        assertThat(deletedPasskey.getIsDeleted()).isEqualTo(true);
        assertThat(deletedPasskey.getIsActive()).isEqualTo(false);
    }
}

