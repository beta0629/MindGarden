package com.coresolution.consultation.constant;

/**
 * 공개 「상담 서비스 안내」 콘텐츠를 담는 기존 {@code system_config} 키.
 * 컬럼·테이블을 추가하지 않는다. 값은 테넌트별 config_value.
 *
 * @author CoreSolution
 * @since 2026-10-01
 */
public final class PublicCounselingServiceGuideKeys {

    /** 정의 한 줄. 비면 플랫폼 공통 폴백. */
    public static final String ONE_LINER = "public.counseling.oneLiner";

    /**
     * 상담 종류 JSON 배열.
     * 항목: name, description, audience, modality, minutes.
     */
    public static final String TYPES = "public.counseling.types";

    /**
     * 공개 상담사 자격 JSON 배열. 비면 섹션을 숨긴다(기본 비공개).
     * 항목: name, lines(문자열 배열, 「자격명 · 발급 기관」).
     */
    public static final String QUALIFICATIONS = "public.counseling.qualifications";

    /** 센터 소개 문단. 비면 생략. 최대 600자. */
    public static final String CENTER_INTRO = "public.counseling.centerIntro";

    private PublicCounselingServiceGuideKeys() {
    }
}
