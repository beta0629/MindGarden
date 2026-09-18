package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.dto.ClientPackagePaymentHistoryResponse;
import com.coresolution.consultation.dto.PackagePaymentHistoryItemResponse;
import com.coresolution.consultation.dto.PackagePaymentHistoryType;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.SessionExtensionRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.SessionExtensionRequestRepository;
import com.coresolution.consultation.dto.PaymentSource;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.core.context.TenantContextHolder;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 내담자 패키지 결제 이력 — TERMINATED 포함·유형 분류·tenant 격리.
 *
 * @author MindGarden
 * @since 2026-07-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientPackagePaymentHistoryServiceImpl")
class ClientPackagePaymentHistoryServiceImplTest {

    private static final String TENANT_A = "tenant-pkg-hist-a-" + UUID.randomUUID();
    private static final String TENANT_B = "tenant-pkg-hist-b-" + UUID.randomUUID();
    private static final Long CLIENT_ID = 1001L;
    private static final Long CONSULTANT_A_ID = 2001L;
    private static final Long CONSULTANT_B_ID = 2002L;

    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private SessionExtensionRequestRepository sessionExtensionRequestRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;

    @InjectMocks
    private ClientPackagePaymentHistoryServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_A);
        lenient().when(userPersonalDataCacheService.getDecryptedUserData(any(User.class)))
                .thenAnswer(invocation -> {
                    User user = invocation.getArgument(0);
                    return Map.of("name", user.getName() != null ? user.getName() : "알 수 없음");
                });
        lenient().when(paymentRepository.findByTenantIdAndOrderIdInAndIsDeletedFalse(any(), any()))
                .thenReturn(Collections.emptyList());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("TERMINATED 추가패키지 매핑을 이력에 포함하고 유형을 ADDITIONAL_PACKAGE로 분류한다")
    void includesTerminatedAdditionalPackageAndClassifiesType() {
        User client = user(CLIENT_ID, "김내담");
        User consultant = user(CONSULTANT_A_ID, "박상담");

        ConsultantClientMapping active = mapping(
                10L, client, consultant,
                ConsultantClientMapping.MappingStatus.ACTIVE,
                "프리미엄 10회권", 10, 6, 500_000L,
                LocalDateTime.of(2026, 6, 1, 10, 0),
                null);

        ConsultantClientMapping terminatedAdditional = mapping(
                11L, client, consultant,
                ConsultantClientMapping.MappingStatus.TERMINATED,
                "추가 10회권", 10, 0, 500_000L,
                LocalDateTime.of(2026, 7, 28, 12, 0),
                String.format(AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_LINE_FMT, 10L, 10));

        when(mappingRepository.findAllByTenantIdAndClientIdWithDetails(eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(List.of(active, terminatedAdditional));
        when(sessionExtensionRequestRepository.findByTenantIdAndClientIdWithDetails(
                eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(Collections.emptyList());

        ClientPackagePaymentHistoryResponse response =
                service.getPackagePaymentHistory(CLIENT_ID, null);

        assertThat(response.getItems()).hasSize(2);
        assertThat(response.getItems())
                .extracting(PackagePaymentHistoryItemResponse::getType)
                .containsExactly(
                        PackagePaymentHistoryType.ADDITIONAL_PACKAGE,
                        PackagePaymentHistoryType.INITIAL_MAPPING);
        assertThat(response.getItems().get(0).getTargetActiveMappingId()).isEqualTo(10L);
        assertThat(response.getSummary().getTotalSessions()).isEqualTo(10);
        assertThat(response.getSummary().getRemainingSessions()).isEqualTo(6);
        assertThat(response.getSummary().getItemCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("회기추가 요청은 SESSION_EXTENSION 유형으로 타임라인에 포함된다")
    void includesSessionExtensionAsTypedItem() {
        User client = user(CLIENT_ID, "김내담");
        User consultant = user(CONSULTANT_A_ID, "박상담");
        ConsultantClientMapping active = mapping(
                10L, client, consultant,
                ConsultantClientMapping.MappingStatus.ACTIVE,
                "프리미엄 10회권", 15, 8, 500_000L,
                LocalDateTime.of(2026, 6, 1, 10, 0),
                null);

        SessionExtensionRequest extension = new SessionExtensionRequest();
        extension.setId(77L);
        extension.setTenantId(TENANT_A);
        extension.setMapping(active);
        extension.setAdditionalSessions(5);
        extension.setPackageName("회기추가 5회");
        extension.setPackagePrice(BigDecimal.valueOf(250_000));
        extension.setStatus(SessionExtensionRequest.ExtensionStatus.COMPLETED);
        extension.setPaymentDate(LocalDateTime.of(2026, 7, 20, 9, 0));
        extension.setCreatedAt(LocalDateTime.of(2026, 7, 19, 9, 0));
        extension.setUpdatedAt(LocalDateTime.of(2026, 7, 20, 9, 0));

        when(mappingRepository.findAllByTenantIdAndClientIdWithDetails(eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(List.of(active));
        when(sessionExtensionRequestRepository.findByTenantIdAndClientIdWithDetails(
                eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(List.of(extension));

        ClientPackagePaymentHistoryResponse response =
                service.getPackagePaymentHistory(CLIENT_ID, null);

        assertThat(response.getItems()).hasSize(2);
        PackagePaymentHistoryItemResponse extItem = response.getItems().stream()
                .filter(i -> i.getType() == PackagePaymentHistoryType.SESSION_EXTENSION)
                .findFirst()
                .orElseThrow();
        assertThat(extItem.getExtensionRequestId()).isEqualTo(77L);
        assertThat(extItem.getSessions()).isEqualTo(5);
        assertThat(extItem.getAmount()).isEqualByComparingTo("250000");
    }

    @Test
    @DisplayName("병합 완료 notes도 ADDITIONAL_PACKAGE로 분류한다")
    void classifiesMergedNotesAsAdditionalPackage() {
        assertThat(service.isAdditionalPackageNotes(
                String.format(AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_FMT, 10L, 10)))
                .isTrue();
        assertThat(service.isAdditionalPackageNotes("일반 매칭 notes")).isFalse();
        assertThat(service.parseTargetActiveMappingId(
                String.format(AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_FMT, 42L, 5)))
                .isEqualTo(42L);
    }

    @Test
    @DisplayName("상담사 뷰어는 본인 담당 건만 본다")
    void filtersByViewerConsultantId() {
        User client = user(CLIENT_ID, "김내담");
        User consultantA = user(CONSULTANT_A_ID, "A상담");
        User consultantB = user(CONSULTANT_B_ID, "B상담");

        ConsultantClientMapping mappingA = mapping(
                10L, client, consultantA,
                ConsultantClientMapping.MappingStatus.ACTIVE,
                "A패키지", 10, 5, 100_000L,
                LocalDateTime.of(2026, 6, 1, 10, 0), null);
        ConsultantClientMapping mappingB = mapping(
                11L, client, consultantB,
                ConsultantClientMapping.MappingStatus.TERMINATED,
                "B패키지", 5, 0, 50_000L,
                LocalDateTime.of(2026, 5, 1, 10, 0), null);

        when(mappingRepository.findAllByTenantIdAndClientIdWithDetails(eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(List.of(mappingA, mappingB));
        when(sessionExtensionRequestRepository.findByTenantIdAndClientIdWithDetails(
                eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(Collections.emptyList());

        ClientPackagePaymentHistoryResponse response =
                service.getPackagePaymentHistory(CLIENT_ID, CONSULTANT_A_ID);

        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getConsultantId()).isEqualTo(CONSULTANT_A_ID);
    }

    @Test
    @DisplayName("CANCELLED 매핑은 status=CANCELLED 로 그대로 반환한다 (display 매핑 없음)")
    void returnsCancelledStatusPassthrough() {
        User client = user(CLIENT_ID, "김내담");
        User consultant = user(CONSULTANT_A_ID, "박상담");

        ConsultantClientMapping cancelled = mapping(
                20L, client, consultant,
                ConsultantClientMapping.MappingStatus.CANCELLED,
                "취소된 10회권", 10, 0, 500_000L,
                LocalDateTime.of(2026, 8, 25, 18, 0),
                "PENDING_PAYMENT 매칭 취소");

        when(mappingRepository.findAllByTenantIdAndClientIdWithDetails(eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(List.of(cancelled));
        when(sessionExtensionRequestRepository.findByTenantIdAndClientIdWithDetails(
                eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(Collections.emptyList());

        ClientPackagePaymentHistoryResponse response =
                service.getPackagePaymentHistory(CLIENT_ID, null);

        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getStatus())
                .isEqualTo(ConsultantClientMapping.MappingStatus.CANCELLED.name());
        assertThat(response.getItems().get(0).getType())
                .isEqualTo(PackagePaymentHistoryType.INITIAL_MAPPING);
    }

    @Test
    @DisplayName("SESSIONS_EXHAUSTED 및 비취소 TERMINATED 는 각각 원래 status 로 반환한다")
    void returnsSessionsExhaustedAndNonCancelTerminatedUnchanged() {
        User client = user(CLIENT_ID, "김내담");
        User consultant = user(CONSULTANT_A_ID, "박상담");

        ConsultantClientMapping exhausted = mapping(
                30L, client, consultant,
                ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED,
                "소진 패키지", 10, 0, 400_000L,
                LocalDateTime.of(2026, 5, 1, 10, 0), null);

        ConsultantClientMapping terminatedMerge = mapping(
                31L, client, consultant,
                ConsultantClientMapping.MappingStatus.TERMINATED,
                "추가 패키지", 5, 0, 200_000L,
                LocalDateTime.of(2026, 6, 1, 10, 0),
                String.format(AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_LINE_FMT, 30L, 5));

        when(mappingRepository.findAllByTenantIdAndClientIdWithDetails(eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(List.of(exhausted, terminatedMerge));
        when(sessionExtensionRequestRepository.findByTenantIdAndClientIdWithDetails(
                eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(Collections.emptyList());

        ClientPackagePaymentHistoryResponse response =
                service.getPackagePaymentHistory(CLIENT_ID, null);

        assertThat(response.getItems())
                .extracting(PackagePaymentHistoryItemResponse::getStatus)
                .contains(
                        ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED.name(),
                        ConsultantClientMapping.MappingStatus.TERMINATED.name());
        assertThat(response.getItems())
                .extracting(PackagePaymentHistoryItemResponse::getStatus)
                .doesNotContain(ConsultantClientMapping.MappingStatus.CANCELLED.name());
    }

    @Test
    @DisplayName("승계 왕복(송출+역수신) 후 최초 회기 표시는 병합·승계 순변동을 보정한다")
    void successionRoundtrip_preservesInitialDisplaySessionsAndRemaining() {
        User client = user(CLIENT_ID, "왕복내담");
        User consultant = user(CONSULTANT_A_ID, "박상담");
        final Long openMappingId = 501L;
        final Long mergedMappingId = 502L;
        final Long peerMappingId = 601L;

        // 결제 당시 2회 → 추가10 병합 → 승계 6송출·5수신 → 현재 T=11 R=3
        String openNotes = ""
                + "[회기 승계] 6회 → 타깃매핑#" + peerMappingId
                + " (수혜자#2002, 상담사#" + CONSULTANT_A_ID + ") 사유: 승계\n"
                + "[회기 승계] 소스매핑#" + peerMappingId + "에서 5회 수령";
        ConsultantClientMapping openActive = mapping(
                openMappingId, client, consultant,
                ConsultantClientMapping.MappingStatus.ACTIVE,
                "오픈패키지", 11, 3, 100_000L,
                LocalDateTime.of(2026, 7, 27, 0, 30),
                openNotes);

        ConsultantClientMapping mergedAdditional = mapping(
                mergedMappingId, client, consultant,
                ConsultantClientMapping.MappingStatus.TERMINATED,
                "10 회기", 10, 0, 800_000L,
                LocalDateTime.of(2026, 7, 28, 9, 32),
                String.format(
                        AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_FMT,
                        openMappingId, 10));

        when(mappingRepository.findAllByTenantIdAndClientIdWithDetails(eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(List.of(openActive, mergedAdditional));
        when(sessionExtensionRequestRepository.findByTenantIdAndClientIdWithDetails(
                eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(Collections.emptyList());

        ClientPackagePaymentHistoryResponse response =
                service.getPackagePaymentHistory(CLIENT_ID, null);

        PackagePaymentHistoryItemResponse openItem = response.getItems().stream()
                .filter(i -> openMappingId.equals(i.getMappingId()))
                .findFirst()
                .orElseThrow();
        PackagePaymentHistoryItemResponse additionalItem = response.getItems().stream()
                .filter(i -> mergedMappingId.equals(i.getMappingId()))
                .findFirst()
                .orElseThrow();

        // 보정 전(11-10)=1 왜곡 → 승계 순변동(5-6=-1) 반영 후 2
        assertThat(openItem.getType()).isEqualTo(PackagePaymentHistoryType.INITIAL_MAPPING);
        assertThat(openItem.getSessions()).isEqualTo(2);
        assertThat(openItem.getRemainingSessions()).isEqualTo(3);
        assertThat(openItem.getMergedIntoActive()).isNull();

        assertThat(additionalItem.getType()).isEqualTo(PackagePaymentHistoryType.ADDITIONAL_PACKAGE);
        assertThat(additionalItem.getSessions()).isEqualTo(10);
        assertThat(additionalItem.getRemainingSessions()).isNull();
        assertThat(additionalItem.getMergedIntoActive()).isTrue();
        assertThat(additionalItem.getTargetActiveMappingId()).isEqualTo(openMappingId);
        assertThat(response.getSummary().getRemainingSessions()).isEqualTo(3);
    }

    @Test
    @DisplayName("승계 notes 없으면 기존 병합 차감만 적용한다")
    void withoutSuccessionNotes_subtractsMergedOnly() {
        User client = user(CLIENT_ID, "김내담");
        User consultant = user(CONSULTANT_A_ID, "박상담");

        ConsultantClientMapping active = mapping(
                10L, client, consultant,
                ConsultantClientMapping.MappingStatus.ACTIVE,
                "프리미엄", 12, 4, 500_000L,
                LocalDateTime.of(2026, 6, 1, 10, 0),
                null);
        ConsultantClientMapping terminatedAdditional = mapping(
                11L, client, consultant,
                ConsultantClientMapping.MappingStatus.TERMINATED,
                "추가 10회권", 10, 0, 500_000L,
                LocalDateTime.of(2026, 7, 28, 12, 0),
                String.format(AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_FMT, 10L, 10));

        when(mappingRepository.findAllByTenantIdAndClientIdWithDetails(eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(List.of(active, terminatedAdditional));
        when(sessionExtensionRequestRepository.findByTenantIdAndClientIdWithDetails(
                eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(Collections.emptyList());

        ClientPackagePaymentHistoryResponse response =
                service.getPackagePaymentHistory(CLIENT_ID, null);

        PackagePaymentHistoryItemResponse initial = response.getItems().stream()
                .filter(i -> i.getType() == PackagePaymentHistoryType.INITIAL_MAPPING)
                .findFirst()
                .orElseThrow();
        assertThat(initial.getSessions()).isEqualTo(2);
        assertThat(initial.getRemainingSessions()).isEqualTo(4);
    }

    @Test
    @DisplayName("tenantId 미설정 시 조회를 거부한다")
    void requiresTenantId() {
        TenantContextHolder.clear();
        assertThatThrownBy(() -> service.getPackagePaymentHistory(CLIENT_ID, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("tenantId");
    }

    @Test
    @DisplayName("payments(PG) 연계 시 paymentSource=ONLINE — CARD method만으로 판정하지 않음")
    void mapsOnlineWhenPgPaymentLinked() {
        User client = user(CLIENT_ID, "김내담");
        User consultant = user(CONSULTANT_A_ID, "박상담");
        ConsultantClientMapping active = mapping(
                10L, client, consultant,
                ConsultantClientMapping.MappingStatus.ACTIVE,
                "온라인패키지", 5, 5, 100_000L,
                LocalDateTime.of(2026, 8, 1, 10, 0),
                null);
        active.setPaymentMethod("CARD");
        active.setPaymentReference("ord_online_10");

        Payment pg = Payment.builder()
                .orderId("ord_online_10")
                .provider(Payment.PaymentProvider.IAMPORT)
                .build();
        pg.setId(501L);

        when(mappingRepository.findAllByTenantIdAndClientIdWithDetails(eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(List.of(active));
        when(sessionExtensionRequestRepository.findByTenantIdAndClientIdWithDetails(
                eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(Collections.emptyList());
        when(paymentRepository.findByTenantIdAndOrderIdInAndIsDeletedFalse(eq(TENANT_A), any()))
                .thenReturn(List.of(pg));

        ClientPackagePaymentHistoryResponse response =
                service.getPackagePaymentHistory(CLIENT_ID, null);

        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getPaymentSource()).isEqualTo(PaymentSource.ONLINE);
    }

    @Test
    @DisplayName("PG 미연계 + admin method → paymentSource=MANUAL")
    void mapsManualWhenAdminRegisteredWithoutPg() {
        User client = user(CLIENT_ID, "김내담");
        User consultant = user(CONSULTANT_A_ID, "박상담");
        ConsultantClientMapping active = mapping(
                10L, client, consultant,
                ConsultantClientMapping.MappingStatus.ACTIVE,
                "수동패키지", 5, 5, 100_000L,
                LocalDateTime.of(2026, 8, 1, 10, 0),
                null);
        active.setPaymentMethod("CARD");
        active.setPaymentReference("manual-ref-10");

        when(mappingRepository.findAllByTenantIdAndClientIdWithDetails(eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(List.of(active));
        when(sessionExtensionRequestRepository.findByTenantIdAndClientIdWithDetails(
                eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(Collections.emptyList());
        when(paymentRepository.findByTenantIdAndOrderIdInAndIsDeletedFalse(eq(TENANT_A), any()))
                .thenReturn(Collections.emptyList());

        ClientPackagePaymentHistoryResponse response =
                service.getPackagePaymentHistory(CLIENT_ID, null);

        assertThat(response.getItems().get(0).getPaymentSource()).isEqualTo(PaymentSource.MANUAL);
    }

    @Test
    @DisplayName("단서 없음 → paymentSource=UNKNOWN (온라인 오인 금지)")
    void mapsUnknownWhenNoEvidence() {
        User client = user(CLIENT_ID, "김내담");
        User consultant = user(CONSULTANT_A_ID, "박상담");
        ConsultantClientMapping active = mapping(
                10L, client, consultant,
                ConsultantClientMapping.MappingStatus.ACTIVE,
                "미확인패키지", 5, 5, 100_000L,
                LocalDateTime.of(2026, 8, 1, 10, 0),
                null);
        active.setPaymentMethod(null);
        active.setPaymentReference(null);
        active.setPaymentStatus(ConsultantClientMapping.PaymentStatus.PENDING);

        when(mappingRepository.findAllByTenantIdAndClientIdWithDetails(eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(List.of(active));
        when(sessionExtensionRequestRepository.findByTenantIdAndClientIdWithDetails(
                eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(Collections.emptyList());

        ClientPackagePaymentHistoryResponse response =
                service.getPackagePaymentHistory(CLIENT_ID, null);

        assertThat(response.getItems().get(0).getPaymentSource()).isEqualTo(PaymentSource.UNKNOWN);
    }

    @Test
    @DisplayName("조회는 현재 tenant 컨텍스트의 repository 파라미터만 사용한다")
    void usesTenantScopedRepositoryCalls() {
        when(mappingRepository.findAllByTenantIdAndClientIdWithDetails(eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(Collections.emptyList());
        when(sessionExtensionRequestRepository.findByTenantIdAndClientIdWithDetails(
                eq(TENANT_A), eq(CLIENT_ID)))
                .thenReturn(Collections.emptyList());

        service.getPackagePaymentHistory(CLIENT_ID, null);

        // 다른 테넌트 ID로 호출되지 않음 (eq TENANT_A stub만 존재)
        TenantContextHolder.setTenantId(TENANT_B);
        when(mappingRepository.findAllByTenantIdAndClientIdWithDetails(eq(TENANT_B), eq(CLIENT_ID)))
                .thenReturn(Collections.emptyList());
        when(sessionExtensionRequestRepository.findByTenantIdAndClientIdWithDetails(
                eq(TENANT_B), eq(CLIENT_ID)))
                .thenReturn(Collections.emptyList());
        ClientPackagePaymentHistoryResponse otherTenant =
                service.getPackagePaymentHistory(CLIENT_ID, null);
        assertThat(otherTenant.getItems()).isEmpty();
        assertThat(otherTenant.getSummary().getItemCount()).isZero();
    }

    private static User user(Long id, String name) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        return user;
    }

    private static ConsultantClientMapping mapping(
            Long id,
            User client,
            User consultant,
            ConsultantClientMapping.MappingStatus status,
            String packageName,
            int totalSessions,
            int remainingSessions,
            long packagePrice,
            LocalDateTime paymentDate,
            String notes) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setClient(client);
        mapping.setConsultant(consultant);
        mapping.setStatus(status);
        mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
        mapping.setPackageName(packageName);
        mapping.setTotalSessions(totalSessions);
        mapping.setRemainingSessions(remainingSessions);
        mapping.setUsedSessions(totalSessions - remainingSessions);
        mapping.setPackagePrice(packagePrice);
        mapping.setPaymentAmount(packagePrice);
        mapping.setPaymentDate(paymentDate);
        mapping.setPaymentMethod("BANK_TRANSFER");
        mapping.setPaymentReference("REF-" + id);
        mapping.setNotes(notes);
        mapping.setStartDate(paymentDate);
        mapping.setCreatedAt(paymentDate);
        mapping.setUpdatedAt(paymentDate);
        return mapping;
    }
}
