package com.coresolution.consultation.sct.exception;

/**
 * 재발급·재발송으로 이전 링크가 닫힘 — HTTP 410. 기한 만료({@link SctGoneException})와 구분되는 오류 코드로
 * 내담자에게 「새 링크가 발송되었습니다」 안내를 한다.
 *
 * @author MindGarden
 * @since 2026-11-28
 */
public class SctLinkReissuedException extends SctGoneException {

    /** 공개 API 오류 코드. */
    public static final String ERROR_CODE = "SCT_LINK_REISSUED";

    /**
     * @param message 메시지
     */
    public SctLinkReissuedException(String message) {
        super(message);
    }
}
