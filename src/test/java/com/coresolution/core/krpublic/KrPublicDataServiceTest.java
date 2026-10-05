package com.coresolution.core.krpublic;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import java.util.Properties;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import jakarta.persistence.EntityManagerFactory;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.coresolution.core.constant.KrPublicDataMessages;
import com.coresolution.core.dto.MerchantLegalUpdateRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;

/**
 * 국세청·도로명주소 공통 서비스. 외부 HTTP 는 mock 이고 실키를 쓰지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@ExtendWith(MockitoExtension.class)
class KrPublicDataServiceTest {

    private static final String BIZ = "120-81-47521";
    private static final String BIZ_BAD = "120-81-47522";
    private static final String OPENING = "2020-01-15";
    private static final String REP = "홍길동";
    private static final Clock CLOCK = Clock.fixed(
            Instant.parse("2026-10-04T15:00:00Z"), ZoneId.of("Asia/Seoul"));

    @Mock
    private KrPublicDataClient krPublicDataClient;

    @Mock
    private EntityManagerFactory entityManagerFactory;

    @Mock
    private HikariDataSource hikariDataSource;

    @Mock
    private HikariPoolMXBean hikariPoolMXBean;

    private KrPublicDataProperties properties;
    private KrPublicDataService service;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() throws Exception {
        properties = new KrPublicDataProperties();
        Properties urls = new Properties();
        try (InputStream in = getClass().getClassLoader().getResourceAsStream("kr-public-data-test.properties")) {
            urls.load(new InputStreamReader(in, StandardCharsets.UTF_8));
        }
        properties.getNts().setApiKey("test-key");
        properties.getNts().setStatusUrl(urls.getProperty("nts.status-url"));
        properties.getNts().setValidateUrl(urls.getProperty("nts.validate-url"));
        properties.getJuso().setConfmKey("test-confm");
        properties.getJuso().setApiUrl(urls.getProperty("juso.api-url"));
        properties.getJuso().setMaxResults(2);
        properties.setMinOpeningYear(1900);
        service = new KrPublicDataService(krPublicDataClient, properties, objectMapper, CLOCK, new MockEnvironment());
        lenient().when(hikariDataSource.getHikariPoolMXBean()).thenReturn(hikariPoolMXBean);
        lenient().when(hikariPoolMXBean.getActiveConnections()).thenAnswer(invocation -> 0);
    }

    @Test
    @DisplayName("반례: 사업자번호 없으면 400 이고 외부 호출을 하지 않는다")
    void missingBusinessNumberDoesNotCallRemote() {
        BusinessLookupRequest request = BusinessLookupRequest.builder()
                .openingDate(OPENING)
                .representativeName(REP)
                .build();

        IllegalArgumentException ex = org.junit.jupiter.api.Assertions.assertThrows(
                IllegalArgumentException.class, () -> service.lookup(request));

        assertEquals(KrPublicDataMessages.bizRequired(), ex.getMessage());
        verify(krPublicDataClient, never()).fetchStatus(anyString());
    }

    @Test
    @DisplayName("반례: KST 기준 내일 개업일자는 거절한다")
    void futureOpeningDateInKstIsRejected() {
        BusinessLookupRequest request = BusinessLookupRequest.builder()
                .businessRegistrationNumber(BIZ)
                .openingDate("2026-10-06")
                .representativeName(REP)
                .build();

        IllegalArgumentException ex = org.junit.jupiter.api.Assertions.assertThrows(
                IllegalArgumentException.class, () -> service.lookup(request));

        assertEquals(KrPublicDataMessages.openingInvalid(), ex.getMessage());
        verify(krPublicDataClient, never()).fetchStatus(anyString());
    }

    @Test
    @DisplayName("반례: 체크섬이 틀린 번호는 거절한다")
    void invalidChecksumIsRejected() {
        BusinessLookupRequest request = BusinessLookupRequest.builder()
                .businessRegistrationNumber(BIZ_BAD)
                .openingDate(OPENING)
                .representativeName(REP)
                .build();

        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> service.lookup(request));
        verify(krPublicDataClient, never()).fetchStatus(anyString());
    }

    @Test
    @DisplayName("키가 없으면 미확인이고 외부 호출을 하지 않는다")
    void missingKeyReturnsUnconfirmed() {
        properties.getNts().setApiKey("");
        when(krPublicDataClient.isBusinessLookupConfigured()).thenReturn(false);

        BusinessVerificationResult result = service.lookup(validRequest());

        assertEquals(KrPublicDataMessages.overallUnconfirmed(), result.getOverallStatus());
        assertNull(result.getAuthenticityMatch());
        verify(krPublicDataClient, never()).fetchStatus(anyString());
    }

    @Test
    @DisplayName("외부 호출이 비면 저장을 막지 않고 미확인이다")
    void remoteFailureReturnsUnconfirmed() {
        when(krPublicDataClient.isBusinessLookupConfigured()).thenReturn(true);
        when(krPublicDataClient.fetchStatus(anyString())).thenAnswer(invocation -> {
            assertOutsideTransaction();
            return Optional.empty();
        });

        BusinessVerificationResult result = service.lookup(validRequest());

        assertEquals(KrPublicDataMessages.overallUnconfirmed(), result.getOverallStatus());
        assertTrue(result.getCheckedAt() != null && !result.getCheckedAt().isBlank());
    }

    @Test
    @DisplayName("상태 미등록이면 진위와 무관하게 미등록이다")
    void unregisteredStatus() {
        when(krPublicDataClient.isBusinessLookupConfigured()).thenReturn(true);
        when(krPublicDataClient.fetchStatus(anyString())).thenAnswer(invocation -> {
            assertOutsideTransaction();
            return Optional.of("{\"status_code\":\"OK\",\"data\":[{\"b_no\":\"1208147521\",\"b_stt_cd\":\"\"}]}");
        });

        BusinessVerificationResult result = service.lookup(validRequest());

        assertEquals(KrPublicDataMessages.overallUnregistered(), result.getOverallStatus());
        assertEquals(KrPublicDataMessages.businessUnregistered(), result.getBusinessStatus());
        verify(krPublicDataClient, never()).fetchValidate(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("진위 불일치여도 예외 없이 불일치를 남긴다")
    void mismatchDoesNotThrow() {
        when(krPublicDataClient.isBusinessLookupConfigured()).thenReturn(true);
        when(krPublicDataClient.fetchStatus(anyString())).thenAnswer(invocation -> {
            assertOutsideTransaction();
            return Optional.of(statusBody("01", "일반과세자"));
        });
        when(krPublicDataClient.fetchValidate(anyString(), anyString(), anyString())).thenAnswer(invocation -> {
            assertOutsideTransaction();
            return Optional.of("{\"status_code\":\"OK\",\"data\":[{\"valid\":\"02\"}]}");
        });

        BusinessVerificationResult result = service.lookup(validRequest());

        assertEquals(Boolean.FALSE, result.getAuthenticityMatch());
        assertEquals(KrPublicDataMessages.businessContinue(), result.getBusinessStatus());
        assertEquals(KrPublicDataMessages.overallMismatch(), result.getOverallStatus());
        assertEquals("일반과세자", result.getTaxType());
    }

    @Test
    @DisplayName("온보딩 checklist 에 조회 결과를 넣고 번호가 없으면 400")
    void enrichRequiresNumberAndStoresResult() throws Exception {
        when(krPublicDataClient.isBusinessLookupConfigured()).thenReturn(true);
        when(krPublicDataClient.fetchStatus(anyString())).thenReturn(Optional.of(statusBody("02", "면세")));
        when(krPublicDataClient.fetchValidate(anyString(), anyString(), anyString()))
                .thenReturn(Optional.of("{\"status_code\":\"OK\",\"data\":[{\"valid\":\"01\"}]}"));

        String json = service.enrichOnboardingChecklist("{\"merchantLegal\":{"
                + "\"businessRegistrationNumber\":\"" + BIZ + "\","
                + "\"openingDate\":\"" + OPENING + "\","
                + "\"representativeName\":\"" + REP + "\"}}");

        JsonNode verification = objectMapper.readTree(json).path("merchantLegal").path("businessVerification");
        assertEquals(KrPublicDataMessages.overallMatch(), verification.path("overallStatus").asText());
        assertEquals(KrPublicDataMessages.businessSuspended(), verification.path("businessStatus").asText());
        assertTrue(verification.path("authenticityMatch").asBoolean());

        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class,
                () -> service.enrichOnboardingChecklist("{\"planId\":\"p\"}"));
    }

    @Test
    @DisplayName("테넌트 저장 준비는 클라이언트가 넣은 진위 결과를 버리고 다시 조회한다")
    void prepareMerchantSaveIgnoresClientResult() {
        when(krPublicDataClient.isBusinessLookupConfigured()).thenReturn(false);
        MerchantLegalUpdateRequest request = MerchantLegalUpdateRequest.builder()
                .businessRegistrationNumber(BIZ)
                .openingDate(OPENING)
                .representativeName(REP)
                .businessVerification(BusinessVerificationResult.builder()
                        .overallStatus(KrPublicDataMessages.overallMatch())
                        .authenticityMatch(true)
                        .build())
                .build();

        service.prepareMerchantLegalSave(request);

        assertEquals(KrPublicDataMessages.overallUnconfirmed(), request.getBusinessVerification().getOverallStatus());
        assertEquals("120-81-47521", request.getBusinessRegistrationNumber());
    }

    @Test
    @DisplayName("주소 키가 없으면 검색을 숨기고 수동 입력을 막지 않는다")
    void addressSearchHiddenWhenKeyMissing() {
        when(krPublicDataClient.isAddressSearchConfigured()).thenReturn(false);

        AddressSearchResult result = service.searchAddress("서울시청");

        assertFalse(result.isEnabled());
        assertTrue(result.getItems().isEmpty());
        verify(krPublicDataClient, never()).fetchAddresses(anyString());
    }

    @Test
    @DisplayName("반례: 너무 긴 주소 검색어와 결과 상한")
    void addressKeywordAndResultCap() {
        when(krPublicDataClient.isAddressSearchConfigured()).thenReturn(true);
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class,
                () -> service.searchAddress("한"));
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class,
                () -> service.searchAddress("서울<script>"));

        when(krPublicDataClient.fetchAddresses(anyString())).thenAnswer(invocation -> {
            assertOutsideTransaction();
            return Optional.of("{\"results\":{\"common\":{\"errorCode\":\"0\"},\"juso\":["
                    + "{\"roadAddr\":\"서울특별시 중구 세종대로 110\",\"zipNo\":\"04524\"},"
                    + "{\"roadAddr\":\"서울특별시 중구 세종대로 110 2\",\"zipNo\":\"04524\"},"
                    + "{\"roadAddr\":\"서울특별시 중구 세종대로 110 3\",\"zipNo\":\"04524\"}"
                    + "]}}");
        });

        AddressSearchResult result = service.searchAddress("세종대로 110");

        assertTrue(result.isEnabled());
        assertEquals(2, result.getItems().size());
        assertEquals("04524", result.getItems().get(0).getZipCode());
    }

    @Test
    @DisplayName("스텁 on: 키 없으면 진위 일치·계속사업자이고 외부 호출을 하지 않는다")
    void stubOnWithoutKeyReturnsContinuingMatch() {
        enableDevStub();

        BusinessVerificationResult result = service.lookup(validRequest());

        assertEquals(Boolean.TRUE, result.getAuthenticityMatch());
        assertEquals(KrPublicDataMessages.overallMatch(), result.getOverallStatus());
        assertEquals(KrPublicDataMessages.businessContinue(), result.getBusinessStatus());
        assertEquals(KrPublicDataStubSamples.taxType(), result.getTaxType());
        assertTrue(result.getCheckedAt() != null && !result.getCheckedAt().isBlank());
        verify(krPublicDataClient, never()).fetchStatus(anyString());
        verify(krPublicDataClient, never()).fetchValidate(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("스텁 on: capabilities 는 사업자·주소 모두 사용 가능")
    void stubOnEnablesCapabilitiesWithoutKeys() {
        enableDevStub();

        KrPublicDataCapabilities caps = service.capabilities();

        assertTrue(caps.isBusinessLookupEnabled());
        assertTrue(caps.isAddressSearchEnabled());
    }

    @Test
    @DisplayName("스텁 off: 개발 프로필이어도 키 없으면 미확인이고 capabilities 는 꺼진다")
    void stubOffKeepsLookupUnconfirmed() {
        properties.getStub().setEnabled(false);
        properties.getStub().setProfile("dev");
        rebuild("dev");

        BusinessVerificationResult result = service.lookup(validRequest());
        KrPublicDataCapabilities caps = service.capabilities();

        assertEquals(KrPublicDataMessages.overallUnconfirmed(), result.getOverallStatus());
        assertFalse(caps.isBusinessLookupEnabled());
        assertFalse(caps.isAddressSearchEnabled());
        verify(krPublicDataClient, never()).fetchStatus(anyString());
    }

    @Test
    @DisplayName("반례: production 프로필은 스텁 플래그가 켜져도 미확인")
    void productionProfileIgnoresStub() {
        properties.getStub().setEnabled(true);
        properties.getStub().setProfile("production");
        rebuild("production");

        BusinessVerificationResult result = service.lookup(validRequest());

        assertEquals(KrPublicDataMessages.overallUnconfirmed(), result.getOverallStatus());
        verify(krPublicDataClient, never()).fetchStatus(anyString());
    }

    @Test
    @DisplayName("반례: prod 프로필은 스텁 플래그가 켜져도 미확인")
    void prodProfileIgnoresStub() {
        properties.getStub().setEnabled(true);
        properties.getStub().setProfile("prod");
        rebuild("prod");

        assertEquals(KrPublicDataMessages.overallUnconfirmed(), service.lookup(validRequest()).getOverallStatus());
        verify(krPublicDataClient, never()).fetchStatus(anyString());
    }

    @Test
    @DisplayName("반례: dev 가 아닌 프로필과 빈 프로필·Environment 없음은 스텁하지 않는다")
    void stubRequiresDevProfile() {
        properties.getStub().setEnabled(true);
        properties.getStub().setProfile("dev");
        rebuild("local");
        assertEquals(KrPublicDataMessages.overallUnconfirmed(), service.lookup(validRequest()).getOverallStatus());

        properties.getStub().setProfile("");
        rebuild("dev");
        assertEquals(KrPublicDataMessages.overallUnconfirmed(), service.lookup(validRequest()).getOverallStatus());

        service = new KrPublicDataService(krPublicDataClient, properties, objectMapper, CLOCK, null);
        properties.getStub().setProfile("dev");
        assertEquals(KrPublicDataMessages.overallUnconfirmed(), service.lookup(validRequest()).getOverallStatus());
        verify(krPublicDataClient, never()).fetchStatus(anyString());
    }

    @Test
    @DisplayName("반례: 스텁이 켜져도 키가 있으면 실제 클라이언트 결과만 쓴다")
    void stubOnWithKeyUsesRemoteClient() {
        enableDevStub();
        when(krPublicDataClient.isBusinessLookupConfigured()).thenReturn(true);
        when(krPublicDataClient.fetchStatus(anyString())).thenAnswer(invocation -> {
            assertOutsideTransaction();
            return Optional.of(statusBody("", "tax"));
        });

        BusinessVerificationResult result = service.lookup(validRequest());

        assertEquals(KrPublicDataMessages.overallUnregistered(), result.getOverallStatus());
        verify(krPublicDataClient, never()).fetchValidate(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("반례: 스텁이 켜져도 KST 내일은 거절하고 오늘은 성공")
    void stubRespectsKstDateBoundary() {
        enableDevStub();
        String today = LocalDate.now(CLOCK).toString();
        String tomorrow = LocalDate.now(CLOCK).plusDays(1).toString();

        IllegalArgumentException ex = org.junit.jupiter.api.Assertions.assertThrows(
                IllegalArgumentException.class, () -> service.lookup(requestOn(tomorrow)));
        assertEquals(KrPublicDataMessages.openingInvalid(), ex.getMessage());

        BusinessVerificationResult result = service.lookup(requestOn(today));
        assertEquals(KrPublicDataMessages.overallMatch(), result.getOverallStatus());
        verify(krPublicDataClient, never()).fetchStatus(anyString());
    }

    @Test
    @DisplayName("반례: 스텁이 켜져도 체크섬 오류는 거절")
    void stubRejectsInvalidChecksum() {
        enableDevStub();

        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class,
                () -> service.lookup(BusinessLookupRequest.builder()
                        .businessRegistrationNumber(BIZ_BAD)
                        .openingDate(OPENING)
                        .representativeName(REP)
                        .build()));
        verify(krPublicDataClient, never()).fetchStatus(anyString());
    }

    @Test
    @DisplayName("스텁 on: 주소 키 없으면 샘플을 반환하고 외부 호출을 하지 않는다")
    void stubAddressReturnsSamples() {
        enableDevStub();

        AddressSearchResult result = service.searchAddress("sejong");

        assertTrue(result.isEnabled());
        assertEquals(KrPublicDataStubSamples.addresses(), result.getItems());
        assertFalse(result.getItems().isEmpty());
        verify(krPublicDataClient, never()).fetchAddresses(anyString());
    }

    @Test
    @DisplayName("반례: 스텁 주소도 검색어 길이와 결과 상한을 지킨다")
    void stubAddressKeepsKeywordAndCapRules() {
        enableDevStub();
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class,
                () -> service.searchAddress("한"));

        properties.getJuso().setMaxResults(1);
        AddressSearchResult capped = service.searchAddress("sejong");
        assertEquals(1, capped.getItems().size());
        assertEquals(KrPublicDataStubSamples.addresses().get(0).getRoadAddress(),
                capped.getItems().get(0).getRoadAddress());
    }

    @Test
    @DisplayName("반례: 스텁이 켜져도 주소 키가 있으면 실제 검색 결과만 쓴다")
    void stubOnWithAddressKeyUsesRemoteClient() {
        enableDevStub();
        when(krPublicDataClient.isAddressSearchConfigured()).thenReturn(true);
        when(krPublicDataClient.fetchAddresses(anyString())).thenAnswer(invocation -> {
            assertOutsideTransaction();
            return Optional.of("{\"results\":{\"common\":{\"errorCode\":\"0\"},\"juso\":"
                    + "{\"roadAddr\":\"remote-road\",\"zipNo\":\"10\"}}}");
        });

        AddressSearchResult result = service.searchAddress("sejong");

        assertTrue(result.isEnabled());
        assertEquals(1, result.getItems().size());
        assertEquals("remote-road", result.getItems().get(0).getRoadAddress());
    }

    @Test
    @DisplayName("반례: 스텁 조회를 동시에 두 번 해도 외부 호출은 없다")
    void concurrentStubLookupsDoNotCallRemote() throws Exception {
        enableDevStub();
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            Future<BusinessVerificationResult> first = pool.submit(() -> {
                start.await();
                return service.lookup(validRequest());
            });
            Future<BusinessVerificationResult> second = pool.submit(() -> {
                start.await();
                return service.lookup(validRequest());
            });
            start.countDown();
            assertEquals(KrPublicDataMessages.overallMatch(), first.get().getOverallStatus());
            assertEquals(KrPublicDataMessages.businessContinue(), second.get().getBusinessStatus());
            verify(krPublicDataClient, never()).fetchStatus(anyString());
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    @DisplayName("스텁 on: 온보딩 checklist 에도 같은 성공 결과를 넣는다")
    void enrichUsesStubWhenEnabled() throws Exception {
        enableDevStub();

        String json = service.enrichOnboardingChecklist("{\"merchantLegal\":{"
                + "\"businessRegistrationNumber\":\"" + BIZ + "\","
                + "\"openingDate\":\"" + OPENING + "\","
                + "\"representativeName\":\"" + REP + "\"}}");

        JsonNode verification = objectMapper.readTree(json).path("merchantLegal").path("businessVerification");
        assertEquals(KrPublicDataMessages.overallMatch(), verification.path("overallStatus").asText());
        assertEquals(KrPublicDataMessages.businessContinue(), verification.path("businessStatus").asText());
        assertTrue(verification.path("authenticityMatch").asBoolean());
    }

    private void assertOutsideTransaction() {
        assertFalse(TransactionSynchronizationManager.isActualTransactionActive());
        assertFalse(TransactionSynchronizationManager.isSynchronizationActive());
        assertNull(TransactionSynchronizationManager.getResource(entityManagerFactory));
        assertEquals(0, hikariDataSource.getHikariPoolMXBean().getActiveConnections());
    }

    private static BusinessLookupRequest validRequest() {
        return requestOn(OPENING);
    }

    private static BusinessLookupRequest requestOn(String openingDate) {
        return BusinessLookupRequest.builder()
                .businessRegistrationNumber(BIZ)
                .openingDate(openingDate)
                .representativeName(REP)
                .build();
    }

    private void enableDevStub() {
        properties.getStub().setEnabled(true);
        properties.getStub().setProfile("dev");
        rebuild("dev");
    }

    private void rebuild(String... activeProfiles) {
        MockEnvironment env = new MockEnvironment();
        if (activeProfiles.length > 0) {
            env.setActiveProfiles(activeProfiles);
        }
        service = new KrPublicDataService(krPublicDataClient, properties, objectMapper, CLOCK, env);
    }

    private static String statusBody(String code, String taxType) {
        return "{\"status_code\":\"OK\",\"data\":[{\"b_stt_cd\":\"" + code + "\",\"tax_type\":\"" + taxType + "\"}]}";
    }
}
