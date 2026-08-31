package com.coresolution.consultation.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.LocalDateTime;
import java.util.List;

import com.coresolution.consultation.constant.ExpenseCommonCodeSsotConstants;
import com.coresolution.consultation.util.CommonCodeDisplayNameSurvivorSelector.Candidate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link CommonCodeDisplayNameSurvivorSelector} — 시드 우선·동점 타이브레이크.
 *
 * @author MindGarden
 * @since 2026-08-31
 */
@DisplayName("공통코드 표시명 중복 생존자 선정")
class CommonCodeDisplayNameSurvivorSelectorTest {

    @Test
    @DisplayName("MEAL vs EAT(식대): 시드 SSOT MEAL 우선")
    void selectSurvivor_seedMealBeatsEat() {
        Candidate meal = new Candidate(20L, "MEAL", LocalDateTime.of(2026, 8, 20, 0, 0), 0L, 0L);
        Candidate eat = new Candidate(10L, "EAT", LocalDateTime.of(2026, 1, 1, 0, 0), 99L, 99L);

        Candidate survivor = CommonCodeDisplayNameSurvivorSelector.selectSurvivor(
                ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY,
                List.of(eat, meal));

        assertEquals("MEAL", survivor.codeValue());
        assertEquals(20L, survivor.id());
    }

    @Test
    @DisplayName("커스텀 동점: FT 건수 많은 쪽")
    void selectSurvivor_higherFtCountWinsWhenNoSeed() {
        Candidate typoA = new Candidate(1L, "typoA", LocalDateTime.of(2026, 1, 1, 0, 0), 2L, 0L);
        Candidate canonA = new Candidate(2L, "canonA", LocalDateTime.of(2026, 1, 2, 0, 0), 5L, 0L);

        Candidate survivor = CommonCodeDisplayNameSurvivorSelector.selectSurvivor(
                ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY,
                List.of(typoA, canonA));

        assertEquals("canonA", survivor.codeValue());
    }

    @Test
    @DisplayName("FT·recurring 동점: 더 이른 created_at, 그다음 더 작은 id")
    void selectSurvivor_earlierCreatedAtThenSmallerId() {
        LocalDateTime earlier = LocalDateTime.of(2026, 3, 1, 0, 0);
        LocalDateTime later = LocalDateTime.of(2026, 4, 1, 0, 0);
        Candidate a = new Candidate(30L, "typoA", later, 1L, 1L);
        Candidate b = new Candidate(40L, "canonA", earlier, 1L, 1L);

        Candidate survivor = CommonCodeDisplayNameSurvivorSelector.selectSurvivor(
                ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY,
                List.of(a, b));

        assertEquals("canonA", survivor.codeValue());

        Candidate c = new Candidate(5L, "typoA", earlier, 0L, 0L);
        Candidate d = new Candidate(9L, "canonA", earlier, 0L, 0L);
        Candidate byId = CommonCodeDisplayNameSurvivorSelector.selectSurvivor(
                ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY,
                List.of(d, c));
        assertEquals(5L, byId.id());
    }

    @Test
    @DisplayName("빈 후보 → null")
    void selectSurvivor_empty_returnsNull() {
        assertNull(CommonCodeDisplayNameSurvivorSelector.selectSurvivor(
                ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY, List.of()));
    }
}
