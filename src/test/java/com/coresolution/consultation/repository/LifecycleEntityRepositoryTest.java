package com.coresolution.consultation.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.CompensationType;
import com.coresolution.consultation.constant.DestructionType;
import com.coresolution.consultation.constant.LegalBasis;
import com.coresolution.consultation.constant.MappingHistoryEventType;
import com.coresolution.consultation.constant.NotificationType;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.ClientSatisfactionSurvey;
import com.coresolution.consultation.entity.ConsultantClientMappingHistory;
import com.coresolution.consultation.entity.Notification;
import com.coresolution.consultation.entity.PersonalDataDestructionLog;
import com.coresolution.consultation.entity.SessionCompensationHistory;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * W1 P0 신규 6 entity 의 JPA 매핑 + tenant 격리 회귀.
 *
 * <p>각 repository 에 대해 save→findById→tenant 필터링이 1차 매트릭스로 검증되며,
 * enum 타입 컬럼은 {@code @Enumerated(EnumType.STRING)} 매핑이 정상 적재되는지를
 * 함께 확인한다. Spring Boot test 컨텍스트가 부팅되므로 Hibernate 가 V20260604_001
 * 의 컬럼 정의 (BIGINT/JSON/DECIMAL) 와 자바 필드를 정합 매핑할 수 있어야 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@Transactional
@ActiveProfiles("test")
@DisplayName("Lifecycle 6 entity Repository 회귀")
class LifecycleEntityRepositoryTest {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PersonalDataDestructionLogRepository destructionLogRepository;

    @Autowired
    private ConsultantClientMappingHistoryRepository mappingHistoryRepository;

    @Autowired
    private SessionCompensationHistoryRepository compensationHistoryRepository;

    @Autowired
    private ClientSatisfactionSurveyRepository satisfactionSurveyRepository;

    @Nested
    @DisplayName("AuditLog")
    class AuditLogTests {
        @Test
        @DisplayName("save + findById + tenant 필터링 + enum 적재")
        void save_find_tenant_filter() {
            String tenantA = UUID.randomUUID().toString();
            String tenantB = UUID.randomUUID().toString();
            Long targetUserId = 1001L;

            AuditLog saved = auditLogRepository.save(AuditLog.builder()
                    .tenantId(tenantA)
                    .actorUserId(2002L)
                    .actorRole("ADMIN")
                    .targetUserId(targetUserId)
                    .action(AuditAction.USER_ANONYMIZE)
                    .entityType("USER")
                    .entityId(targetUserId)
                    .ipAddress("127.0.0.1")
                    .build());

            auditLogRepository.save(AuditLog.builder()
                    .tenantId(tenantB)
                    .action(AuditAction.USER_HARD_DELETE)
                    .targetUserId(targetUserId)
                    .build());

            AuditLog found = auditLogRepository.findById(saved.getId()).orElseThrow();
            assertThat(found.getAction()).isEqualTo(AuditAction.USER_ANONYMIZE);
            assertThat(found.getTenantId()).isEqualTo(tenantA);

            assertThat(auditLogRepository.findByTenantIdAndTargetUserIdOrderByCreatedAtDesc(tenantA, targetUserId))
                    .extracting(AuditLog::getAction)
                    .containsExactly(AuditAction.USER_ANONYMIZE);
        }
    }

    @Nested
    @DisplayName("Notification")
    class NotificationTests {
        @Test
        @DisplayName("save + soft-delete 가드 + countUnread 쿼리")
        void save_softdelete_unread() {
            String tenantA = UUID.randomUUID().toString();
            Long recipient = 3003L;

            Notification active = notificationRepository.save(Notification.builder()
                    .tenantId(tenantA)
                    .recipientUserId(recipient)
                    .notificationType(NotificationType.WITHDRAWAL)
                    .title("Test withdrawal notification")
                    .build());

            Notification deleted = notificationRepository.save(Notification.builder()
                    .tenantId(tenantA)
                    .recipientUserId(recipient)
                    .notificationType(NotificationType.SYSTEM)
                    .title("Soft deleted")
                    .build());
            deleted.softDelete();
            notificationRepository.save(deleted);

            assertThat(notificationRepository.findById(active.getId()))
                    .isPresent()
                    .get()
                    .extracting(Notification::getNotificationType)
                    .isEqualTo(NotificationType.WITHDRAWAL);

            long unread = notificationRepository.countUnreadByTenantIdAndRecipient(tenantA, recipient);
            assertThat(unread)
                    .as("PENDING 상태 + soft-deleted 제외 카운트")
                    .isEqualTo(1L);

            assertThat(notificationRepository.findActiveByTenantIdAndRecipient(tenantA, recipient, PageRequest.of(0, 10)))
                    .extracting(Notification::getTitle)
                    .containsExactly("Test withdrawal notification");
        }
    }

    @Nested
    @DisplayName("PersonalDataDestructionLog")
    class DestructionLogTests {
        @Test
        @DisplayName("save + recovery-window + enum 적재")
        void save_recovery_window() {
            String tenantA = UUID.randomUUID().toString();
            Long targetUserId = 4004L;
            LocalDateTime now = LocalDateTime.now();

            PersonalDataDestructionLog saved = destructionLogRepository.save(
                    PersonalDataDestructionLog.builder()
                            .tenantId(tenantA)
                            .targetUserId(targetUserId)
                            .destructionType(DestructionType.ANONYMIZE)
                            .piiColumnsAffected("[\"email\",\"name\"]")
                            .legalBasis(LegalBasis.PIPA_39_7)
                            .executedAt(now)
                            .recoveryWindowUntil(now.plusDays(7))
                            .build());

            PersonalDataDestructionLog found = destructionLogRepository.findById(saved.getId()).orElseThrow();
            assertThat(found.getDestructionType()).isEqualTo(DestructionType.ANONYMIZE);
            assertThat(found.getLegalBasis()).isEqualTo(LegalBasis.PIPA_39_7);
            assertThat(found.isRecoverable(now.plusDays(1))).isTrue();
            assertThat(found.isRecoverable(now.plusDays(10))).isFalse();

            assertThat(destructionLogRepository.findByTenantIdAndTargetUserIdOrderByExecutedAtDesc(tenantA, targetUserId))
                    .hasSize(1);
        }
    }

    @Nested
    @DisplayName("ConsultantClientMappingHistory")
    class MappingHistoryTests {
        @Test
        @DisplayName("save + tenant 격리 + event_type enum 적재")
        void save_tenant_filter() {
            String tenantA = UUID.randomUUID().toString();
            String tenantB = UUID.randomUUID().toString();
            Long mappingId = 5005L;

            mappingHistoryRepository.save(ConsultantClientMappingHistory.builder()
                    .tenantId(tenantA)
                    .mappingId(mappingId)
                    .clientId(101L)
                    .consultantId(201L)
                    .eventType(MappingHistoryEventType.CREATED)
                    .reason("Initial mapping")
                    .build());

            mappingHistoryRepository.save(ConsultantClientMappingHistory.builder()
                    .tenantId(tenantB)
                    .mappingId(mappingId)
                    .eventType(MappingHistoryEventType.TERMINATED)
                    .build());

            assertThat(mappingHistoryRepository
                    .findByTenantIdAndMappingIdOrderByCreatedAtDesc(tenantA, mappingId, PageRequest.of(0, 10))
                    .getContent())
                    .extracting(ConsultantClientMappingHistory::getEventType)
                    .containsExactly(MappingHistoryEventType.CREATED);
        }
    }

    @Nested
    @DisplayName("SessionCompensationHistory")
    class CompensationHistoryTests {
        @Test
        @DisplayName("save + session_delta DECIMAL(5,2) + compensation_type enum")
        void save_decimal_session_delta() {
            String tenantA = UUID.randomUUID().toString();
            Long mappingId = 6006L;

            SessionCompensationHistory saved = compensationHistoryRepository.save(
                    SessionCompensationHistory.builder()
                            .tenantId(tenantA)
                            .mappingId(mappingId)
                            .clientId(102L)
                            .consultantId(202L)
                            .compensationType(CompensationType.NO_SHOW_COMP)
                            .sessionDelta(new BigDecimal("0.50"))
                            .beforeRemainingSessions(10)
                            .afterRemainingSessions(10)
                            .reason("No-show compensation")
                            .build());

            SessionCompensationHistory found = compensationHistoryRepository.findById(saved.getId()).orElseThrow();
            assertThat(found.getCompensationType()).isEqualTo(CompensationType.NO_SHOW_COMP);
            assertThat(found.getSessionDelta()).isEqualByComparingTo("0.50");

            assertThat(compensationHistoryRepository
                    .findByTenantIdAndMappingIdOrderByCreatedAtDesc(tenantA, mappingId, PageRequest.of(0, 10))
                    .getContent())
                    .hasSize(1);
        }
    }

    @Nested
    @DisplayName("ClientSatisfactionSurvey")
    class SatisfactionSurveyTests {
        @Test
        @DisplayName("save + soft-delete + 5점 척도 적재")
        void save_softdelete_scores() {
            String tenantA = UUID.randomUUID().toString();
            Long consultantId = 303L;

            ClientSatisfactionSurvey saved = satisfactionSurveyRepository.save(
                    ClientSatisfactionSurvey.builder()
                            .tenantId(tenantA)
                            .clientId(103L)
                            .consultantId(consultantId)
                            .mappingId(7007L)
                            .overallRating((short) 5)
                            .professionalismRating((short) 5)
                            .empathyRating((short) 4)
                            .recommendationRating((short) 5)
                            .isAnonymous(false)
                            .build());

            ClientSatisfactionSurvey found = satisfactionSurveyRepository.findById(saved.getId()).orElseThrow();
            assertThat(found.getOverallRating()).isEqualTo((short) 5);
            assertThat(found.getIsDeleted()).isFalse();

            found.softDelete();
            satisfactionSurveyRepository.save(found);

            ClientSatisfactionSurvey afterDelete =
                    satisfactionSurveyRepository.findById(saved.getId()).orElseThrow();
            assertThat(afterDelete.getIsDeleted()).isTrue();
            assertThat(afterDelete.getDeletedAt()).isNotNull();
        }
    }
}
