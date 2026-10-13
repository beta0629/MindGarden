package com.coresolution.consultation.constant;

/**
 * 관리자 내담자 검색(이름·연락처 뒷자리) 상수.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */
public final class AdminClientSearchConstants {

    private AdminClientSearchConstants() {
    }

    /** 연락처 뒷자리 검색·표시 자릿수 */
    public static final int PHONE_TAIL_LENGTH = 4;
    public static final int DEFAULT_PAGE_SIZE = 20;
    /** 한 번에 돌려줄 최대 건수 (관리자 콤보박스 초기 목록) */
    public static final int MAX_PAGE_SIZE = 1000;
    /** 마스킹이 꺼진 환경에서도 전체 번호를 내보내지 않기 위한 접두 */
    public static final String MASKED_PHONE_PREFIX = "***-****-";
    public static final String PERMISSION_CLIENT_MANAGE = "CLIENT_MANAGE";
    public static final String MSG_FORBIDDEN = "권한이 없습니다.";
}
