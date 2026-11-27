package com.coresolution.consultation.security.pii;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.impl.UserServiceImpl;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.consultation.util.PersonalDataEncryptionKeyProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * GCM 저장 이메일도 HMAC 블라인드 인덱스로 조회된다.
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("User email blind-index lookup")
class UserEmailBlindIndexLookupTest {

    private static final String TENANT = "tenant-blind-index-ut";

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private PiiCryptoService crypto;
    private PiiHmacService hmac;

    @BeforeEach
    void setUp() {
        PersonalDataEncryptionKeyProvider provider =
            new PersonalDataEncryptionKeyProvider(new MockEnvironment());
        ReflectionTestUtils.setField(provider, "activeKeyId", "k1");
        ReflectionTestUtils.setField(provider, "keyVersions",
            "k1:unit-test-encryption-key-32-bytes!!");
        ReflectionTestUtils.setField(provider, "ivVersions", "k1:unit-test-iv-16!");
        ReflectionTestUtils.setField(provider, "legacyKey", "");
        ReflectionTestUtils.setField(provider, "legacyIv", "");
        provider.initialize();
        crypto = new PiiCryptoService(provider);
        hmac = PiiTestSecrets.hmacService();
        ReflectionTestUtils.setField(userService, "encryptionUtil", crypto);
        ReflectionTestUtils.setField(userService, "piiHmacService", hmac);
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("findByEmail — emailHash 후보로 조회 (GCM ciphertext 동등검색 아님)")
    void findByEmail_usesEmailHash() {
        String plain = "dup@example.com";
        User stored = User.builder()
            .email(crypto.encryptGcm(plain))
            .emailHash(hmac.hmacHex(plain))
            .build();
        stored.setId(42L);
        stored.setTenantId(TENANT);

        when(userRepository.findAllByTenantIdAndEmailHashIn(eq(TENANT), any()))
            .thenReturn(List.of(stored));

        Optional<User> found = userService.findByEmail("  DUP@Example.COM ");
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(42L);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<java.util.Collection<String>> hashesCap =
            ArgumentCaptor.forClass(java.util.Collection.class);
        verify(userRepository).findAllByTenantIdAndEmailHashIn(eq(TENANT), hashesCap.capture());
        assertThat(hashesCap.getValue()).contains(hmac.hmacHex(plain));
    }

    @Test
    @DisplayName("register duplicate — 동일 email_hash 존재 감지")
    void duplicateDetectedViaHash() {
        String plain = "taken@example.com";
        when(userRepository.existsByTenantIdAndEmailHash(TENANT, hmac.hmacHex(plain)))
            .thenReturn(true);
        assertThat(userRepository.existsByTenantIdAndEmailHash(
            TENANT, hmac.hmacHex(plain))).isTrue();
        // ciphertext 동등검색은 랜덤 GCM 때문에 항상 false
        when(userRepository.existsByTenantIdAndEmail(eq(TENANT), anyString()))
            .thenReturn(false);
        assertThat(userRepository.existsByTenantIdAndEmail(
            TENANT, crypto.encryptGcm(plain))).isFalse();
    }

    @Test
    @DisplayName("해시 미백필 시 복호화 폴백")
    void missingHash_fallsBackToDecryptScan() {
        String plain = "legacy@example.com";
        User stored = User.builder()
            .email(crypto.encryptGcm(plain))
            .emailHash(null)
            .build();
        stored.setId(7L);
        stored.setTenantId(TENANT);

        when(userRepository.findAllByTenantIdAndEmailHashIn(eq(TENANT), any()))
            .thenReturn(Collections.emptyList());
        when(userRepository.findByTenantId(TENANT)).thenReturn(List.of(stored));

        Optional<User> found = userService.findByEmail(plain);
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(7L);
    }
}
