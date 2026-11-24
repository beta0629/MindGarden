package com.coresolution.consultation.sct.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.UUID;
import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.AuditLogRepository;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.service.SctClinicalAccessDeniedAuditWriter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * STAFF 임상 403 감사가 외부 트랜잭션 롤백 후에도 커밋되는지(REQUIRES_NEW) 회귀.
 *
 * @author MindGarden
 * @since 2026-11-24
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@DisplayName("SCT clinical access denied audit REQUIRES_NEW")
class SctClinicalAccessDeniedAuditRequiresNewTest {

    @Autowired
    private SctClinicalAccessDeniedAuditWriter clinicalAccessDeniedAuditWriter;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Test
    @DisplayName("외부 TX rollbackOnly 후에도 SCT_CLINICAL_ACCESS_DENIED 행이 남는다")
    void auditSurvivesOuterTransactionRollback() {
        String tenantId = "sct-audit-" + UUID.randomUUID();
        User staff = new User();
        staff.setId(902L);
        staff.setRole(UserRole.STAFF);

        SctInvitation invitation = SctInvitation.builder()
                .formTemplateId(1L)
                .clientId(501L)
                .managementNo("SCT-AUDIT-1")
                .tokenHash("a".repeat(64))
                .status("SUBMITTED")
                .sentByUserId(1L)
                .verifyFailCount(0)
                .build();
        invitation.setId(7701L);
        invitation.setTenantId(tenantId);

        TransactionTemplate outer = new TransactionTemplate(transactionManager);
        outer.executeWithoutResult(status -> {
            clinicalAccessDeniedAuditWriter.record(tenantId, staff, invitation);
            status.setRollbackOnly();
        });

        List<AuditLog> rows = auditLogRepository.findByTenantIdAndActionAndEntityType(
                tenantId, AuditAction.SCT_CLINICAL_ACCESS_DENIED, SctConstants.ENTITY_TYPE_INVITATION);
        assertThat(rows).isNotEmpty();
        assertThat(rows.get(0).getEntityId()).isEqualTo(7701L);
        assertThat(rows.get(0).getActorUserId()).isEqualTo(902L);
    }
}
