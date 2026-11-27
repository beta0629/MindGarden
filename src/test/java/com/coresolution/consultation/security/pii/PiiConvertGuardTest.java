package com.coresolution.consultation.security.pii;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.ConsultationRecordDraft;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.sct.entity.SctConsent;
import com.coresolution.consultation.sct.entity.SctDomainMemo;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.entity.SctResponseAnswer;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * PII 이름 패턴 String 필드는 {@link PiiAttributeConverter} 필수.
 * Phase-2 평문 필드·레거시 CBC 엔티티는 allowlist.
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@DisplayName("PiiConvertGuard")
class PiiConvertGuardTest {

    private static final Pattern PII_NAME = Pattern.compile(
        ".*(name|phone|email|address|guardian|recipient|nickname|memo|notes|"
            + "Enc|enc|contact|rrn|account|gender).*",
        Pattern.CASE_INSENSITIVE);

    /**
     * Phase-2 이전 평문·비대상 허용 목록 (엔티티.필드).
     * hash 컬럼·식별자·LocalDate 등은 아래 패턴에서 제외하거나 allowlist.
     *
     * <p>User/Client PII 필드는 레거시 CBC 컨버터(Email/Phone/PersonalName) 유지 —
     * 「5차 이관 대상」.</p>
     */
    private static final Set<String> ALLOWLIST = Set.of(
        // users / clients — 5차 이관 대상 (레거시 CBC AttributeConverter)
        "User.email",
        "User.name",
        "User.nickname",
        "User.phone",
        "User.gender",
        "User.address",
        "User.addressDetail",
        "User.rrnEncrypted",
        "User.memo",
        "User.notes",
        "Client.name",
        "Client.email",
        "Client.phone",
        "Client.emergencyContact",
        "Client.emergencyPhone",
        "Client.institutionContactName",
        "Client.institutionContactPhone",
        "Client.institutionDocumentPhone",
        "Client.institutionDocumentEmail",
        "Client.gender",
        "Client.address",
        "Client.addressDetail",
        "Client.institutionName",
        "Client.medicalHistory",
        "Client.allergies",
        "Client.medications",
        "Client.memo",
        "Client.notes",
        // hash / 식별자
        "SctInvitation.targetPhoneHash",
        "SctInvitation.targetEmailHash",
        "SctInvitation.tokenHash",
        "SctInvitation.managementNo",
        "SctConsent.ipHash",
        "SctConsent.userAgentHash",
        // 기타 비암호 메타
        "User.profileImageUrl",
        "User.emailVerificationToken",
        "Client.profileImageUrl"
    );

    private static final List<Class<?>> ENTITIES = List.of(
        User.class,
        Client.class,
        ConsultationRecord.class,
        ConsultationRecordDraft.class,
        SctInvitation.class,
        SctConsent.class,
        SctDomainMemo.class,
        SctResponseAnswer.class
    );

    @Test
    @DisplayName("PII 패턴 String 필드는 PiiAttributeConverter 또는 allowlist")
    void piiStringFields_requireConverterOrAllowlist() {
        List<String> violations = new ArrayList<>();
        for (Class<?> entity : ENTITIES) {
            assertThat(entity.getAnnotation(Entity.class))
                .as("%s must be @Entity", entity.getSimpleName())
                .isNotNull();
            for (Field field : entity.getDeclaredFields()) {
                if (Modifier.isStatic(field.getModifiers())) {
                    continue;
                }
                if (field.getType() != String.class) {
                    continue;
                }
                String key = entity.getSimpleName() + "." + field.getName();
                if (ALLOWLIST.contains(key)) {
                    continue;
                }
                String lower = field.getName().toLowerCase(Locale.ROOT);
                if (lower.endsWith("hash") || lower.equals("tenantid") || lower.equals("userid")
                    || lower.endsWith("id") || lower.contains("status") || lower.contains("code")
                    || lower.contains("type") || lower.contains("role") || lower.contains("url")
                    || lower.contains("token") && !lower.contains("enc")
                    || lower.contains("password") || lower.contains("preference")) {
                    continue;
                }
                if (!PII_NAME.matcher(field.getName()).matches()) {
                    continue;
                }
                Convert convert = field.getAnnotation(Convert.class);
                if (convert == null || convert.converter() != PiiAttributeConverter.class) {
                    violations.add(key);
                }
            }
        }
        assertThat(violations)
            .as("Missing @Convert(PiiAttributeConverter): %s", violations)
            .isEmpty();
    }
}
