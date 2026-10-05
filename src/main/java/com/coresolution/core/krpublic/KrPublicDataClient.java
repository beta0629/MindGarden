package com.coresolution.core.krpublic;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import lombok.extern.slf4j.Slf4j;

/**
 * 국세청·도로명주소 HTTP 전용 클라이언트.
 * 타임아웃·재시도만 담당하고, 사업자번호·대표자명·키 값은 로그에 남기지 않는다.
 *
 * <p>TODO: 과학기술정보통신부 '모두의 AI' 공식 오픈(12월) 이후 공공 AI 검색과
 * 추가로 개방된 API 연동을 검토한다. 지금은 구현하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Slf4j
@Component
public class KrPublicDataClient {

    private final KrPublicDataProperties properties;
    private final RestTemplate ntsRestTemplate;
    private final RestTemplate jusoRestTemplate;

    /**
     * @param properties 공공데이터 설정
     */
    @Autowired
    public KrPublicDataClient(KrPublicDataProperties properties) {
        this(properties,
                buildTemplate(properties.getNts().getConnectTimeoutMs(), properties.getNts().getReadTimeoutMs()),
                buildTemplate(properties.getJuso().getConnectTimeoutMs(), properties.getJuso().getReadTimeoutMs()));
    }

    /**
     * 테스트에서 HTTP 를 대체할 때 사용한다.
     *
     * @param properties      설정
     * @param ntsRestTemplate 국세청용
     * @param jusoRestTemplate 주소용
     */
    KrPublicDataClient(KrPublicDataProperties properties, RestTemplate ntsRestTemplate, RestTemplate jusoRestTemplate) {
        this.properties = properties;
        this.ntsRestTemplate = ntsRestTemplate;
        this.jusoRestTemplate = jusoRestTemplate;
    }

    /**
     * @return 상태·진위 호출에 필요한 키와 URL 이 있는지
     */
    public boolean isBusinessLookupConfigured() {
        KrPublicDataProperties.Nts nts = properties.getNts();
        return hasText(nts.getApiKey()) && hasText(nts.getStatusUrl()) && hasText(nts.getValidateUrl());
    }

    /**
     * @return 주소 검색 키가 있는지
     */
    public boolean isAddressSearchConfigured() {
        KrPublicDataProperties.Juso juso = properties.getJuso();
        return hasText(juso.getConfmKey()) && hasText(juso.getApiUrl());
    }

    /**
     * 사업자 상태조회. 실패 시 빈 값.
     *
     * @param digits 숫자 10자리
     * @return 응답 본문
     */
    public Optional<String> fetchStatus(String digits) {
        Map<String, Object> body = Map.of("b_no", List.of(digits));
        return postJson(ntsRestTemplate, properties.getNts().getStatusUrl(), properties.getNts().getApiKey(),
                body, attempts(properties.getNts().getMaxAttempts()));
    }

    /**
     * 사업자 진위확인. 실패 시 빈 값.
     *
     * @param digits           숫자 10자리
     * @param openingCompact   개업일자 YYYYMMDD
     * @param representativeName 대표자명
     * @return 응답 본문
     */
    public Optional<String> fetchValidate(String digits, String openingCompact, String representativeName) {
        Map<String, Object> business = new LinkedHashMap<>();
        business.put("b_no", digits);
        business.put("start_dt", openingCompact);
        business.put("p_nm", representativeName);
        business.put("p_nm2", "");
        business.put("b_nm", "");
        business.put("corp_no", "");
        business.put("b_sector", "");
        business.put("b_type", "");
        business.put("b_adr", "");
        Map<String, Object> body = Map.of("businesses", List.of(business));
        return postJson(ntsRestTemplate, properties.getNts().getValidateUrl(), properties.getNts().getApiKey(),
                body, attempts(properties.getNts().getMaxAttempts()));
    }

    /**
     * 도로명주소 검색. 실패 시 빈 값.
     *
     * @param keyword 검증된 검색어
     * @return 응답 본문
     */
    public Optional<String> fetchAddresses(String keyword) {
        KrPublicDataProperties.Juso juso = properties.getJuso();
        String url = UriComponentsBuilder.fromUriString(juso.getApiUrl())
                .queryParam("confmKey", juso.getConfmKey())
                .queryParam("currentPage", juso.getCurrentPage())
                .queryParam("countPerPage", juso.getMaxResults())
                .queryParam("keyword", keyword)
                .queryParam("resultType", juso.getResultType())
                .build()
                .encode()
                .toUriString();
        return exchange(jusoRestTemplate, url, HttpMethod.GET, null, attempts(juso.getMaxAttempts()));
    }

    private Optional<String> postJson(RestTemplate template, String url, String apiKey, Object body, int attempts) {
        if (!hasText(url) || !hasText(apiKey)) {
            return Optional.empty();
        }
        String target = UriComponentsBuilder.fromUriString(url)
                .queryParam("serviceKey", apiKey)
                .build()
                .encode()
                .toUriString();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return exchange(template, target, HttpMethod.POST, new HttpEntity<>(body, headers), attempts);
    }

    private Optional<String> exchange(RestTemplate template, String url, HttpMethod method, HttpEntity<?> entity,
            int attempts) {
        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                ResponseEntity<String> response = template.exchange(url, method, entity, String.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    return Optional.of(response.getBody());
                }
                if (!response.getStatusCode().is5xxServerError() || attempt >= attempts) {
                    return Optional.empty();
                }
            } catch (HttpStatusCodeException ex) {
                if (!ex.getStatusCode().is5xxServerError() || attempt >= attempts) {
                    log.warn("kr public data http status failure: method={} type={}", method.name(),
                            ex.getClass().getSimpleName());
                    return Optional.empty();
                }
            } catch (ResourceAccessException ex) {
                if (attempt >= attempts) {
                    log.warn("kr public data timeout: method={} type={}", method.name(),
                            ex.getClass().getSimpleName());
                    return Optional.empty();
                }
            } catch (RestClientException ex) {
                log.warn("kr public data call failed: method={} type={}", method.name(),
                        ex.getClass().getSimpleName());
                return Optional.empty();
            }
        }
        return Optional.empty();
    }

    private static RestTemplate buildTemplate(int connectTimeoutMs, int readTimeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(Math.max(connectTimeoutMs, 1)));
        factory.setReadTimeout(Duration.ofMillis(Math.max(readTimeoutMs, 1)));
        return new RestTemplate(factory);
    }

    private static int attempts(int configured) {
        return Math.max(configured, 1);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
