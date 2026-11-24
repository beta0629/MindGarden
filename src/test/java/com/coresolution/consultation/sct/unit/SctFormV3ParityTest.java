package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

/**
 * 시드 SQL 문항이 build_sct_v3 기대 JSON(3×50)과 문구·순서·해당없음 플래그가 일치하는지 검증.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
class SctFormV3ParityTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Pattern ITEM_ROW = Pattern.compile(
            "SELECT\\s+(\\d+)\\s+AS\\s+item_no,\\s+'((?:[^']|'')*)'\\s+AS\\s+prompt_text,"
                    + "[^,]*,[^,]*,[^,]*,[^,]*,\\s*(\\d)\\s+AS\\s+allows_not_applicable,"
                    + "\\s*(\\d+)\\s+AS\\s+sort_order",
            Pattern.CASE_INSENSITIVE);

    @Test
    void seedMatchesExpectedFixture_threeFormsFiftyItems() throws Exception {
        JsonNode expectedRoot;
        try (InputStream in = getClass().getResourceAsStream("/sct/sct_v3_expected_items.json")) {
            expectedRoot = MAPPER.readTree(in);
        }
        String sql = Files.readString(
                Path.of("src/main/resources/db/migration/V20261123_002__seed_sct_form_v3_items.sql"),
                StandardCharsets.UTF_8);

        for (String formType : List.of("ADULT", "ADOLESCENT", "CHILD")) {
            JsonNode expectedItems = expectedRoot.path(formType).path("items");
            assertEquals(50, expectedItems.size(), formType + " expected 50");

            String block = extractFormBlock(sql, formType);
            Matcher m = ITEM_ROW.matcher(block);
            int count = 0;
            Set<Integer> naNos = new HashSet<>();
            while (m.find()) {
                count++;
                int itemNo = Integer.parseInt(m.group(1));
                String prompt = m.group(2).replace("''", "'");
                String normalized = prompt.replace("  [□ 해당 없음]", "").trim();
                boolean allowsNa = "1".equals(m.group(3));
                int sort = Integer.parseInt(m.group(4));
                assertEquals(itemNo, sort, formType + " sort==itemNo");

                JsonNode exp = expectedItems.get(itemNo - 1);
                assertEquals(itemNo, exp.path("itemNo").asInt());
                assertEquals(exp.path("promptText").asText(), normalized,
                        formType + " item " + itemNo);
                assertEquals(exp.path("allowsNotApplicable").asBoolean(), allowsNa,
                        formType + " NA flag item " + itemNo);
                if (allowsNa) {
                    naNos.add(itemNo);
                }
            }
            assertEquals(50, count, formType + " seed rows");

            Set<Integer> expectedNa = new HashSet<>();
            for (JsonNode n : expectedItems) {
                if (n.path("allowsNotApplicable").asBoolean()) {
                    expectedNa.add(n.path("itemNo").asInt());
                }
            }
            assertEquals(expectedNa, naNos, formType + " NA item set");
            assertFalse(naNos.isEmpty() && "ADULT".equals(formType));
        }
    }

    @Test
    void headerFieldsPresentInConsentMigration() throws Exception {
        String sql = Files.readString(
                Path.of("src/main/resources/db/migration/V20261123_005__sct_consent_ssot_and_headers.sql"),
                StandardCharsets.UTF_8);
        assertTrue(sql.contains("header_fields_json"));
        assertTrue(sql.contains("마인드가든심리상담센터"));
        assertTrue(sql.contains("handoff-2026-11-23"));
        assertTrue(sql.contains("sct.guardian.verify.mode"));
        assertTrue(sql.contains("CHECK_NAME_RELATION"));
    }

    /**
     * 폼별 INSERT 블록만 분리(첫 INSERT부터 CHILD WHERE까지 탐식 방지).
     */
    private static String extractFormBlock(String sql, String formType) {
        String[] parts = sql.split("(?=INSERT INTO sct_form_items)");
        List<String> matches = new ArrayList<>();
        String needle = "t.form_type = '" + formType + "'";
        for (String part : parts) {
            if (part.contains("INSERT INTO sct_form_items") && part.contains(needle)) {
                matches.add(part);
            }
        }
        assertEquals(1, matches.size(), "exactly one insert for " + formType);
        return matches.get(0);
    }
}
