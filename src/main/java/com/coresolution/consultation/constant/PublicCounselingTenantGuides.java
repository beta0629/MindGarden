package com.coresolution.consultation.constant;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * 호스트 리졸버가 돌려주는 서브도메인 라벨로 고르는 공개 안내.
 * 없는 키는 비어 있고, 다른 테넌트 안내로 대체하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-02
 */
public final class PublicCounselingTenantGuides {

    /** {@code TenantContextFilter} 가 Host 에서 뽑는 서브도메인 라벨. */
    public static final String MINDGARDEN_TENANT_KEY = "mindgarden";

    private static final Map<String, PublicCounselingTenantGuide> BY_TENANT_KEY =
            Map.of(MINDGARDEN_TENANT_KEY, mindgarden());

    private PublicCounselingTenantGuides() {
    }

    /**
     * @param tenantKey 서브도메인 라벨. 없으면 빈 값
     * @return 그 키의 안내. 없으면 empty
     */
    public static Optional<PublicCounselingTenantGuide> find(String tenantKey) {
        if (tenantKey == null || tenantKey.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(BY_TENANT_KEY.get(tenantKey.trim().toLowerCase(Locale.ROOT)));
    }

    /**
     * @param tenantKey 서브도메인 라벨
     * @return 안내가 있으면 true
     */
    public static boolean hasGuide(String tenantKey) {
        return find(tenantKey).isPresent();
    }

    private static PublicCounselingTenantGuide mindgarden() {
        return new PublicCounselingTenantGuide(
                "마인드가든 심리상담센터",
                "인천 연수구 해돋이로120번길 23 아크리아2 2층 204호",
                "032-724-8501",
                "주중 10:00–20:00, 토요일 10:00–17:00, 일요일 정기휴무",
                "김선희 대표원장",
                "전공: 청소년교육 학사, 상담학 석사, 가족상담 박사과정 일부 수료",
                "전문자격:",
                List.of(
                        "한국상담학회 전문상담사 (부부가족분과, 재난상담분과)",
                        "보건복지부 사회복지사",
                        "여성가족부 청소년지도사",
                        "놀이치료사, 미술치료사, 교류분석사"),
                "주요 경력:",
                List.of(
                        "인천 건강가정·다문화가족지원센터 부부가족상담",
                        "인천 소방공무원 PTSD·트라우마 상담",
                        "초등학교 외부 전문상담사",
                        "아동보호전문기관 부모교육·가족상담",
                        "트리니티 심리상담연구소 소장"),
                "15년 이상 임상 경험을 갖춘 대표원장이 직접 상담합니다.",
                "100% 사전 예약제, 철저한 비밀 보장, "
                        + "의료적 진단이나 처방을 대신하지 않습니다",
                "예약 신청 → 센터 확인 전화로 예약 확정 → "
                        + "초기 면담(필요하면 검사) → 회기 진행 → 종결",
                List.of(
                        "아동·청소년·성인 1:1 개인상담 (50분, 센터 방문): "
                                + "불안, 우울, 공황, 강박, 번아웃, 대인관계 갈등",
                        "ADHD 상담 (성인·여성·아동청소년): 검사와 맞춤상담",
                        "부부·커플 / 부모-자녀 상담 (60분): 애착과 상호이해 중심",
                        "아동발달 솔루션 (50분 = 솔루션 40분 + 부모 피드백 10분): "
                                + "놀이치료, 모래놀이치료, 언어치료, ABA(응용행동분석)",
                        "사회성 솔루션 (50분): 아스퍼거, ASD, 사회적 의사소통",
                        "심리검사: CAT, TCI, MMPI-2, SCT, 종합심리검사, 부모양육태도검사, "
                                + "그림검사(HTP·KFD). 센터 방문 검사, 결과 해석상담 포함"),
                List.of(
                        "예약 신청",
                        "센터 확인 전화로 예약 확정",
                        "초기 면담(필요하면 검사)",
                        "회기 진행",
                        "종결"));
    }
}
