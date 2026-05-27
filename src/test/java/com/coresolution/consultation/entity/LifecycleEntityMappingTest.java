package com.coresolution.consultation.entity;

import java.lang.reflect.Field;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.CompensationType;
import com.coresolution.consultation.constant.DestructionType;
import com.coresolution.consultation.constant.LegalBasis;
import com.coresolution.consultation.constant.MappingHistoryEventType;
import com.coresolution.consultation.constant.NotificationType;

import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * lifecycle audit/destruction 신규 6 entity + PersonalDataAccessLog 의 JPA 매핑 정합 회귀.
 *
 * <p>운영 반영 시 Hibernate 가 V20260604_001/_002 마이그레이션 결과 컬럼과 정확히 매핑되도록
 * entity 필드의 자바 타입·{@code @Column} 컬럼명·{@code @Enumerated(EnumType.STRING)} 어노테이션을
 * 리플렉션으로 검증한다. Spring context 부팅이 필요 없는 순수 단위 테스트.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@DisplayName("V20260604_001/_002 entity 매핑 정합 회귀 (PDAL Long + 신규 6 entity)")
class LifecycleEntityMappingTest {

    @Test
    @DisplayName("PersonalDataAccessLog.targetUserId 는 Long 이며 컬럼 target_user_id 와 매핑된다 (W2 P0)")
    void pdal_targetUserId_isLong() throws Exception {
        Field field = PersonalDataAccessLog.class.getDeclaredField("targetUserId");
        assertThat(field.getType())
                .as("W2 P0: PersonalDataAccessLog.targetUserId 는 Long 으로 정합되어야 한다")
                .isEqualTo(Long.class);
        Column column = field.getAnnotation(Column.class);
        assertThat(column).isNotNull();
        assertThat(column.name()).isEqualTo("target_user_id");
    }

    @Test
    @DisplayName("AuditLog: @Table=audit_logs, action 은 AuditAction enum @Enumerated(STRING)")
    void auditLog_mapping() throws Exception {
        assertThat(AuditLog.class.getAnnotation(Table.class).name()).isEqualTo("audit_logs");
        assertEnumField(AuditLog.class, "action", AuditAction.class, "action");
    }

    @Test
    @DisplayName("Notification: @Table=notifications, notificationType 은 NotificationType enum @Enumerated(STRING)")
    void notification_mapping() throws Exception {
        assertThat(Notification.class.getAnnotation(Table.class).name()).isEqualTo("notifications");
        assertEnumField(Notification.class, "notificationType", NotificationType.class, "notification_type");
    }

    @Test
    @DisplayName("PersonalDataDestructionLog: destructionType=DestructionType, legalBasis=LegalBasis 모두 @Enumerated(STRING)")
    void destructionLog_mapping() throws Exception {
        assertThat(PersonalDataDestructionLog.class.getAnnotation(Table.class).name())
                .isEqualTo("personal_data_destruction_logs");
        assertEnumField(PersonalDataDestructionLog.class, "destructionType",
                DestructionType.class, "destruction_type");
        assertEnumField(PersonalDataDestructionLog.class, "legalBasis",
                LegalBasis.class, "legal_basis");
    }

    @Test
    @DisplayName("ConsultantClientMappingHistory: eventType 은 MappingHistoryEventType enum @Enumerated(STRING)")
    void mappingHistory_mapping() throws Exception {
        assertThat(ConsultantClientMappingHistory.class.getAnnotation(Table.class).name())
                .isEqualTo("consultant_client_mapping_history");
        assertEnumField(ConsultantClientMappingHistory.class, "eventType",
                MappingHistoryEventType.class, "event_type");
    }

    @Test
    @DisplayName("SessionCompensationHistory: compensationType 은 CompensationType enum @Enumerated(STRING)")
    void sessionCompensationHistory_mapping() throws Exception {
        assertThat(SessionCompensationHistory.class.getAnnotation(Table.class).name())
                .isEqualTo("session_compensation_history");
        assertEnumField(SessionCompensationHistory.class, "compensationType",
                CompensationType.class, "compensation_type");
    }

    @Test
    @DisplayName("ClientSatisfactionSurvey: @Table=client_satisfaction_surveys 매핑 정합")
    void clientSatisfactionSurvey_mapping() throws Exception {
        assertThat(ClientSatisfactionSurvey.class.getAnnotation(Table.class).name())
                .isEqualTo("client_satisfaction_surveys");
    }

    /** enum 필드의 자바 타입·컬럼명·@Enumerated(STRING) 매트릭스 검증 헬퍼. */
    private void assertEnumField(
            Class<?> entityClass, String fieldName, Class<?> enumType, String columnName)
            throws NoSuchFieldException {
        Field field = entityClass.getDeclaredField(fieldName);
        assertThat(field.getType())
                .as("%s.%s 는 enum %s 으로 매핑되어야 한다", entityClass.getSimpleName(), fieldName,
                        enumType.getSimpleName())
                .isEqualTo(enumType);
        Enumerated enumerated = field.getAnnotation(Enumerated.class);
        assertThat(enumerated)
                .as("%s.%s 는 @Enumerated 가 필요하다", entityClass.getSimpleName(), fieldName)
                .isNotNull();
        assertThat(enumerated.value())
                .as("%s.%s 는 @Enumerated(EnumType.STRING) 매핑 필수", entityClass.getSimpleName(), fieldName)
                .isEqualTo(EnumType.STRING);
        Column column = field.getAnnotation(Column.class);
        assertThat(column).isNotNull();
        assertThat(column.name()).isEqualTo(columnName);
    }
}
