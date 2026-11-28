package com.coresolution.consultation.sct.exception;

/**
 * 단축 링크 교환 코드(공개 링크 세션)가 유휴·착지 시간 초과로 만료됨 — HTTP 410.
 *
 * <p>초대 자체 만료·취소({@link SctGoneException})와 구분해, 문자의 링크를 다시 열면
 * 서버 임시저장 답이 이어진다는 안내에 쓴다.</p>
 *
 * @author MindGarden
 * @since 2026-11-28
 */
public class SctLinkSessionExpiredException extends SctGoneException {

    /** 공개 API 오류 코드. */
    public static final String ERROR_CODE = "SCT_LINK_SESSION_EXPIRED";

    /**
     * @param message 메시지
     */
    public SctLinkSessionExpiredException(String message) {
        super(message);
    }
}
