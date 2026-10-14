package com.coresolution.consultation.constant.admin;

/**
 * 관리자 매칭 생성(createMapping) 짧은 시간창 내 동일 상품 중복 생성 가드 상수.
 *
 * <p>같은 tenant + 상담사 + 내담자 + 동일 packageName(trim 정규화) 매칭이 본 시간창(초) 안에
 * 이미 존재하면 신규 생성을 거부한다. 서로 다른 packageName 은 짧은 시간 안에도 허용된다.</p>
 *
 * @author MindGarden
 * @since 2026-10-14
 */
public final class AdminMappingCreateDuplicateWindowConstants {

    /** 동일 상담사·내담자·패키지명 매칭 중복 생성 가드 시간창(초). */
    public static final int MAPPING_CREATE_DUPLICATE_WINDOW_SECONDS = 30;

    private AdminMappingCreateDuplicateWindowConstants() {
    }
}
