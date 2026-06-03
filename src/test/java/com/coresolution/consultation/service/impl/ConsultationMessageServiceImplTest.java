package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;

import com.coresolution.consultation.constant.AlertType;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultationMessage;
import com.coresolution.consultation.repository.ConsultationMessageRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

/**
 * {@link ConsultationMessageServiceImpl#markAllAsRead(Long)} 단위 검증.
 * 운영 핫픽스 (2026-05-23) — GNB "모두 읽음" 상위 LIST_SIZE 건 한계 해소.
 *
 * <p>Repository UPDATE 쿼리 정의 자체가 다음을 보장합니다:
 * <ul>
 *   <li>{@code receiverId} = currentUser.id 인 행만 대상 (다른 receiver 영향 없음)</li>
 *   <li>{@code tenantId} = 현재 컨텍스트 (다른 tenant 영향 없음)</li>
 *   <li>{@code isDeleted = false} (삭제 메시지 제외)</li>
 *   <li>{@code isRead = false} (이미 읽음 메시지 제외 → 재마킹 없음)</li>
 * </ul>
 * 본 단위 테스트는 service 가 Repository 에 정확한 파라미터를 전달하고
 * 결과를 그대로 반환하는지 검증합니다. (DML 쿼리 자체 의미 검증은 통합 테스트 책임)
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConsultationMessageServiceImpl#markAllAsRead 단위 테스트")
class ConsultationMessageServiceImplTest {

    private static final String TENANT_ID = "tenant-incheon-counseling-001";
    private static final String OTHER_TENANT_ID = "tenant-other-002";
    private static final Long RECEIVER_ID = 3L;
    private static final Long OTHER_RECEIVER_ID = 99L;

    @Mock
    private ConsultationMessageRepository consultationMessageRepository;

    @Mock
    private TenantAccessControlService accessControlService;

    @InjectMocks
    private ConsultationMessageServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("markAllAsRead — tenantId 컨텍스트와 receiverId 로 Repository 1회 호출 + 결과 반환")
    void markAllAsRead_receiver본인_만업데이트_그리고_tenant격리() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(consultationMessageRepository
                .markAllAsReadByTenantIdAndReceiverId(eq(TENANT_ID), eq(RECEIVER_ID), any(LocalDateTime.class)))
            .thenReturn(263);

        int updated = service.markAllAsRead(RECEIVER_ID);

        assertThat(updated).isEqualTo(263);
        verify(consultationMessageRepository)
            .markAllAsReadByTenantIdAndReceiverId(eq(TENANT_ID), eq(RECEIVER_ID), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("markAllAsRead — 다른 receiverId 로 호출 시 해당 receiver 만 파라미터로 전달")
    void markAllAsRead_다른receiver_파라미터격리() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(consultationMessageRepository
                .markAllAsReadByTenantIdAndReceiverId(eq(TENANT_ID), eq(OTHER_RECEIVER_ID), any(LocalDateTime.class)))
            .thenReturn(0);

        int updated = service.markAllAsRead(OTHER_RECEIVER_ID);

        assertThat(updated).isZero();
        verify(consultationMessageRepository)
            .markAllAsReadByTenantIdAndReceiverId(eq(TENANT_ID), eq(OTHER_RECEIVER_ID), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("markAllAsRead — 다른 tenantId 컨텍스트 시 해당 tenant 만 파라미터로 전달 (테넌트 격리)")
    void markAllAsRead_tenant격리() {
        TenantContextHolder.setTenantId(OTHER_TENANT_ID);
        when(consultationMessageRepository
                .markAllAsReadByTenantIdAndReceiverId(eq(OTHER_TENANT_ID), eq(RECEIVER_ID), any(LocalDateTime.class)))
            .thenReturn(5);

        int updated = service.markAllAsRead(RECEIVER_ID);

        assertThat(updated).isEqualTo(5);
        verify(consultationMessageRepository)
            .markAllAsReadByTenantIdAndReceiverId(eq(OTHER_TENANT_ID), eq(RECEIVER_ID), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("markAllAsRead — 미읽음 0건이어도 정상 0 반환 (예외 없음)")
    void markAllAsRead_0건() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(consultationMessageRepository
                .markAllAsReadByTenantIdAndReceiverId(eq(TENANT_ID), eq(RECEIVER_ID), any(LocalDateTime.class)))
            .thenReturn(0);

        int updated = service.markAllAsRead(RECEIVER_ID);

        assertThat(updated).isZero();
        verify(consultationMessageRepository)
            .markAllAsReadByTenantIdAndReceiverId(eq(TENANT_ID), eq(RECEIVER_ID), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("markAllAsRead — tenantId 컨텍스트 미설정 시 예외 (TenantContextHolder.getRequiredTenantId 차단)")
    void markAllAsRead_tenant미설정_예외() {
        TenantContextHolder.clear();

        assertThatThrownBy(() -> service.markAllAsRead(RECEIVER_ID))
            .isInstanceOf(IllegalStateException.class);
    }

    // =========================================================================
    // P0 보안·역할 분리(2026-06-03): 결제 금액 노출 차단 회귀 가드
    // =========================================================================

    private static final Long CONSULTANT_THREAD_ID = 11L;
    private static final Long CLIENT_THREAD_ID = 22L;

    @Test
    @DisplayName("sendSystemThreadMessage — senderType=SYSTEM·senderId=0·receiverId=client 로 저장")
    void sendSystemThreadMessage_savesAsSystemSenderClientReceiver() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(consultationMessageRepository.save(any(ConsultationMessage.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.sendSystemThreadMessage(
                CONSULTANT_THREAD_ID,
                CLIENT_THREAD_ID,
                CLIENT_THREAD_ID,
                null,
                "결제 완료",
                "💰 금액: 100000원",
                "PAYMENT_COMPLETION",
                false,
                false);

        ArgumentCaptor<ConsultationMessage> captor = ArgumentCaptor.forClass(ConsultationMessage.class);
        verify(consultationMessageRepository).save(captor.capture());
        ConsultationMessage saved = captor.getValue();
        assertThat(saved.getSenderType()).isEqualTo(AlertType.SYSTEM);
        assertThat(saved.getSenderId()).isZero();
        assertThat(saved.getReceiverId()).isEqualTo(CLIENT_THREAD_ID);
        assertThat(saved.getConsultantId()).isEqualTo(CONSULTANT_THREAD_ID);
        assertThat(saved.getClientId()).isEqualTo(CLIENT_THREAD_ID);
        assertThat(saved.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(saved.getStatus()).isEqualTo("SENT");
    }

    @Test
    @DisplayName("sendMessage(senderType=SYSTEM) — sendSystemThreadMessage 로 우회되어 동일하게 저장")
    void sendMessage_systemSenderType_isRoutedToSystemThreadHelper() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(consultationMessageRepository.save(any(ConsultationMessage.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.sendMessage(
                CONSULTANT_THREAD_ID,
                CLIENT_THREAD_ID,
                null,
                AlertType.SYSTEM,
                "입금 확인",
                "패키지: 10회\n금액: 500000원",
                "PAYMENT_COMPLETION",
                false,
                false);

        ArgumentCaptor<ConsultationMessage> captor = ArgumentCaptor.forClass(ConsultationMessage.class);
        verify(consultationMessageRepository).save(captor.capture());
        ConsultationMessage saved = captor.getValue();
        assertThat(saved.getSenderType()).isEqualTo(AlertType.SYSTEM);
        assertThat(saved.getSenderId()).isZero();
        assertThat(saved.getReceiverId()).isEqualTo(CLIENT_THREAD_ID);
        assertThat(saved.getConsultantId()).isEqualTo(CONSULTANT_THREAD_ID);
    }

    @Test
    @DisplayName("searchMessages(userType=CONSULTANT) — 상담사 전용 쿼리에 senderType<>'SYSTEM' OR receiverId=consultantId 방어 필터 위임")
    void searchMessages_consultant_delegatesToConsultantSpecificQuery() {
        TenantContextHolder.setTenantId(TENANT_ID);
        // 상담사 검색 쿼리(@Query) 에 P0 방어 필터가 적용되어 있어, repository 메서드만 호출되면
        // SYSTEM 발화·내담자 단독 수신 메시지는 결과에서 제외된다. (필터 JPQL 자체 의미는 통합 테스트 책임)
        Pageable pageable = Pageable.ofSize(20);
        Page<ConsultationMessage> emptyPage = new PageImpl<>(List.of());
        when(consultationMessageRepository
                .findByTenantIdAndConsultantIdAndTitleContainingOrContentContainingAndMessageTypeAndIsImportantAndIsUrgent(
                        eq(TENANT_ID), eq(CONSULTANT_THREAD_ID), eq("결제"),
                        eq(null), eq(null), eq(null), eq(pageable)))
                .thenReturn(emptyPage);

        Page<ConsultationMessage> result = service.searchMessages(
                CONSULTANT_THREAD_ID, UserRole.CONSULTANT.name(), "결제", null, null, null, pageable);

        assertThat(result.getContent()).isEmpty();
        verify(consultationMessageRepository)
                .findByTenantIdAndConsultantIdAndTitleContainingOrContentContainingAndMessageTypeAndIsImportantAndIsUrgent(
                        eq(TENANT_ID), eq(CONSULTANT_THREAD_ID), eq("결제"),
                        eq(null), eq(null), eq(null), eq(pageable));
    }
}
