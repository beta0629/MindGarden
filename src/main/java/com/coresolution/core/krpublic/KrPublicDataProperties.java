package com.coresolution.core.krpublic;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

/**
 * 공공데이터포털 국세청 사업자 조회·도로명주소 검색 설정.
 * 키는 환경 변수만 사용하고 기본 비밀값은 두지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Data
@ConfigurationProperties(prefix = "mindgarden.kr-public-data")
public class KrPublicDataProperties {

    private Nts nts = new Nts();
    private Juso juso = new Juso();
    private String zoneId = "Asia/Seoul";
    private int minOpeningYear = 1900;

    /**
     * 국세청 사업자등록정보 진위확인·상태조회.
     */
    @Data
    public static class Nts {
        private String apiKey = "";
        private String statusUrl = "";
        private String validateUrl = "";
        private int connectTimeoutMs = 1500;
        private int readTimeoutMs = 2500;
        private int maxAttempts = 2;
    }

    /**
     * 행정안전부 도로명주소 검색.
     */
    @Data
    public static class Juso {
        private String confmKey = "";
        private String apiUrl = "";
        private String resultType = "json";
        private int connectTimeoutMs = 1500;
        private int readTimeoutMs = 2500;
        private int maxAttempts = 2;
        private int maxResults = 10;
        private int keywordMinLength = 2;
        private int keywordMaxLength = 80;
        private int currentPage = 1;
    }
}
