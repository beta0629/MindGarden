package com.coresolution.consultation.constant;

import java.util.List;

/**
 * 공개 /services 에 항상 싣는 센터 안내. system_config 가 비어도 보여 준다.
 * 자격 목록은 비운다.
 *
 * @author CoreSolution
 * @since 2026-10-02
 */
public final class PublicCounselingServiceGuideCopy {

    public static final String CENTER_NAME = "마인드가든 심리상담센터";

    public static final String CENTER_ADDRESS =
            "인천 연수구 해돋이로120번길 23 아크리아2 2층 204호";

    public static final String CENTER_PHONE = "032-724-8501";

    public static final String CENTER_HOURS = "화~금 11:00–19:00, 일요일 휴무";

    public static final String COUNSELOR_INTRO =
            "15년 이상 임상 경험을 갖춘 센터장이 직접 상담합니다.";

    public static final String COMMON_NOTICE =
            "100% 사전 예약제, 철저한 비밀 보장, "
                    + "의료적 진단이나 처방을 대신하지 않습니다";

    public static final String PROCESS_LINE =
            "예약 신청 → 센터 확인 전화로 예약 확정 → "
                    + "초기 면담(필요하면 검사) → 회기 진행 → 종결";

    public static final List<String> COUNSELING_TYPES = List.of(
            "아동·청소년·성인 1:1 개인상담 (50분, 센터 방문): "
                    + "불안, 우울, 공황, 강박, 번아웃, 대인관계 갈등",
            "ADHD 상담 (성인·여성·아동청소년): 검사와 맞춤상담",
            "부부·커플 / 부모-자녀 상담 (60분): 애착과 상호이해 중심",
            "아동발달 솔루션 (50분 = 솔루션 40분 + 부모 피드백 10분): "
                    + "놀이치료, 모래놀이치료, 언어치료, ABA(응용행동분석)",
            "사회성 솔루션 (50분): 아스퍼거, ASD, 사회적 의사소통",
            "심리검사: CAT, TCI, MMPI-2, SCT, 종합심리검사, 부모양육태도검사, "
                    + "그림검사(HTP·KFD). 센터 방문 검사, 결과 해석상담 포함");

    public static final List<String> PROCESS_STEPS = List.of(
            "예약 신청",
            "센터 확인 전화로 예약 확정",
            "초기 면담(필요하면 검사)",
            "회기 진행",
            "종결");

    public static final String LABEL_PRODUCT_NAME = "상품명";

    public static final String LABEL_SESSIONS = "회기";

    public static final String LABEL_PRICE = "가격";

    public static final String LABEL_PERIOD = "이용기간";

    private PublicCounselingServiceGuideCopy() {
    }
}
