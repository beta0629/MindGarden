package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
import java.util.Map;

import com.coresolution.consultation.constant.UserGrade;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * {@link ClientGradePromotionUtil} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-04-04
 */
@DisplayName("ClientGradePromotionUtil")
class ClientGradePromotionUtilTest {

    private static Map<String, Integer> defaultLadder() {
        Map<String, Integer> m = new LinkedHashMap<>();
        m.put(UserGrade.CLIENT_BRONZE, 0);
        m.put(UserGrade.CLIENT_SILVER, 10);
        m.put(UserGrade.CLIENT_GOLD, 30);
        m.put(UserGrade.CLIENT_PLATINUM, 50);
        return m;
    }

    @Nested
    @DisplayName("parseMinSessionsFromExtraData")
    class ParseMinSessions {

        @Test
        @DisplayName("유효한 min_sessions")
        void ok() {
            assertThat(ClientGradePromotionUtil.parseMinSessionsFromExtraData("{\"min_sessions\":15}"))
                .isEqualTo(15);
        }

        @Test
        @DisplayName("키 없음·JSON 아님 → null")
        void missing() {
            assertThat(ClientGradePromotionUtil.parseMinSessionsFromExtraData("{}")).isNull();
            assertThat(ClientGradePromotionUtil.parseMinSessionsFromExtraData(null)).isNull();
            assertThat(ClientGradePromotionUtil.parseMinSessionsFromExtraData("not-json")).isNull();
        }

        @Test
        @DisplayName("음수 → null")
        void negative() {
            assertThat(ClientGradePromotionUtil.parseMinSessionsFromExtraData("{\"min_sessions\":-1}"))
                .isNull();
        }
    }

    @Nested
    @DisplayName("resolveUpgradeGrade")
    class ResolveUpgrade {

        @Test
        @DisplayName("브론즈·세션 10 이상 → 실버")
        void toSilver() {
            String g = ClientGradePromotionUtil.resolveUpgradeGrade(
                UserGrade.CLIENT_BRONZE,
                10L,
                defaultLadder());
            assertThat(g).isEqualTo(UserGrade.CLIENT_SILVER);
        }

        @Test
        @DisplayName("이미 플래티넘 → 승급 없음")
        void alreadyTop() {
            assertThat(ClientGradePromotionUtil.resolveUpgradeGrade(
                UserGrade.CLIENT_PLATINUM,
                100L,
                defaultLadder())).isNull();
        }

        @Test
        @DisplayName("등급 null → 가능한 최고 등급(세션 기준)")
        void nullGrade() {
            String g = ClientGradePromotionUtil.resolveUpgradeGrade(null, 50L, defaultLadder());
            assertThat(g).isEqualTo(UserGrade.CLIENT_PLATINUM);
        }

        @Test
        @DisplayName("임계 미달 → null")
        void belowThreshold() {
            assertThat(ClientGradePromotionUtil.resolveUpgradeGrade(
                UserGrade.CLIENT_BRONZE,
                5L,
                defaultLadder())).isNull();
        }
    }
}
