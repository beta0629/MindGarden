package com.coresolution.consultation.sct.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.config.SmsProperties;
import com.coresolution.consultation.sct.constant.SctFormType;
import com.coresolution.consultation.sct.util.SctFormV3MarkdownParser;
import com.coresolution.core.constant.PublicApiPathPolicy;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import com.coresolution.consultation.ConsultationManagementApplication;

/**
 * SCT A기준 통합 스모크 — 컨텍스트·플래그·공개경로·문항원문·SMS_TEST_MODE.
 *
 * <p>상세 상태전이·권한은 {@code sct.unit.*} 에서 검증한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
class SctCriteriaCoverageIntegrationTest {

    @Autowired
    private SmsProperties smsProperties;

    @Test
    void smsTestModeEnabledInTestProfile() {
        assertTrue(smsProperties.isTestMode(), "SMS_TEST_MODE / sms.auth.test-mode 가 test 프로파일에서 켜져 있어야 함");
    }

    @Test
    void publicSctPathRegistered() {
        assertTrue(PublicApiPathPolicy.isPublicApi("/api/v1/public/sct/x/meta"));
    }

    @Test
    void flywayAndMarkdownPromptsAligned() throws Exception {
        Map<SctFormType, List<String>> prompts = SctFormV3MarkdownParser.parsePromptsFromFile(
                Path.of("docs/project-management/sct-online/mindgarden_sct_v3.md"));
        String seed = Files.readString(
                Path.of("src/main/resources/db/migration/V20261123_002__seed_sct_form_v3_items.sql"));
        assertEquals(50, prompts.get(SctFormType.ADULT).size());
        assertEquals(50, prompts.get(SctFormType.ADOLESCENT).size());
        assertEquals(50, prompts.get(SctFormType.CHILD).size());
        assertTrue(seed.contains(prompts.get(SctFormType.ADULT).get(0).replace("'", "''")));
        assertTrue(Files.exists(
                Path.of("src/main/resources/db/migration/V20261123_001__create_sct_tables.sql")));
        assertTrue(Files.exists(
                Path.of("src/main/resources/db/migration/V20261123_003__seed_sct_feature_flag_and_codes.sql")));
        assertTrue(Files.exists(
                Path.of("src/main/resources/db/migration/V20261124_002__sct_feature_flag_tenant_default_off.sql")));
        assertFalse(seed.isBlank());
    }
}
