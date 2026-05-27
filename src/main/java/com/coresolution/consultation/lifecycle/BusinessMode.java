package com.coresolution.consultation.lifecycle;

/**
 * MindGarden 비즈니스 정체성(business identity) 모드.
 *
 * <p>운영 모드에 따라 {@code consultation_records} 보존 기간 등 라이프사이클 cutoff 가 분기된다.
 * 본 합의서 {@code docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md} v1.2 §0.1 Q10 결재 변수.
 *
 * <ul>
 *   <li>{@link #NON_MEDICAL} — 비의료 상담 플랫폼(default). 학회 윤리강령 + 동의서 명시로
 *       {@code consultation_records} cutoff = 3년.</li>
 *   <li>{@link #MEDICAL} — 의료기관 연계. 의료법 §22 적용으로
 *       {@code consultation_records} cutoff = 10년.</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
public enum BusinessMode {

    /** 비의료 상담 플랫폼(default). 학회 윤리강령 3년. */
    NON_MEDICAL,

    /** 의료기관 연계. 의료법 §22 — 진료기록 10년. */
    MEDICAL
}
