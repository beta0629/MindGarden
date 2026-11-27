package com.coresolution.consultation.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.dto.TestAlimtalkRequest;
import com.coresolution.consultation.dto.TestNotificationAlimtalkTemplate;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.dto.TestNotificationRecipientMode;
import com.coresolution.consultation.dto.TestNotificationResponse;
import com.coresolution.consultation.entity.AdminTestNotificationLog;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.AlimtalkTemplateFetchException;
import com.coresolution.consultation.integration.solapi.KakaoSolapiCredentialResolver;
import com.coresolution.consultation.integration.solapi.SolapiCredentials;
import com.coresolution.consultation.integration.solapi.SolapiKakaoTemplateClient;
import com.coresolution.consultation.repository.AdminTestNotificationLogRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.TenantKakaoAlimtalkSettingsRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.KakaoAlimTalkService;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link AdminTestNotificationServiceImpl} 알림톡 템플릿 조회 단위 테스트.
 *
 * <p>다음 두 가지 보강을 검증한다.
 * <ul>
 *   <li>enum 모드 — tenant 매칭 row 없고 코어({@code tenant_id IS NULL}) row만 있을 때 코어 폴백이
 *       반환된다(같은 {@code code_value} 중복은 테넌트 우선으로 dedup).</li>
 *   <li>live 모드 — 솔라피 응답이 실패면 {@link AlimtalkTemplateFetchException}을 던져 어드민이
 *       errorCode·errorMessage를 그대로 받을 수 있다.</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("어드민 테스트 발송 — 알림톡 템플릿 조회·발송")
class AdminTestNotificationServiceImplAlimtalkTemplateTest {

    private static final String TENANT_ID = "tenant-incheon-counseling-001";
    private static final String CODE_GROUP = "ALIMTALK_TEMPLATE";
    private static final String BIZ_CODE_GROUP = "ALIMTALK_BIZ_TEMPLATE_CODE";
    private static final Long SENDER_USER_ID = 999L;
    private static final String SENDER_LOGIN = "admin_tester";
    private static final String SELF_PHONE = "01012345678";

    @Mock
    private UserRepository userRepository;
    @Mock
    private CommonCodeRepository commonCodeRepository;
    @Mock
    private AdminTestNotificationLogRepository logRepository;
    @Mock
    private AdminTestNotificationLogger logger;
    @Mock
    private AdminTestNotificationRateLimiter rateLimiter;
    @Mock
    private SmsAuthService smsAuthService;
    @Mock
    private KakaoAlimTalkService kakaoAlimTalkService;
    @Mock
    private NotificationDispatchHelper dispatchHelper;
    @Mock
    private AlimtalkTemplateMappingResolver templateMappingResolver;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private KakaoSolapiCredentialResolver solapiCredentialResolver;
    @Mock
    private SolapiKakaoTemplateClient solapiKakaoTemplateClient;
    @Mock
    private TenantKakaoAlimtalkSettingsRepository tenantKakaoAlimtalkSettingsRepository;

    private AdminTestNotificationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminTestNotificationServiceImpl(
            userRepository,
            commonCodeRepository,
            logRepository,
            logger,
            rateLimiter,
            smsAuthService,
            kakaoAlimTalkService,
            dispatchHelper,
            templateMappingResolver,
            encryptionUtil,
            new ObjectMapper(),
            solapiCredentialResolver,
            solapiKakaoTemplateClient,
            tenantKakaoAlimtalkSettingsRepository);
    }

    @Test
    @DisplayName("enum 모드 — tenant row 없고 코어(NULL) row만 있을 때 코어 폴백 5건이 노출된다")
    void listCommonCodeTemplates_whenOnlyCoreRowsExist_returnsCoreFallback() {
        List<CommonCode> coreRows = List.of(
            buildCommonCode(null, "ATX_001", "결제 확인", 10, "{}"),
            buildCommonCode(null, "ATX_002", "예약 확정", 20, null),
            buildCommonCode(null, "ATX_003", "상담 안내", 30, null),
            buildCommonCode(null, "ATX_004", "후속 안내", 40, null),
            buildCommonCode(null, "ATX_005", "휴면 안내", 50, null));
        when(commonCodeRepository.findActiveByCodeGroupForTenantWithFallback(
                eq(CODE_GROUP), eq(TENANT_ID)))
            .thenReturn(coreRows);

        List<TestNotificationAlimtalkTemplate> result = service.listCommonCodeTemplates(TENANT_ID);

        assertThat(result).hasSize(5);
        assertThat(result).extracting(TestNotificationAlimtalkTemplate::getTemplateCode)
            .containsExactly("ATX_001", "ATX_002", "ATX_003", "ATX_004", "ATX_005");
        assertThat(result).allSatisfy(t -> {
            assertThat(t.getSource()).isEqualTo("COMMON_CODE");
            assertThat(t.getStatus()).isNull();
        });
    }

    @Test
    @DisplayName("enum 모드 — 같은 codeValue가 tenant·코어 양쪽에 있을 때 tenant row만 노출(dedup)")
    void listCommonCodeTemplates_whenDuplicateAcrossTenantAndCore_keepsTenantRow() {
        // 정렬 규약: tenant row(0) 먼저, 같은 sort_order 내 id ASC.
        List<CommonCode> mixedRows = List.of(
            buildCommonCode(TENANT_ID, "ATX_001", "테넌트 — 결제 확인", 10, "{}"),
            buildCommonCode(TENANT_ID, "ATX_010", "테넌트 — 신규 그룹 안내", 15, null),
            buildCommonCode(null, "ATX_001", "코어 — 결제 확인", 10, "{}"),
            buildCommonCode(null, "ATX_002", "코어 — 예약 확정", 20, null),
            buildCommonCode(null, "ATX_003", "코어 — 상담 안내", 30, null));
        when(commonCodeRepository.findActiveByCodeGroupForTenantWithFallback(
                eq(CODE_GROUP), eq(TENANT_ID)))
            .thenReturn(mixedRows);

        List<TestNotificationAlimtalkTemplate> result = service.listCommonCodeTemplates(TENANT_ID);

        assertThat(result).extracting(TestNotificationAlimtalkTemplate::getTemplateCode)
            .containsExactly("ATX_001", "ATX_010", "ATX_002", "ATX_003");
        assertThat(result).filteredOn(t -> "ATX_001".equals(t.getTemplateCode()))
            .singleElement()
            .extracting(TestNotificationAlimtalkTemplate::getTitle)
            .isEqualTo("테넌트 — 결제 확인");
    }

    @Test
    @DisplayName("enum 모드 — is_active=false row는 제외된다")
    void listCommonCodeTemplates_filtersInactiveRows() {
        CommonCode inactive = buildCommonCode(null, "ATX_INACTIVE", "비활성", 5, null);
        inactive.setIsActive(false);
        List<CommonCode> rows = List.of(
            inactive,
            buildCommonCode(null, "ATX_001", "결제 확인", 10, null));
        when(commonCodeRepository.findActiveByCodeGroupForTenantWithFallback(
                eq(CODE_GROUP), eq(TENANT_ID)))
            .thenReturn(rows);

        List<TestNotificationAlimtalkTemplate> result = service.listCommonCodeTemplates(TENANT_ID);

        assertThat(result).extracting(TestNotificationAlimtalkTemplate::getTemplateCode)
            .containsExactly("ATX_001");
    }

    @Test
    @DisplayName("live 모드 — 자격증명이 테넌트 settings·ENV 모두 비어 있으면 ALIMTALK_CREDENTIALS_MISSING throw")
    void listLiveAlimtalkTemplates_whenCredentialsMissingEverywhere_throwsCredentialsMissing() {
        when(tenantKakaoAlimtalkSettingsRepository.findByTenantIdAndIsDeletedFalse(eq(TENANT_ID)))
            .thenReturn(Optional.empty());
        when(solapiCredentialResolver.resolveCredentials(any()))
            .thenReturn(new SolapiCredentials(null, null));

        assertThatThrownBy(() -> service.listLiveAlimtalkTemplates(TENANT_ID))
            .isInstanceOf(AlimtalkTemplateFetchException.class)
            .hasMessageContaining("status=0")
            .hasMessageContaining("errorCode=ALIMTALK_CREDENTIALS_MISSING")
            .satisfies(e -> {
                AlimtalkTemplateFetchException ex = (AlimtalkTemplateFetchException) e;
                assertThat(ex.getUpstreamStatus()).isZero();
                assertThat(ex.getUpstreamErrorCode()).isEqualTo("ALIMTALK_CREDENTIALS_MISSING");
            });
    }

    @Test
    @DisplayName("live 모드 — pfId가 테넌트 settings·ENV 모두 비어 있으면 ALIMTALK_PFID_MISSING throw")
    void listLiveAlimtalkTemplates_whenPfIdMissingEverywhere_throwsPfidMissing() {
        when(tenantKakaoAlimtalkSettingsRepository.findByTenantIdAndIsDeletedFalse(eq(TENANT_ID)))
            .thenReturn(Optional.empty());
        when(solapiCredentialResolver.resolveCredentials(any()))
            .thenReturn(new SolapiCredentials("apiKey", "apiSecret"));
        when(solapiCredentialResolver.resolvePfId(any())).thenReturn("");

        assertThatThrownBy(() -> service.listLiveAlimtalkTemplates(TENANT_ID))
            .isInstanceOf(AlimtalkTemplateFetchException.class)
            .hasMessageContaining("status=0")
            .hasMessageContaining("errorCode=ALIMTALK_PFID_MISSING")
            .satisfies(e -> {
                AlimtalkTemplateFetchException ex = (AlimtalkTemplateFetchException) e;
                assertThat(ex.getUpstreamStatus()).isZero();
                assertThat(ex.getUpstreamErrorCode()).isEqualTo("ALIMTALK_PFID_MISSING");
            });
    }

    @Test
    @DisplayName("live 모드 — 테넌트 settings 부재 + ENV 폴백 존재 시 ENV pfId로 솔라피 호출")
    void listLiveAlimtalkTemplates_whenTenantSettingsMissingAndEnvFallbackPresent_callsSolapiWithEnvPfId() {
        String envPfId = "KA01PFENVTEST123";
        SolapiCredentials envCreds = new SolapiCredentials("ENV_API_KEY", "ENV_API_SECRET");

        when(tenantKakaoAlimtalkSettingsRepository.findByTenantIdAndIsDeletedFalse(eq(TENANT_ID)))
            .thenReturn(Optional.empty());
        // tenant settings 부재 → resolver 가 senderKeyRef=null/apiKeyRef=null 입력으로 ENV 폴백을 결과로 반환.
        when(solapiCredentialResolver.resolveCredentials(any())).thenReturn(envCreds);
        when(solapiCredentialResolver.resolvePfId(any())).thenReturn(envPfId);

        SolapiKakaoTemplateClient.Response success = SolapiKakaoTemplateClient.Response.success(List.of(
            new SolapiKakaoTemplateClient.TemplateMeta(
                "KA01TPL000000001", "결제 안내", "APPROVED", "안녕하세요 #{name}님")));
        when(solapiKakaoTemplateClient.list(eq(envCreds), eq(envPfId))).thenReturn(success);

        List<TestNotificationAlimtalkTemplate> result = service.listLiveAlimtalkTemplates(TENANT_ID);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTemplateCode()).isEqualTo("KA01TPL000000001");
        assertThat(result.get(0).getTitle()).isEqualTo("결제 안내");
        assertThat(result.get(0).getStatus()).isEqualTo("APPROVED");
        assertThat(result.get(0).getSource()).isEqualTo("SOLAPI");

        // 호출 검증 — list 가 ENV pfId 인자로 호출됐는지 ArgumentCaptor 대신 eq() 매칭으로 확인.
        verify(solapiKakaoTemplateClient).list(eq(envCreds), eq(envPfId));
    }

    @Test
    @DisplayName("live 모드 — content에서 #{변수명}을 추출해 variables를 채우고 content는 그대로 노출")
    void listLiveAlimtalkTemplates_extractsVariablesFromContent() {
        String envPfId = "KA01PFENVTEST123";
        SolapiCredentials envCreds = new SolapiCredentials("ENV_API_KEY", "ENV_API_SECRET");
        String content = "[#{packageName}] 결제금액 #{paymentAmount}원이 입금 확인되었습니다."
            + " 담당자: #{consultantName}";

        when(tenantKakaoAlimtalkSettingsRepository.findByTenantIdAndIsDeletedFalse(eq(TENANT_ID)))
            .thenReturn(Optional.empty());
        when(solapiCredentialResolver.resolveCredentials(any())).thenReturn(envCreds);
        when(solapiCredentialResolver.resolvePfId(any())).thenReturn(envPfId);

        SolapiKakaoTemplateClient.Response success = SolapiKakaoTemplateClient.Response.success(List.of(
            new SolapiKakaoTemplateClient.TemplateMeta(
                "KA01TP260521130131986g9Fyf1DM6iw", "CONSULTATION_CONFIRMED", "APPROVED", content)));
        when(solapiKakaoTemplateClient.list(eq(envCreds), eq(envPfId))).thenReturn(success);

        List<TestNotificationAlimtalkTemplate> result = service.listLiveAlimtalkTemplates(TENANT_ID);

        assertThat(result).hasSize(1);
        TestNotificationAlimtalkTemplate template = result.get(0);
        assertThat(template.getTemplateCode()).isEqualTo("KA01TP260521130131986g9Fyf1DM6iw");
        assertThat(template.getSource()).isEqualTo("SOLAPI");
        assertThat(template.getContent()).isEqualTo(content);
        // dedupe·required=true·sampleValue=null 기본값을 동시 검증한다.
        assertThat(template.getVariables())
            .extracting(TestNotificationAlimtalkTemplate.Variable::getName)
            .containsExactly("packageName", "paymentAmount", "consultantName");
        assertThat(template.getVariables())
            .allSatisfy(v -> {
                assertThat(v.isRequired()).isTrue();
                assertThat(v.getSampleValue()).isNull();
            });
    }

    @Test
    @DisplayName("live 모드 — content가 평문(변수 없음)이면 variables=[] 이고 content는 그대로 노출")
    void listLiveAlimtalkTemplates_handlesContentWithoutVariables() {
        String envPfId = "KA01PFENVTEST123";
        SolapiCredentials envCreds = new SolapiCredentials("ENV_API_KEY", "ENV_API_SECRET");
        String content = "안녕하세요. 마인드가든 알림 테스트 메시지입니다.";

        when(tenantKakaoAlimtalkSettingsRepository.findByTenantIdAndIsDeletedFalse(eq(TENANT_ID)))
            .thenReturn(Optional.empty());
        when(solapiCredentialResolver.resolveCredentials(any())).thenReturn(envCreds);
        when(solapiCredentialResolver.resolvePfId(any())).thenReturn(envPfId);

        SolapiKakaoTemplateClient.Response success = SolapiKakaoTemplateClient.Response.success(List.of(
            new SolapiKakaoTemplateClient.TemplateMeta(
                "KA01TPPLAIN0000000000000000000001", "PLAIN_BODY", "APPROVED", content)));
        when(solapiKakaoTemplateClient.list(eq(envCreds), eq(envPfId))).thenReturn(success);

        List<TestNotificationAlimtalkTemplate> result = service.listLiveAlimtalkTemplates(TENANT_ID);

        assertThat(result).hasSize(1);
        TestNotificationAlimtalkTemplate template = result.get(0);
        assertThat(template.getVariables()).isEmpty();
        assertThat(template.getContent()).isEqualTo(content);
        assertThat(template.getSource()).isEqualTo("SOLAPI");
    }

    @Test
    @DisplayName("live 모드 — 솔라피 4xx 응답이면 AlimtalkTemplateFetchException 발생")
    void listLiveAlimtalkTemplates_whenSolapi4xx_throwsAlimtalkTemplateFetchException() {
        when(tenantKakaoAlimtalkSettingsRepository.findByTenantIdAndIsDeletedFalse(eq(TENANT_ID)))
            .thenReturn(Optional.empty());
        when(solapiCredentialResolver.resolveCredentials(any()))
            .thenReturn(new SolapiCredentials("apiKey", "apiSecret"));
        // ENV 폴백으로 pfId 가 결정된 뒤 솔라피가 ValidationError 를 반환하는 상황을 시뮬레이션한다.
        when(solapiCredentialResolver.resolvePfId(any())).thenReturn("KA01PFENVTEST123");
        SolapiKakaoTemplateClient.Response failure = SolapiKakaoTemplateClient.Response
            .failure(400, "ValidationError", "channelId is required");
        when(solapiKakaoTemplateClient.list(any(), any())).thenReturn(failure);

        assertThatThrownBy(() -> service.listLiveAlimtalkTemplates(TENANT_ID))
            .isInstanceOf(AlimtalkTemplateFetchException.class)
            .hasMessageContaining("status=400")
            .hasMessageContaining("ValidationError")
            .hasMessageContaining("channelId is required")
            .satisfies(e -> {
                AlimtalkTemplateFetchException ex = (AlimtalkTemplateFetchException) e;
                assertThat(ex.getUpstreamStatus()).isEqualTo(400);
                assertThat(ex.getUpstreamErrorCode()).isEqualTo("ValidationError");
            });
    }

    @Test
    @DisplayName("listCommonCodeTemplates — ALIMTALK_BIZ_TEMPLATE_CODE 매핑 있는 row 는 solapiTemplateIdPresent=true")
    void listCommonCodeTemplates_fillsSolapiTemplateIdPresentBasedOnBizMapping() {
        List<CommonCode> rows = List.of(
            buildCommonCode(null, "PAYMENT_COMPLETED", "결제 완료", 10, null),
            buildCommonCode(null, "ATX_UNMAPPED", "매핑없는 코드", 20, null));
        when(commonCodeRepository.findActiveByCodeGroupForTenantWithFallback(
                eq(CODE_GROUP), eq(TENANT_ID)))
            .thenReturn(rows);

        // PAYMENT_COMPLETED 는 ALIMTALK_BIZ_TEMPLATE_CODE 매핑 있음(KA01TP…).
        when(templateMappingResolver.resolveSolapiTemplateId(eq(TENANT_ID), eq("PAYMENT_COMPLETED")))
            .thenReturn("KA01TP250101000000000000000001");
        when(templateMappingResolver.resolveSolapiTemplateId(eq(TENANT_ID), eq("ATX_UNMAPPED")))
            .thenReturn(null);

        List<TestNotificationAlimtalkTemplate> result = service.listCommonCodeTemplates(TENANT_ID);

        assertThat(result).hasSize(2);
        assertThat(result).filteredOn(t -> "PAYMENT_COMPLETED".equals(t.getTemplateCode()))
            .singleElement()
            .satisfies(t -> assertThat(t.isSolapiTemplateIdPresent()).isTrue());
        assertThat(result).filteredOn(t -> "ATX_UNMAPPED".equals(t.getTemplateCode()))
            .singleElement()
            .satisfies(t -> assertThat(t.isSolapiTemplateIdPresent()).isFalse());
    }

    @Test
    @DisplayName("sendAlimtalk — 공통코드 모드 + 매핑 있음: 매핑된 KA01TP… 로 kakao 호출")
    void sendAlimtalk_whenCommonCodeWithMapping_callsKakaoWithMappedTemplateId() {
        when(templateMappingResolver.resolveSolapiTemplateId(eq(TENANT_ID), eq("PAYMENT_COMPLETED")))
            .thenReturn("KA01TP250101000000000000000001");

        AdminTestNotificationLog savedLog = AdminTestNotificationLog.builder()
            .sentByUserId(SENDER_USER_ID)
            .sentByUsername(SENDER_LOGIN)
            .sentAt(java.time.LocalDateTime.now())
            .recipientMode(TestNotificationRecipientMode.SELF)
            .recipientPhoneMasked("010****5678")
            .channel(TestNotificationChannel.ALIMTALK)
            .templateCode("PAYMENT_COMPLETED")
            .reason("매핑 송신 검증")
            .success(Boolean.FALSE)
            .build();
        savedLog.setId(123L);
        when(logger.logAttempt(eq(TENANT_ID), eq(SENDER_USER_ID), eq(SENDER_LOGIN),
                eq(TestNotificationRecipientMode.SELF), eq(SENDER_USER_ID), anyString(),
                eq(TestNotificationChannel.ALIMTALK), eq("PAYMENT_COMPLETED"), anyMap(),
                eq(null), eq("매핑 송신 검증")))
            .thenReturn(savedLog);

        when(encryptionUtil.decrypt(eq(SELF_PHONE))).thenReturn(SELF_PHONE);
        when(dispatchHelper.dispatchAlimtalk(eq(SELF_PHONE),
                eq("KA01TP250101000000000000000001"), anyMap()))
            .thenReturn(new NotificationDispatchHelper.DispatchResult(true, null, null,
                "GROUP-OK", "MSG-OK"));

        TestAlimtalkRequest request = TestAlimtalkRequest.builder()
            .recipientMode(TestNotificationRecipientMode.SELF)
            .templateCode("PAYMENT_COMPLETED")
            .templateParams(new HashMap<>())
            .reason("매핑 송신 검증")
            .templateSource("COMMON_CODE")
            .build();

        TestNotificationResponse response = service.sendAlimtalk(TENANT_ID, buildSender(), request);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getErrorCode()).isNull();
        assertThat(response.getLogId()).isEqualTo(123L);
        verify(dispatchHelper).dispatchAlimtalk(eq(SELF_PHONE),
            eq("KA01TP250101000000000000000001"), anyMap());
        verify(dispatchHelper, never()).dispatchAlimtalk(anyString(),
            eq("PAYMENT_COMPLETED"), anyMap());
    }

    @Test
    @DisplayName("sendAlimtalk — 공통코드 모드 + 매핑 없음: TEMPLATE_NOT_MAPPED 차단·kakao 호출 0회")
    void sendAlimtalk_whenCommonCodeMappingMissing_blocksAndLogsTemplateNotMapped() {
        when(templateMappingResolver.resolveSolapiTemplateId(eq(TENANT_ID), eq("UNMAPPED_CODE")))
            .thenReturn(null);

        AdminTestNotificationLog blockedLog = AdminTestNotificationLog.builder()
            .sentByUserId(SENDER_USER_ID)
            .sentByUsername(SENDER_LOGIN)
            .sentAt(java.time.LocalDateTime.now())
            .recipientMode(TestNotificationRecipientMode.SELF)
            .recipientPhoneMasked("010****5678")
            .channel(TestNotificationChannel.ALIMTALK)
            .templateCode("UNMAPPED_CODE")
            .reason("매핑 없음 차단 검증")
            .success(Boolean.FALSE)
            .build();
        blockedLog.setId(456L);
        when(logger.logAttempt(eq(TENANT_ID), eq(SENDER_USER_ID), eq(SENDER_LOGIN),
                eq(TestNotificationRecipientMode.SELF), eq(SENDER_USER_ID), anyString(),
                eq(TestNotificationChannel.ALIMTALK), eq("UNMAPPED_CODE"), anyMap(),
                eq(null), eq("매핑 없음 차단 검증")))
            .thenReturn(blockedLog);

        when(encryptionUtil.decrypt(eq(SELF_PHONE))).thenReturn(SELF_PHONE);

        TestAlimtalkRequest request = TestAlimtalkRequest.builder()
            .recipientMode(TestNotificationRecipientMode.SELF)
            .templateCode("UNMAPPED_CODE")
            .templateParams(new HashMap<>())
            .reason("매핑 없음 차단 검증")
            .templateSource("COMMON_CODE")
            .build();

        TestNotificationResponse response = service.sendAlimtalk(TENANT_ID, buildSender(), request);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getErrorCode()).isEqualTo("TEMPLATE_NOT_MAPPED");
        assertThat(response.getErrorMessage())
            .contains("UNMAPPED_CODE")
            .contains(BIZ_CODE_GROUP);
        assertThat(response.getLogId()).isEqualTo(456L);
        verify(dispatchHelper, never())
            .dispatchAlimtalk(anyString(), anyString(), anyMap());
        verify(logger).updateResult(eq(456L), eq(false), eq(null), eq(null),
            eq("TEMPLATE_NOT_MAPPED"), anyString());
    }

    @Test
    @DisplayName("sendAlimtalk — 라이브(SOLAPI) 모드: 매핑 lookup 건너뛰고 templateCode 그대로 송신")
    void sendAlimtalk_whenLiveSolapiMode_skipsMappingLookup() {
        AdminTestNotificationLog savedLog = AdminTestNotificationLog.builder()
            .sentByUserId(SENDER_USER_ID)
            .sentByUsername(SENDER_LOGIN)
            .sentAt(java.time.LocalDateTime.now())
            .recipientMode(TestNotificationRecipientMode.SELF)
            .recipientPhoneMasked("010****5678")
            .channel(TestNotificationChannel.ALIMTALK)
            .templateCode("KA01TP250101000000000000000099")
            .reason("라이브 송신 검증")
            .success(Boolean.FALSE)
            .build();
        savedLog.setId(789L);
        when(logger.logAttempt(eq(TENANT_ID), eq(SENDER_USER_ID), eq(SENDER_LOGIN),
                eq(TestNotificationRecipientMode.SELF), eq(SENDER_USER_ID), anyString(),
                eq(TestNotificationChannel.ALIMTALK),
                eq("KA01TP250101000000000000000099"), anyMap(),
                eq(null), eq("라이브 송신 검증")))
            .thenReturn(savedLog);
        when(encryptionUtil.decrypt(eq(SELF_PHONE))).thenReturn(SELF_PHONE);
        when(dispatchHelper.dispatchAlimtalk(eq(SELF_PHONE),
                eq("KA01TP250101000000000000000099"), anyMap()))
            .thenReturn(new NotificationDispatchHelper.DispatchResult(true, null, null,
                "GROUP-OK", "MSG-OK"));

        TestAlimtalkRequest request = TestAlimtalkRequest.builder()
            .recipientMode(TestNotificationRecipientMode.SELF)
            .templateCode("KA01TP250101000000000000000099")
            .templateParams(new HashMap<>())
            .reason("라이브 송신 검증")
            .templateSource("SOLAPI")
            .build();

        TestNotificationResponse response = service.sendAlimtalk(TENANT_ID, buildSender(), request);

        assertThat(response.isSuccess()).isTrue();
        verify(templateMappingResolver, never()).resolveSolapiTemplateId(anyString(), anyString());
        verify(dispatchHelper).dispatchAlimtalk(eq(SELF_PHONE),
            eq("KA01TP250101000000000000000099"), anyMap());
    }

    @Test
    @DisplayName("isLiveTemplateSource — null/blank/COMMON_CODE 는 false, SOLAPI(대소문자 무관) 는 true")
    void isLiveTemplateSource_classifiesCorrectly() {
        assertThat(AdminTestNotificationServiceImpl.isLiveTemplateSource(null)).isFalse();
        assertThat(AdminTestNotificationServiceImpl.isLiveTemplateSource("")).isFalse();
        assertThat(AdminTestNotificationServiceImpl.isLiveTemplateSource("  ")).isFalse();
        assertThat(AdminTestNotificationServiceImpl.isLiveTemplateSource("COMMON_CODE")).isFalse();
        assertThat(AdminTestNotificationServiceImpl.isLiveTemplateSource("solapi")).isTrue();
        assertThat(AdminTestNotificationServiceImpl.isLiveTemplateSource("SOLAPI")).isTrue();
        assertThat(AdminTestNotificationServiceImpl.isLiveTemplateSource(" SOLAPI ")).isTrue();
    }

    private static User buildSender() {
        User user = new User();
        user.setId(SENDER_USER_ID);
        user.setUserId(SENDER_LOGIN);
        user.setTenantId(TENANT_ID);
        // PersonalDataEncryptionUtil mock 이 decrypt 시 동일 값을 반환하도록 stub 한다.
        user.setPhone(SELF_PHONE);
        return user;
    }

    private static CommonCode buildCommonCode(String tenantId, String codeValue, String codeLabel,
            int sortOrder, String extraData) {
        CommonCode code = new CommonCode();
        code.setTenantId(tenantId);
        code.setCodeGroup(CODE_GROUP);
        code.setCodeValue(codeValue);
        code.setCodeLabel(codeLabel);
        code.setKoreanName(codeLabel);
        code.setSortOrder(sortOrder);
        code.setIsActive(true);
        code.setExtraData(extraData);
        return code;
    }

}
