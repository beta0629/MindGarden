package com.coresolution.core.krpublic;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.coresolution.core.constant.KrPublicDataMessages;
import com.coresolution.core.dto.MerchantLegalUpdateRequest;
import com.coresolution.core.util.BusinessRegistrationNumberValidator;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * 온보딩·테넌트 사업자정보·Ops 가 함께 쓰는 국세청·도로명주소 서비스.
 * 외부 호출은 트랜잭션 밖에서만 하고, 결과와 무관하게 저장을 막지 않는다.
 *
 * <p>TODO: 과학기술정보통신부 '모두의 AI' 공식 오픈(12월) 이후 공공 AI 검색과
 * 추가로 개방된 API 연동을 검토한다. 지금은 구현하지 않는다.
 * 메모: docs/project-management/KR_PUBLIC_DATA_APIS.md</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Slf4j
@Service
public class KrPublicDataService {

    private static final DateTimeFormatter COMPACT_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final Pattern COMPACT_DATE_PATTERN = Pattern.compile("^\\d{8}$");
    private static final Pattern ISO_DATE_PATTERN = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");
    private static final Pattern REPRESENTATIVE_CHARS =
            Pattern.compile("^[0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ\\s·.'()\\-]+$");
    private static final Pattern REPRESENTATIVE_LETTER = Pattern.compile("[A-Za-z가-힣]");
    private static final Pattern ADDRESS_FORBIDDEN = Pattern.compile("[\\p{Cntrl}<>\"'%;\\\\]");
    private static final String STATUS_CODE_OK = "OK";
    private static final String NTS_CONTINUE = "01";
    private static final String NTS_SUSPENDED = "02";
    private static final String NTS_CLOSED = "03";
    private static final String NTS_VALID = "01";
    private static final String NTS_INVALID = "02";
    private static final String JUSO_OK = "0";
    private static final int TAX_TYPE_MAX = 100;
    private static final int REPRESENTATIVE_MAX = 100;
    private static final String MERCHANT_LEGAL = "merchantLegal";

    private final KrPublicDataClient krPublicDataClient;
    private final KrPublicDataProperties properties;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    /**
     * @param krPublicDataClient HTTP 클라이언트
     * @param properties         설정
     * @param objectMapper       JSON
     */
    @Autowired
    public KrPublicDataService(KrPublicDataClient krPublicDataClient, KrPublicDataProperties properties,
            ObjectMapper objectMapper) {
        this(krPublicDataClient, properties, objectMapper, Clock.system(resolveZone(properties)));
    }

    /**
     * @param krPublicDataClient HTTP 클라이언트
     * @param properties         설정
     * @param objectMapper       JSON
     * @param clock              개업일자 상한(KST) 기준 시계
     */
    KrPublicDataService(KrPublicDataClient krPublicDataClient, KrPublicDataProperties properties,
            ObjectMapper objectMapper, Clock clock) {
        this.krPublicDataClient = krPublicDataClient;
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    /**
     * @return 키 설정 여부
     */
    public KrPublicDataCapabilities capabilities() {
        return KrPublicDataCapabilities.builder()
                .businessLookupEnabled(krPublicDataClient.isBusinessLookupConfigured())
                .addressSearchEnabled(krPublicDataClient.isAddressSearchConfigured())
                .build();
    }

    /**
     * 형식 오류는 400, 외부 실패는 미확인.
     *
     * @param request 사업자번호·개업일자·대표자명
     * @return 조회 결과
     */
    public BusinessVerificationResult lookup(BusinessLookupRequest request) {
        if (request == null) {
            throw new IllegalArgumentException(KrPublicDataMessages.bizRequired());
        }
        String formatted = requireBusinessNumber(request.getBusinessRegistrationNumber());
        String opening = requireOpeningDate(request.getOpeningDate());
        String representative = requireRepresentative(request.getRepresentativeName());
        return lookupRemote(formatted, opening, representative);
    }

    /**
     * 온보딩 제출 checklist 에 사업자번호를 필수로 하고 조회 결과를 merchantLegal 에 넣는다.
     * 외부 실패여도 JSON 은 반환한다.
     *
     * @param checklistJson 신청 JSON
     * @return 조회 결과가 병합된 JSON
     */
    public String enrichOnboardingChecklist(String checklistJson) {
        Map<String, Object> checklist = readObject(checklistJson);
        Map<String, Object> merchantLegal = merchantLegalMap(checklist.get(MERCHANT_LEGAL));
        String formatted = requireBusinessNumber(stringOrNull(merchantLegal.get("businessRegistrationNumber")));
        String opening = requireOpeningDate(stringOrNull(merchantLegal.get("openingDate")));
        String representative = requireRepresentative(stringOrNull(merchantLegal.get("representativeName")));
        BusinessVerificationResult result = lookupRemote(formatted, opening, representative);
        merchantLegal.put("businessRegistrationNumber", formatted);
        merchantLegal.put("openingDate", opening);
        merchantLegal.put("representativeName", representative);
        merchantLegal.put("businessVerification", objectMapper.convertValue(result, new TypeReference<Map<String, Object>>() {
        }));
        checklist.put(MERCHANT_LEGAL, merchantLegal);
        try {
            return objectMapper.writeValueAsString(checklist);
        } catch (Exception ex) {
            log.warn("onboarding checklist enrich write failed: type={}", ex.getClass().getSimpleName());
            throw new IllegalArgumentException(KrPublicDataMessages.bizRequired());
        }
    }

    /**
     * 테넌트 사업자정보 저장 전에 호출한다. 외부 실패는 결과에만 남긴다.
     * 클라이언트가 보낸 진위 결과는 무시한다.
     *
     * @param request 저장 요청
     */
    public void prepareMerchantLegalSave(MerchantLegalUpdateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException(KrPublicDataMessages.bizRequired());
        }
        request.setBusinessVerification(null);
        String bizRaw = blankToNull(request.getBusinessRegistrationNumber());
        String openingRaw = blankToNull(request.getOpeningDate());
        String representativeRaw = blankToNull(request.getRepresentativeName());
        if (openingRaw != null) {
            request.setOpeningDate(requireOpeningDate(openingRaw));
        }
        if (representativeRaw != null) {
            request.setRepresentativeName(requireRepresentative(representativeRaw));
        }
        if (bizRaw == null) {
            return;
        }
        String formatted = requireBusinessNumber(bizRaw);
        request.setBusinessRegistrationNumber(formatted);
        String opening = blankToNull(request.getOpeningDate());
        String representative = blankToNull(request.getRepresentativeName());
        if (opening == null || representative == null) {
            request.setBusinessVerification(unconfirmed());
            return;
        }
        request.setBusinessVerification(lookupRemote(formatted, opening, representative));
    }

    /**
     * @param keyword 검색어
     * @return 최대 건수가 잘린 결과. 키 없으면 enabled=false
     */
    public AddressSearchResult searchAddress(String keyword) {
        if (!krPublicDataClient.isAddressSearchConfigured()) {
            return AddressSearchResult.builder().enabled(false).items(List.of()).build();
        }
        String normalized = requireKeyword(keyword);
        Optional<String> body = krPublicDataClient.fetchAddresses(normalized);
        if (body.isEmpty()) {
            return AddressSearchResult.builder().enabled(true).items(List.of()).build();
        }
        return AddressSearchResult.builder().enabled(true).items(parseAddresses(body.get())).build();
    }

    private BusinessVerificationResult lookupRemote(String formatted, String openingIso, String representative) {
        if (!krPublicDataClient.isBusinessLookupConfigured()) {
            log.info("nts lookup skipped: key or url missing");
            return unconfirmed();
        }
        String digits = BusinessRegistrationNumberValidator.normalizeDigits(formatted);
        Optional<String> statusBody = krPublicDataClient.fetchStatus(digits);
        if (statusBody.isEmpty()) {
            log.info("nts status unavailable: overall={}", KrPublicDataMessages.overallUnconfirmed());
            return unconfirmed();
        }
        StatusView status = parseStatus(statusBody.get(), digits);
        if (status.unconfirmed()) {
            return unconfirmed();
        }
        if (status.unregistered()) {
            return BusinessVerificationResult.builder()
                    .authenticityMatch(null)
                    .businessStatus(KrPublicDataMessages.businessUnregistered())
                    .taxType(null)
                    .checkedAt(now())
                    .overallStatus(KrPublicDataMessages.overallUnregistered())
                    .build();
        }
        Optional<String> validateBody = krPublicDataClient.fetchValidate(digits, compact(openingIso), representative);
        if (validateBody.isEmpty()) {
            return BusinessVerificationResult.builder()
                    .authenticityMatch(null)
                    .businessStatus(status.businessStatus())
                    .taxType(status.taxType())
                    .checkedAt(now())
                    .overallStatus(KrPublicDataMessages.overallUnconfirmed())
                    .build();
        }
        Boolean match = parseMatch(validateBody.get());
        if (match == null) {
            return BusinessVerificationResult.builder()
                    .authenticityMatch(null)
                    .businessStatus(status.businessStatus())
                    .taxType(status.taxType())
                    .checkedAt(now())
                    .overallStatus(KrPublicDataMessages.overallUnconfirmed())
                    .build();
        }
        return BusinessVerificationResult.builder()
                .authenticityMatch(match)
                .businessStatus(status.businessStatus())
                .taxType(status.taxType())
                .checkedAt(now())
                .overallStatus(match ? KrPublicDataMessages.overallMatch() : KrPublicDataMessages.overallMismatch())
                .build();
    }

    private StatusView parseStatus(String body, String digits) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode code = root.get("status_code");
            if (code != null && !code.asText("").equalsIgnoreCase(STATUS_CODE_OK)) {
                return StatusView.unconfirmedView();
            }
            JsonNode data = root.get("data");
            if (data == null || !data.isArray() || data.isEmpty()) {
                return StatusView.unregisteredView();
            }
            JsonNode row = data.get(0);
            String statusCode = text(row, "b_stt_cd");
            if (statusCode.isEmpty()) {
                return StatusView.unregisteredView();
            }
            String businessStatus = mapBusinessStatus(statusCode);
            if (businessStatus == null) {
                return StatusView.unconfirmedView();
            }
            return new StatusView(false, false, businessStatus, sanitizeTaxType(text(row, "tax_type"), digits));
        } catch (Exception ex) {
            log.warn("nts status parse failed: type={}", ex.getClass().getSimpleName());
            return StatusView.unconfirmedView();
        }
    }

    private Boolean parseMatch(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode code = root.get("status_code");
            if (code != null && !code.asText("").equalsIgnoreCase(STATUS_CODE_OK)) {
                return null;
            }
            JsonNode data = root.get("data");
            if (data == null || !data.isArray() || data.isEmpty()) {
                return null;
            }
            String valid = text(data.get(0), "valid");
            if (NTS_VALID.equals(valid)) {
                return Boolean.TRUE;
            }
            if (NTS_INVALID.equals(valid)) {
                return Boolean.FALSE;
            }
            return null;
        } catch (Exception ex) {
            log.warn("nts validate parse failed: type={}", ex.getClass().getSimpleName());
            return null;
        }
    }

    private List<AddressSearchResult.AddressItem> parseAddresses(String body) {
        List<AddressSearchResult.AddressItem> items = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode results = root.get("results");
            if (results == null) {
                return items;
            }
            JsonNode common = results.get("common");
            if (common != null && !JUSO_OK.equals(text(common, "errorCode"))) {
                log.info("juso search non-success code");
                return items;
            }
            JsonNode juso = results.get("juso");
            if (juso == null || juso.isNull()) {
                return items;
            }
            if (juso.isArray()) {
                for (JsonNode row : juso) {
                    addAddress(items, row);
                }
            } else if (juso.isObject()) {
                addAddress(items, juso);
            }
        } catch (Exception ex) {
            log.warn("juso parse failed: type={}", ex.getClass().getSimpleName());
        }
        int max = Math.max(properties.getJuso().getMaxResults(), 1);
        if (items.size() > max) {
            return List.copyOf(items.subList(0, max));
        }
        return items;
    }

    private static void addAddress(List<AddressSearchResult.AddressItem> items, JsonNode row) {
        String road = text(row, "roadAddr");
        if (road.isEmpty()) {
            return;
        }
        items.add(AddressSearchResult.AddressItem.builder()
                .roadAddress(road)
                .zipCode(text(row, "zipNo"))
                .build());
    }

    private String requireBusinessNumber(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException(KrPublicDataMessages.bizRequired());
        }
        if (!BusinessRegistrationNumberValidator.isValidRequired(raw)) {
            throw new IllegalArgumentException(BusinessRegistrationNumberValidator.INVALID_MESSAGE);
        }
        return BusinessRegistrationNumberValidator.formatForDisplay(raw);
    }

    private String requireOpeningDate(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException(KrPublicDataMessages.openingRequired());
        }
        String trimmed = raw.trim();
        LocalDate date;
        try {
            if (COMPACT_DATE_PATTERN.matcher(trimmed).matches()) {
                date = LocalDate.parse(trimmed, COMPACT_DATE);
            } else if (ISO_DATE_PATTERN.matcher(trimmed).matches()) {
                date = LocalDate.parse(trimmed);
            } else {
                throw new IllegalArgumentException(KrPublicDataMessages.openingInvalid());
            }
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(KrPublicDataMessages.openingInvalid());
        }
        LocalDate today = LocalDate.now(clock);
        if (date.isAfter(today) || date.getYear() < properties.getMinOpeningYear()) {
            throw new IllegalArgumentException(KrPublicDataMessages.openingInvalid());
        }
        return date.toString();
    }

    private static String requireRepresentative(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException(KrPublicDataMessages.representativeRequired());
        }
        String trimmed = raw.trim();
        if (trimmed.length() > REPRESENTATIVE_MAX || !REPRESENTATIVE_CHARS.matcher(trimmed).matches()
                || !REPRESENTATIVE_LETTER.matcher(trimmed).find()) {
            throw new IllegalArgumentException(KrPublicDataMessages.representativeInvalid());
        }
        return trimmed;
    }

    private String requireKeyword(String keyword) {
        if (keyword == null) {
            throw new IllegalArgumentException(KrPublicDataMessages.addressKeywordInvalid());
        }
        String trimmed = keyword.trim();
        int min = properties.getJuso().getKeywordMinLength();
        int max = properties.getJuso().getKeywordMaxLength();
        if (trimmed.length() < min || trimmed.length() > max || ADDRESS_FORBIDDEN.matcher(trimmed).find()) {
            throw new IllegalArgumentException(KrPublicDataMessages.addressKeywordInvalid());
        }
        return trimmed;
    }

    private String mapBusinessStatus(String code) {
        if (NTS_CONTINUE.equals(code)) {
            return KrPublicDataMessages.businessContinue();
        }
        if (NTS_SUSPENDED.equals(code)) {
            return KrPublicDataMessages.businessSuspended();
        }
        if (NTS_CLOSED.equals(code)) {
            return KrPublicDataMessages.businessClosed();
        }
        return null;
    }

    private static String sanitizeTaxType(String taxType, String digits) {
        if (taxType == null || taxType.isBlank()) {
            return null;
        }
        String trimmed = taxType.trim();
        if (digits != null && !digits.isBlank() && trimmed.contains(digits)) {
            return null;
        }
        if (trimmed.length() > TAX_TYPE_MAX) {
            return trimmed.substring(0, TAX_TYPE_MAX);
        }
        return trimmed;
    }

    private BusinessVerificationResult unconfirmed() {
        return BusinessVerificationResult.builder()
                .authenticityMatch(null)
                .businessStatus(null)
                .taxType(null)
                .checkedAt(now())
                .overallStatus(KrPublicDataMessages.overallUnconfirmed())
                .build();
    }

    private String now() {
        return DateTimeFormatter.ISO_INSTANT.format(Instant.now(clock));
    }

    private static String compact(String isoDate) {
        return isoDate.replace("-", "");
    }

    private Map<String, Object> readObject(String json) {
        if (json == null || json.isBlank()) {
            return new LinkedHashMap<>();
        }
        try {
            JsonNode node = objectMapper.readTree(json);
            if (!node.isObject()) {
                return new LinkedHashMap<>();
            }
            return objectMapper.convertValue(node, new TypeReference<LinkedHashMap<String, Object>>() {
            });
        } catch (Exception ex) {
            log.warn("checklist read failed: type={}", ex.getClass().getSimpleName());
            return new LinkedHashMap<>();
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> merchantLegalMap(Object raw) {
        if (raw instanceof Map<?, ?> map) {
            return new LinkedHashMap<>((Map<String, Object>) map);
        }
        return new LinkedHashMap<>();
    }

    private static String stringOrNull(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String text(JsonNode node, String field) {
        if (node == null || node.get(field) == null || node.get(field).isNull()) {
            return "";
        }
        return node.get(field).asText("").trim();
    }

    private static ZoneId resolveZone(KrPublicDataProperties properties) {
        try {
            return ZoneId.of(properties.getZoneId());
        } catch (Exception ex) {
            return ZoneId.of("Asia/Seoul");
        }
    }

    private record StatusView(boolean unconfirmed, boolean unregistered, String businessStatus, String taxType) {
        private static StatusView unconfirmedView() {
            return new StatusView(true, false, null, null);
        }

        private static StatusView unregisteredView() {
            return new StatusView(false, true, null, null);
        }
    }
}
