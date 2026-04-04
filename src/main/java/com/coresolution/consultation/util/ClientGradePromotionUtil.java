package com.coresolution.consultation.util;

import java.util.Map;
import com.coresolution.consultation.constant.ClientGradeAutoPromotionConstants;
import com.coresolution.consultation.constant.UserGrade;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

/**
 * 내담자 등급 자동 승급 순수 로직 (세션 수·임계 맵 → 승급 목표 등급).
 * <p>
 * 등급 계단 순서는 {@link UserGrade#CLIENT_GRADES}만 사용한다. 강등 없음.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-04
 */
@Slf4j
public final class ClientGradePromotionUtil {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private ClientGradePromotionUtil() {
    }

    /**
     * common_codes.extra_data 에서 min_sessions 정수 추출. 실패·누락·음수면 null.
     *
     * @param extraData JSON 문자열
     * @return 최소 회기 또는 null
     */
    public static Integer parseMinSessionsFromExtraData(String extraData) {
        if (extraData == null || extraData.isBlank()) {
            return null;
        }
        try {
            JsonNode root = OBJECT_MAPPER.readTree(extraData);
            if (!root.has(ClientGradeAutoPromotionConstants.EXTRA_DATA_KEY_MIN_SESSIONS)) {
                return null;
            }
            JsonNode node = root.get(ClientGradeAutoPromotionConstants.EXTRA_DATA_KEY_MIN_SESSIONS);
            if (node == null || !node.isNumber()) {
                return null;
            }
            int v = node.intValue();
            if (v < 0) {
                return null;
            }
            return v;
        } catch (Exception e) {
            log.debug("min_sessions 파싱 실패, 스킵: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 현재 등급보다 높은 등급 중, 완료 세션 수가 임계를 만족하는 최고 등급을 반환.
     * 승급 없으면 null (DB 갱신 생략).
     *
     * @param currentGrade users.grade (null·공백은 최저 미부여로 간주)
     * @param completedSessions 자동 승급용 완료 세션 수(정의는 호출측 주석 참고)
     * @param minSessionsByGrade 등급 코드값 → 최소 완료 회기
     * @return 새 등급 또는 null
     */
    public static String resolveUpgradeGrade(String currentGrade, long completedSessions,
            Map<String, Integer> minSessionsByGrade) {
        int currentIdx = indexInClientLadder(currentGrade);
        for (int i = UserGrade.CLIENT_GRADES.length - 1; i >= 0; i--) {
            if (i <= currentIdx) {
                continue;
            }
            String gradeCode = UserGrade.CLIENT_GRADES[i];
            Integer min = minSessionsByGrade.get(gradeCode);
            if (min == null) {
                continue;
            }
            if (completedSessions >= min) {
                return gradeCode;
            }
        }
        return null;
    }

    private static int indexInClientLadder(String grade) {
        if (grade == null || grade.isBlank()) {
            return -1;
        }
        for (int i = 0; i < UserGrade.CLIENT_GRADES.length; i++) {
            if (UserGrade.CLIENT_GRADES[i].equals(grade)) {
                return i;
            }
        }
        return -1;
    }
}
