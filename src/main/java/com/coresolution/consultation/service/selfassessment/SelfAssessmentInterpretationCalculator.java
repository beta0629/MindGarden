package com.coresolution.consultation.service.selfassessment;

import java.util.List;
import com.coresolution.consultation.constant.SelfAssessmentType;
import com.coresolution.consultation.dto.selfassessment.SelfAssessmentInterpretationJson;

/**
 * Expo {@code assessmentQuestions.ts} 해석·채점과 동일 규칙(참고용 문구).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
public final class SelfAssessmentInterpretationCalculator {

    private SelfAssessmentInterpretationCalculator() {
    }

    /**
     * 총점 계산 (PSS 역채점 문항 반영).
     *
     * @param type    검사 유형
     * @param answers 응답 값 목록
     * @return 합계 점수
     */
    public static int calculateTotalScore(SelfAssessmentType type, List<Integer> answers) {
        int sum = 0;
        for (int i = 0; i < answers.size(); i++) {
            int v = answers.get(i);
            if (type == SelfAssessmentType.PSS && isPssReverseIndex(i)) {
                sum += 4 - v;
            } else {
                sum += v;
            }
        }
        return sum;
    }

    private static boolean isPssReverseIndex(int zeroBasedIndex) {
        return zeroBasedIndex == 3 || zeroBasedIndex == 4 || zeroBasedIndex == 6 || zeroBasedIndex == 7;
    }

    /**
     * @param type  검사 유형
     * @param score 총점
     * @return 해석 JSON
     */
    public static SelfAssessmentInterpretationJson interpret(SelfAssessmentType type, int score) {
        return switch (type) {
            case PHQ9 -> interpretPhq9(score);
            case GAD7 -> interpretGad7(score);
            case PSS -> interpretPss(score);
        };
    }

    private static SelfAssessmentInterpretationJson interpretPhq9(int score) {
        if (score <= 4) {
            return new SelfAssessmentInterpretationJson(
                "참고·낮은 편",
                "minimal",
                "응답만 보면 최근 2주간 불편이 크게 느껴지지 않는 편입니다(참고용). 지속 불편이 있으면 전문 상담을 고려하세요.");
        }
        if (score <= 9) {
            return new SelfAssessmentInterpretationJson(
                "경미한 불편 (참고)",
                "mild",
                "응답상 불편이 어느 정도 느껴질 수 있습니다. 자기 돌봄을 이어가고, 지속되면 전문 상담을 고려하세요.");
        }
        if (score <= 14) {
            return new SelfAssessmentInterpretationJson(
                "중간 정도 불편 (참고)",
                "moderate",
                "응답상 불편이 중간 정도로 보입니다(참고용). 전문 상담을 받아보는 것을 권합니다.");
        }
        if (score <= 19) {
            return new SelfAssessmentInterpretationJson(
                "높은 불편 (참고)",
                "severe",
                "응답상 불편이 높게 나타날 수 있습니다(참고용). 가까운 전문 상담·의료기관의 도움을 권합니다.");
        }
        return new SelfAssessmentInterpretationJson(
            "매우 높은 불편 (참고)",
            "severe",
            "응답이 매우 높은 불편을 시사할 수 있습니다(참고용). 전문 상담·의료기관 도움을 받는 것을 권합니다.");
    }

    private static SelfAssessmentInterpretationJson interpretGad7(int score) {
        if (score <= 4) {
            return new SelfAssessmentInterpretationJson(
                "참고·낮은 편",
                "minimal",
                "응답만 보면 최근 2주간 불안에 대한 불편이 크게 느껴지지 않는 편입니다(참고용).");
        }
        if (score <= 9) {
            return new SelfAssessmentInterpretationJson(
                "경미한 불편 (참고)",
                "mild",
                "응답상 어느 정도 불안이 느껴질 수 있습니다. 이완·호흡을 시도하고, 지속되면 전문 상담을 고려하세요.");
        }
        if (score <= 14) {
            return new SelfAssessmentInterpretationJson(
                "중간 정도 불편 (참고)",
                "moderate",
                "응답상 불안이 중간 정도로 느껴질 수 있습니다(참고용). 전문 상담을 권합니다.");
        }
        return new SelfAssessmentInterpretationJson(
            "높은 불편 (참고)",
            "severe",
            "응답상 불안이 높게 느껴질 수 있습니다(참고용). 전문 상담·의료기관 도움을 권합니다.");
    }

    private static SelfAssessmentInterpretationJson interpretPss(int score) {
        if (score <= 13) {
            return new SelfAssessmentInterpretationJson(
                "낮은 스트레스 (참고)",
                "minimal",
                "응답만 보면 스트레스가 크게 느껴지지 않는 편입니다(참고용). 현재 리듬을 유지하세요.");
        }
        if (score <= 26) {
            return new SelfAssessmentInterpretationJson(
                "보통 스트레스",
                "moderate",
                "응답상 스트레스가 보통 수준으로 느껴질 수 있습니다(참고용). 스트레스 관리와 전문 상담을 고려하세요.");
        }
        return new SelfAssessmentInterpretationJson(
            "높은 스트레스",
            "severe",
            "응답상 스트레스가 높게 느껴질 수 있습니다(참고용). 전문 상담·의료기관 도움을 권합니다.");
    }
}
