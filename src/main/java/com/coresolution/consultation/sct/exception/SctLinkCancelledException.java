package com.coresolution.consultation.sct.exception;

/**
 * 센터가 취소한 초대 링크 — HTTP 410. 기한 만료({@link SctGoneException})와 구분되는 오류 코드로
 * 내담자에게 「센터에서 취소한 링크」 안내를 한다.
 *
 * @author MindGarden
 * @since 2026-11-28
 */
public class SctLinkCancelledException extends SctGoneException {

    /** 공개 API 오류 코드. */
    public static final String ERROR_CODE = "SCT_LINK_CANCELLED";

    /**
     * @param message 메시지
     */
    public SctLinkCancelledException(String message) {
        super(message);
    }
}
