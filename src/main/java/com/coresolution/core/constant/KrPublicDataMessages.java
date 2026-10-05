package com.coresolution.core.constant;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.Properties;

/**
 * 국세청·도로명주소 사용자 문구. 본문은 {@code content/kr-public-data-messages.properties}.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public final class KrPublicDataMessages {

    private static final String RESOURCE = "content/kr-public-data-messages.properties";
    private static final Properties PROPS = load();

    private KrPublicDataMessages() {
    }

    /**
     * @return 사업자등록번호 누락 문구
     */
    public static String bizRequired() {
        return text("biz.required");
    }

    /**
     * @return 개업일자 누락 문구
     */
    public static String openingRequired() {
        return text("opening.required");
    }

    /**
     * @return 개업일자 형식 오류 문구
     */
    public static String openingInvalid() {
        return text("opening.invalid");
    }

    /**
     * @return 대표자명 누락 문구
     */
    public static String representativeRequired() {
        return text("representative.required");
    }

    /**
     * @return 대표자명 형식 오류 문구
     */
    public static String representativeInvalid() {
        return text("representative.invalid");
    }

    /**
     * @return 주소 검색어 오류 문구
     */
    public static String addressKeywordInvalid() {
        return text("address.keyword.invalid");
    }

    /**
     * @return 진위 결과를 확인하지 못함
     */
    public static String overallUnconfirmed() {
        return text("overall.unconfirmed");
    }

    /**
     * @return 진위 일치
     */
    public static String overallMatch() {
        return text("overall.match");
    }

    /**
     * @return 진위 불일치
     */
    public static String overallMismatch() {
        return text("overall.mismatch");
    }

    /**
     * @return 국세청 미등록
     */
    public static String overallUnregistered() {
        return text("overall.unregistered");
    }

    /**
     * @return 계속사업자
     */
    public static String businessContinue() {
        return text("business.continue");
    }

    /**
     * @return 휴업
     */
    public static String businessSuspended() {
        return text("business.suspended");
    }

    /**
     * @return 폐업
     */
    public static String businessClosed() {
        return text("business.closed");
    }

    /**
     * @return 상태조회 기준 미등록
     */
    public static String businessUnregistered() {
        return text("business.unregistered");
    }

    private static String text(String key) {
        String value = PROPS.getProperty(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("kr public data message missing");
        }
        return value.trim();
    }

    private static Properties load() {
        Properties properties = new Properties();
        try (InputStream in = KrPublicDataMessages.class.getClassLoader().getResourceAsStream(RESOURCE)) {
            if (in == null) {
                throw new IllegalStateException("kr public data message resource missing");
            }
            try (Reader reader = new InputStreamReader(in, StandardCharsets.UTF_8)) {
                properties.load(reader);
            }
        } catch (IOException ex) {
            throw new IllegalStateException("kr public data message resource unreadable");
        }
        return properties;
    }
}
