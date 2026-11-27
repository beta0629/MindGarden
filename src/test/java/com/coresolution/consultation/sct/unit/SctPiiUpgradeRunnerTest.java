package com.coresolution.consultation.sct.unit;

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
import com.coresolution.consultation.security.pii.PiiCipherFormats;
import com.coresolution.consultation.security.pii.PiiCryptoService;
import com.coresolution.consultation.security.pii.PiiHmacService;
import com.coresolution.consultation.security.pii.PiiTestSecrets;
import com.coresolution.consultation.sct.runner.SctPiiUpgradeRunner;
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
 * {@link SctPiiUpgradeRunner} — 키 없으면 no-op, 있으면 평문→GCM·해시 HMAC, 재실행 0건.
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SctPiiUpgradeRunner")
class SctPiiUpgradeRunnerTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private PlatformTransactionManager transactionManager;

    private PiiCryptoService crypto;
    private PiiHmacService hmac;
    private SctPiiUpgradeRunner runner;

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
        runner = new SctPiiUpgradeRunner(crypto, hmac, jdbcTemplate, transactionManager);
    }

    @Test
    @DisplayName("키/시크릿 없으면 UPDATE 0")
    void missingKeys_touchesNothing() {
        PiiHmacService noSecret = new PiiHmacService("");
        SctPiiUpgradeRunner noOp = new SctPiiUpgradeRunner(
            crypto, noSecret, jdbcTemplate, transactionManager);
        noOp.run(new DefaultApplicationArguments());
        verify(jdbcTemplate, never()).queryForList(anyString());
        verify(jdbcTemplate, never()).update(anyString(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("평문 fixture → GCM·HMAC, 재실행 변경 0")
    void plaintextFixture_upgradedThenIdempotent() {
        Map<String, Object> invitation = new HashMap<>();
        invitation.put("id", 1L);
        invitation.put("recipient_name", "홍길동");
        invitation.put("target_phone", "01012345678");
        invitation.put("target_email", "a@example.com");
        invitation.put("target_phone_hash", hmac.legacySha256Hex("01012345678"));
        invitation.put("target_email_hash", hmac.legacySha256Hex("a@example.com"));

        when(jdbcTemplate.queryForList(anyString()))
            .thenReturn(List.of(invitation))
            .thenReturn(Collections.emptyList())
            .thenReturn(Collections.emptyList())
            .thenReturn(Collections.emptyList());

        runner.run(new DefaultApplicationArguments());

        ArgumentCaptor<Object> recipientCap = ArgumentCaptor.forClass(Object.class);
        verify(jdbcTemplate, times(1)).update(
            anyString(),
            recipientCap.capture(),
            any(),
            any(),
            any(),
            any(),
            eq(1L));
        String newRecipient = (String) recipientCap.getAllValues().get(0);
        assertThat(PiiCipherFormats.looksV2(newRecipient)).isTrue();
        assertThat(crypto.decryptCompatible(newRecipient)).isEqualTo("홍길동");

        // 재실행: 이미 v2·HMAC 이면 skip
        Map<String, Object> upgraded = new HashMap<>(invitation);
        upgraded.put("recipient_name", newRecipient);
        upgraded.put("target_phone", crypto.encryptGcm("01012345678"));
        upgraded.put("target_email", crypto.encryptGcm("a@example.com"));
        upgraded.put("target_phone_hash", hmac.hmacHex("01012345678"));
        upgraded.put("target_email_hash", hmac.hmacHex("a@example.com"));

        when(jdbcTemplate.queryForList(anyString()))
            .thenReturn(List.of(upgraded))
            .thenReturn(Collections.emptyList())
            .thenReturn(Collections.emptyList())
            .thenReturn(Collections.emptyList());

        org.mockito.Mockito.clearInvocations(jdbcTemplate);
        when(jdbcTemplate.queryForList(anyString()))
            .thenReturn(List.of(upgraded))
            .thenReturn(Collections.emptyList())
            .thenReturn(Collections.emptyList())
            .thenReturn(Collections.emptyList());

        runner.run(new DefaultApplicationArguments());
        verify(jdbcTemplate, never()).update(
            anyString(), any(), any(), any(), any(), any(), any());
    }
}
