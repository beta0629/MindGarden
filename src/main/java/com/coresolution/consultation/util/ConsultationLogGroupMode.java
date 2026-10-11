package com.coresolution.consultation.util;

/**
 * 상담일지 조회 묶음 표시 모드.
 * 내담자·상담사 필터가 모두 없으면 날짜 내림차순 목록이다.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */
public enum ConsultationLogGroupMode {

    /** 내담자·상담사 모두 선택하지 않음. */
    NONE,
    /** 내담자만 선택. 회기 순, 상담사 변경 구간. */
    CLIENT,
    /** 상담사만 선택. 내담자별 묶음. */
    COUNSELOR,
    /** 둘 다 선택. 회기 순. 내담자·상담사 열은 화면에서 생략한다. */
    BOTH;

    /**
     * @param consultantId 상담사 필터. 없으면 null
     * @param clientId 내담자 필터. 없으면 null
     * @return 묶음 모드
     */
    public static ConsultationLogGroupMode from(Long consultantId, Long clientId) {
        boolean consultant = consultantId != null;
        boolean client = clientId != null;
        if (client && consultant) {
            return BOTH;
        }
        if (client) {
            return CLIENT;
        }
        if (consultant) {
            return COUNSELOR;
        }
        return NONE;
    }
}
