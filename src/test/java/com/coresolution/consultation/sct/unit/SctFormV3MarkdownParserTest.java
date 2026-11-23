package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.sct.constant.SctFormType;
import com.coresolution.consultation.sct.util.SctFormV3MarkdownParser;
import org.junit.jupiter.api.Test;

/**
 * mindgarden_sct_v3.md 문항 원문 파서 — 성인·청소년·아동 각 50, 원문 일치.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
class SctFormV3MarkdownParserTest {

    @Test
    void parsesExactlyFiftyPromptsPerForm_matchingSeedExpectations() throws Exception {
        Path md = Path.of("docs/project-management/sct-online/mindgarden_sct_v3.md");
        assertTrue(Files.exists(md), "SSOT markdown missing: " + md.toAbsolutePath());

        Map<SctFormType, List<String>> prompts = SctFormV3MarkdownParser.parsePromptsFromFile(md);

        assertEquals(3, prompts.size());
        assertEquals(50, prompts.get(SctFormType.ADULT).size());
        assertEquals(50, prompts.get(SctFormType.ADOLESCENT).size());
        assertEquals(50, prompts.get(SctFormType.CHILD).size());

        assertEquals("내 이름 앞에 어울리는 수식어를 하나 붙인다면",
                prompts.get(SctFormType.ADULT).get(0));
        assertTrue(prompts.get(SctFormType.ADULT).get(8).contains("□ 해당 없음"));
        assertEquals("요즘 빠져 있는 게임·영상·노래는",
                prompts.get(SctFormType.ADOLESCENT).get(0));
        assertEquals("제일 좋아하는 놀이는",
                prompts.get(SctFormType.CHILD).get(0));

        long adultNa = prompts.get(SctFormType.ADULT).stream()
                .filter(p -> p.contains("□ 해당 없음")).count();
        long teenNa = prompts.get(SctFormType.ADOLESCENT).stream()
                .filter(p -> p.contains("□ 해당 없음")).count();
        long childNa = prompts.get(SctFormType.CHILD).stream()
                .filter(p -> p.contains("□ 해당 없음")).count();
        assertEquals(8, adultNa);
        assertEquals(4, teenNa);
        assertEquals(1, childNa);
        assertEquals(13, adultNa + teenNa + childNa);

        Path seed = Path.of("src/main/resources/db/migration/V20261123_002__seed_sct_form_v3_items.sql");
        assertTrue(Files.exists(seed));
        String seedSql = Files.readString(seed);
        for (SctFormType type : SctFormType.values()) {
            for (String prompt : prompts.get(type)) {
                String escaped = prompt.replace("'", "''");
                assertTrue(seedSql.contains(escaped),
                        () -> "시드에 원문 없음 [" + type + "]: " + prompt);
            }
        }
    }
}
