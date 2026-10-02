package com.coresolution.consultation.constant;

/**
 * 공개 /services 의 테넌트 무관 라벨. 센터 안내 문장은 넣지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-02
 */
public final class PublicCounselingServiceGuideCopy {

    public static final String LABEL_PRODUCT_NAME = "상품명";

    public static final String LABEL_SESSIONS = "회기";

    public static final String LABEL_PRICE = "가격";

    public static final String LABEL_PERIOD = "이용기간";

    /** 콘텐츠가 없는 테넌트. 특정 센터 사실을 넣지 않는다. */
    public static final String EMPTY_GUIDE_LINE = "등록된 상담 안내가 없습니다.";

    private PublicCounselingServiceGuideCopy() {
    }
}
