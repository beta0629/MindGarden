package com.coresolution.consultation.security.pii;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.util.PersonalDataEncryptionKeyProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;

/**
 * {@link UserClientPiiBlindIndexRunner} — 시크릿 없으면 no-op, 있으면 해시 백필, 재실행 0건.
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("UserClientPiiBlindIndexRunner")
class UserClientPiiBlindIndexRunnerTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private PlatformTransactionManager transactionManager;

    private PiiCryptoService crypto;
    private PiiHmacService hmac;
    private UserClientPiiBlindIndexRunner runner;

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
        when(transactionManager.getTransaction(any())).thenReturn(new SimpleTransactionStatus());
        runner = new UserClientPiiBlindIndexRunner(
            crypto, hmac, jdbcTemplate, transactionManager);
    }

    @Test
    @DisplayName("키/시크릿 없으면 UPDATE 0")
    void missingKeys_touchesNothing() {
        UserClientPiiBlindIndexRunner noOp = new UserClientPiiBlindIndexRunner(
            crypto, new PiiHmacService(""), jdbcTemplate, transactionManager);
        noOp.run(new DefaultApplicationArguments());
        verify(jdbcTemplate, never()).queryForList(anyString());
        verify(jdbcTemplate, never()).update(anyString(), any(), any(), any());
    }

    @Test
    @DisplayName("GCM email + null hash → HMAC 백필, 재실행 변경 0")
    void gcmEmail_backfillsHash_thenIdempotent() {
        String plainEmail = "a@example.com";
        String plainPhone = "01012345678";
        String gcmEmail = crypto.encryptGcm(plainEmail);
        String gcmPhone = crypto.encryptGcm(plainPhone);

        Map<String, Object> userRow = new HashMap<>();
        userRow.put("id", 1L);
        userRow.put("email", gcmEmail);
        userRow.put("phone", gcmPhone);
        userRow.put("email_hash", null);
        userRow.put("phone_hash", null);

        when(jdbcTemplate.queryForList(anyString()))
            .thenReturn(List.of(userRow))
            .thenReturn(Collections.emptyList());

        runner.run(new DefaultApplicationArguments());

        ArgumentCaptor<Object> emailHashCap = ArgumentCaptor.forClass(Object.class);
        ArgumentCaptor<Object> phoneHashCap = ArgumentCaptor.forClass(Object.class);
        verify(jdbcTemplate, times(1)).update(
            anyString(),
            emailHashCap.capture(),
            phoneHashCap.capture(),
            eq(1L));
        assertThat(emailHashCap.getValue()).isEqualTo(hmac.hmacHex(plainEmail));
        assertThat(phoneHashCap.getValue()).isEqualTo(hmac.hmacHex(plainPhone));

        Map<String, Object> upgraded = new HashMap<>(userRow);
        upgraded.put("email_hash", hmac.hmacHex(plainEmail));
        upgraded.put("phone_hash", hmac.hmacHex(plainPhone));
        org.mockito.Mockito.clearInvocations(jdbcTemplate);
        when(jdbcTemplate.queryForList(anyString()))
            .thenReturn(List.of(upgraded))
            .thenReturn(Collections.emptyList());

        runner.run(new DefaultApplicationArguments());
        verify(jdbcTemplate, never()).update(anyString(), any(), any(), any());
    }
}
