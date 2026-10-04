package com.coresolution.consultation.service.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.consultation.ConsultationRecordAccessAudit;
import com.coresolution.consultation.entity.ClinicalReport;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.InstitutionLinkConsultationLog;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.repository.ClinicalReportRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.InstitutionLinkConsultationLogRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.access.AccessDeniedException;

/**
 * {@link ConsultationRecordAccessGuard} 단건 읽기·쓰기(작성·수정) 권한 매트릭스.
 *
 * <p>정책: 작성 상담사 본인 + 같은 테넌트 관리자 계열만 허용. 다른 상담사·내담자·다른 테넌트는 403,
 * 미인증 401. 감사 기록에는 본문이 들어가지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@DisplayName("상담일지 단일 판정 가드 — 단건 읽기 권한 매트릭스")
class ConsultationRecordAccessGuardTest {

    private static final String TENANT_A = "tenant-guard-a";
    private static final String TENANT_B = "tenant-guard-b";
    private static final long AUTHOR = 22L;
    private static final long OTHER_CONSULTANT = 3L;
    private static final long CLIENT = 20L;
    private static final long ADMIN = 1L;
    private static final long STAFF = 2L;
    private static final long RECORD_ID = 9001L;
    private static final long REPORT_ID = 7001L;
    private static final long LINK_LOG_ID = 8001L;
    private static final String BODY_TEXT = "본문 유출 감지 문구";
    /** 담당 상담사가 OTHER_CONSULTANT 인 일정 (작성 판정용). */
    private static final long SCHEDULE_ID = 502L;

    private ConsultationRecordAccessLogService accessLogService;
    private ConsultationRecordAccessGuard guard;
    private ScheduleRepository scheduleRepository;

    @BeforeEach
    void setUp() {
        TenantContextHolder.clear();
        accessLogService = mock(ConsultationRecordAccessLogService.class);
        ConsultationRecordRepository recordRepository = mock(ConsultationRecordRepository.class);
        ClinicalReportRepository reportRepository = mock(ClinicalReportRepository.class);
        InstitutionLinkConsultationLogRepository linkRepository = mock(InstitutionLinkConsultationLogRepository.class);
        ClientPathAccessGuard clientGuard = new ClientPathAccessGuard(
            mock(ConsultantClientMappingRepository.class), mock(UserRepository.class));
        scheduleRepository = mock(ScheduleRepository.class);
        guard = new ConsultationRecordAccessGuard(clientGuard, reportRepository, accessLogService,
            recordRepository, linkRepository, scheduleRepository);

        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setTenantId(TENANT_A);
        schedule.setConsultantId(OTHER_CONSULTANT);
        schedule.setClientId(CLIENT);
        schedule.setIsDeleted(false);
        when(scheduleRepository.findByTenantIdAndId(TENANT_A, SCHEDULE_ID)).thenReturn(Optional.of(schedule));
        when(scheduleRepository.findByTenantIdAndId(TENANT_B, SCHEDULE_ID)).thenReturn(Optional.empty());

        ConsultationRecord record = new ConsultationRecord();
        record.setId(RECORD_ID);
        record.setTenantId(TENANT_A);
        record.setConsultantId(AUTHOR);
        record.setClientId(CLIENT);
        record.setIsDeleted(false);
        record.setMainIssues(BODY_TEXT);
        when(recordRepository.findByTenantIdAndId(TENANT_A, RECORD_ID)).thenReturn(Optional.of(record));
        when(recordRepository.findByTenantIdAndId(TENANT_B, RECORD_ID)).thenReturn(Optional.empty());

        ClinicalReport report = new ClinicalReport();
        report.setConsultationRecordId(RECORD_ID);
        when(reportRepository.findByIdAndIsDeletedFalse(REPORT_ID)).thenReturn(Optional.of(report));

        InstitutionLinkConsultationLog linkLog = new InstitutionLinkConsultationLog();
        linkLog.setId(LINK_LOG_ID);
        linkLog.setTenantId(TENANT_A);
        linkLog.setConsultantId(AUTHOR);
        linkLog.setClientId(CLIENT);
        when(linkRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_A, LINK_LOG_ID))
            .thenReturn(Optional.of(linkLog));

        when(accessLogService.buildCommand(any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenAnswer(invocation -> {
                User caller = invocation.getArgument(0);
                return new ConsultationRecordAccessLogService.ConsultationRecordAccessCommand(
                    invocation.getArgument(1), invocation.getArgument(3), invocation.getArgument(2),
                    invocation.getArgument(4), invocation.getArgument(5),
                    caller == null ? null : caller.getId(),
                    caller == null || caller.getRole() == null ? null : caller.getRole().name(),
                    invocation.getArgument(6), invocation.getArgument(7), invocation.getArgument(8),
                    null, null);
            });
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("작성 상담사 — 허용")
    void author_allowed() {
        assertThat(guard.requireReadAccess(session(AUTHOR, UserRole.CONSULTANT, TENANT_A), RECORD_ID).getId())
            .isEqualTo(RECORD_ID);
    }

    @Test
    @DisplayName("같은 테넌트 ADMIN·STAFF — 허용")
    void sameTenantManagers_allowed() {
        assertThat(guard.requireReadAccess(session(ADMIN, UserRole.ADMIN, TENANT_A), RECORD_ID)).isNotNull();
        assertThat(guard.requireReadAccess(session(STAFF, UserRole.STAFF, TENANT_A), RECORD_ID)).isNotNull();
    }

    @Test
    @DisplayName("다른 상담사 — 403")
    void otherConsultant_denied() {
        assertThatThrownBy(() -> guard.requireReadAccess(
            session(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A), RECORD_ID))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("내담자(일지 대상 본인 포함) — 403")
    void client_denied() {
        assertThatThrownBy(() -> guard.requireReadAccess(session(CLIENT, UserRole.CLIENT, TENANT_A), RECORD_ID))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("다른 테넌트 관리자 — 403 (존재 여부 비노출)")
    void otherTenantAdmin_denied() {
        assertThatThrownBy(() -> guard.requireReadAccess(session(ADMIN, UserRole.ADMIN, TENANT_B), RECORD_ID))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("미인증 — 401")
    void anonymous_unauthorized() {
        assertThatThrownBy(() -> guard.requireReadAccess(new MockHttpSession(), RECORD_ID))
            .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("임상 리포트 — 원본 일지 규칙 동일 (작성자·관리자 허용, 다른 상담사 403)")
    void clinicalReport_followsRecordRule() {
        guard.requireClinicalReportAccess(session(AUTHOR, UserRole.CONSULTANT, TENANT_A), REPORT_ID);
        guard.requireClinicalReportAccess(session(ADMIN, UserRole.ADMIN, TENANT_A), REPORT_ID);
        assertThatThrownBy(() -> guard.requireClinicalReportAccess(
            session(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A), REPORT_ID))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("타기관 연계 일지 — 같은 규칙 (작성자·관리자 허용, 다른 상담사·내담자 403)")
    void institutionLinkLog_followsSameRule() {
        assertThat(guard.requireInstitutionLinkLogReadAccess(
            session(AUTHOR, UserRole.CONSULTANT, TENANT_A), LINK_LOG_ID)).isNotNull();
        assertThat(guard.requireInstitutionLinkLogReadAccess(
            session(ADMIN, UserRole.ADMIN, TENANT_A), LINK_LOG_ID)).isNotNull();
        assertThatThrownBy(() -> guard.requireInstitutionLinkLogReadAccess(
            session(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A), LINK_LOG_ID))
            .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> guard.requireInstitutionLinkLogReadAccess(
            session(CLIENT, UserRole.CLIENT, TENANT_A), LINK_LOG_ID))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("감사 기록 — 허용·거부 모두 남고, 어떤 필드에도 본문이 없다")
    void audit_hasNoBody() {
        guard.requireReadAccess(session(ADMIN, UserRole.ADMIN, TENANT_A), RECORD_ID);
        assertThatThrownBy(() -> guard.requireReadAccess(
            session(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A), RECORD_ID))
            .isInstanceOf(AccessDeniedException.class);

        ArgumentCaptor<ConsultationRecordAccessLogService.ConsultationRecordAccessCommand> captor =
            ArgumentCaptor.forClass(ConsultationRecordAccessLogService.ConsultationRecordAccessCommand.class);
        verify(accessLogService, atLeastOnce()).record(captor.capture());
        assertThat(captor.getAllValues())
            .anyMatch(c -> ConsultationRecordAccessAudit.RESULT_ALLOWED.equals(c.result())
                && Long.valueOf(ADMIN).equals(c.actorId())
                && ConsultationRecordAccessAudit.ACTION_VIEW.equals(c.action()))
            .anyMatch(c -> ConsultationRecordAccessAudit.RESULT_DENIED.equals(c.result())
                && Long.valueOf(OTHER_CONSULTANT).equals(c.actorId()));
        assertThat(captor.getAllValues()).allSatisfy(c -> assertThat(c.toString()).doesNotContain(BODY_TEXT));
    }

    // ---- 쓰기(수정) ----

    @Test
    @DisplayName("수정 — 작성 상담사·같은 테넌트 ADMIN·STAFF 허용, 작성자 정보가 판정 대상 일지에 묶인다")
    void write_authorAndManagers_allowed() {
        ConsultationRecordWriter author = guard.requireWriteAccess(
            session(AUTHOR, UserRole.CONSULTANT, TENANT_A), RECORD_ID);
        assertThat(author.userId()).isEqualTo(AUTHOR);
        assertThat(author.tenantManager()).isFalse();
        assertThat(author.matchesRecord(RECORD_ID)).isTrue();

        ConsultationRecordWriter admin = guard.requireWriteAccess(session(ADMIN, UserRole.ADMIN, TENANT_A), RECORD_ID);
        assertThat(admin.userId()).isEqualTo(ADMIN);
        assertThat(admin.role()).isEqualTo(UserRole.ADMIN.name());
        assertThat(admin.tenantManager()).isTrue();
        assertThat(guard.requireWriteAccess(session(STAFF, UserRole.STAFF, TENANT_A), RECORD_ID).tenantManager())
            .isTrue();
    }

    @Test
    @DisplayName("수정 — 다른 상담사·내담자·다른 테넌트 관리자 403, 미인증 401")
    void write_denied() {
        assertThatThrownBy(() -> guard.requireWriteAccess(
            session(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A), RECORD_ID))
            .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> guard.requireWriteAccess(session(CLIENT, UserRole.CLIENT, TENANT_A), RECORD_ID))
            .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> guard.requireWriteAccess(session(ADMIN, UserRole.ADMIN, TENANT_B), RECORD_ID))
            .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> guard.requireWriteAccess(new MockHttpSession(), RECORD_ID))
            .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("canWrite 는 canRead 와 같은 규칙이다")
    void canWrite_sameAsCanRead() {
        User admin = user(ADMIN, UserRole.ADMIN, TENANT_A);
        User other = user(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A);
        assertThat(guard.canWrite(admin, TENANT_A, TENANT_A, AUTHOR)).isTrue();
        assertThat(guard.canWrite(other, TENANT_A, TENANT_A, AUTHOR)).isFalse();
        assertThat(guard.canWrite(admin, TENANT_A, TENANT_B, AUTHOR)).isFalse();
    }

    // ---- 쓰기(작성) ----

    @Test
    @DisplayName("작성 — 일정 담당 상담사·같은 테넌트 관리자 허용, 판정 대상 일정에 묶인다")
    void create_assigneeAndManagers_allowed() {
        ConsultationRecordWriter assignee = guard.requireCreateAccess(
            session(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A), SCHEDULE_ID);
        assertThat(assignee.matchesSchedule(SCHEDULE_ID)).isTrue();
        assertThat(assignee.tenantManager()).isFalse();

        ConsultationRecordWriter admin = guard.requireCreateAccess(
            session(ADMIN, UserRole.ADMIN, TENANT_A), SCHEDULE_ID);
        assertThat(admin.userId()).isEqualTo(ADMIN);
        assertThat(admin.tenantManager()).isTrue();
        assertThat(admin.matchesSchedule(SCHEDULE_ID)).isTrue();
        assertThat(admin.matchesSchedule(SCHEDULE_ID + 1)).isFalse();
    }

    @Test
    @DisplayName("작성 — 담당 아닌 상담사(과거 작성자 포함)·내담자·다른 테넌트 관리자 403, 미인증 401, 일정 없음 403")
    void create_denied() {
        assertThatThrownBy(() -> guard.requireCreateAccess(
            session(AUTHOR, UserRole.CONSULTANT, TENANT_A), SCHEDULE_ID))
            .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> guard.requireCreateAccess(session(CLIENT, UserRole.CLIENT, TENANT_A), SCHEDULE_ID))
            .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> guard.requireCreateAccess(session(ADMIN, UserRole.ADMIN, TENANT_B), SCHEDULE_ID))
            .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> guard.requireCreateAccess(new MockHttpSession(), SCHEDULE_ID))
            .isInstanceOf(UnauthorizedException.class);
        assertThatThrownBy(() -> guard.requireCreateAccess(session(ADMIN, UserRole.ADMIN, TENANT_A), null))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("작성·수정 판정도 감사 로그(CREATE·EDIT)를 남긴다")
    void write_isAudited() {
        guard.requireCreateAccess(session(ADMIN, UserRole.ADMIN, TENANT_A), SCHEDULE_ID);
        guard.requireWriteAccess(session(ADMIN, UserRole.ADMIN, TENANT_A), RECORD_ID);
        ArgumentCaptor<ConsultationRecordAccessLogService.ConsultationRecordAccessCommand> captor =
            ArgumentCaptor.forClass(ConsultationRecordAccessLogService.ConsultationRecordAccessCommand.class);
        verify(accessLogService, atLeastOnce()).record(captor.capture());
        assertThat(captor.getAllValues())
            .anyMatch(c -> ConsultationRecordAccessAudit.ACTION_CREATE.equals(c.action())
                && ConsultationRecordAccessAudit.RESULT_ALLOWED.equals(c.result()))
            .anyMatch(c -> ConsultationRecordAccessAudit.ACTION_EDIT.equals(c.action())
                && ConsultationRecordAccessAudit.RESULT_ALLOWED.equals(c.result()));
        assertThat(captor.getAllValues()).allSatisfy(c -> assertThat(c.toString()).doesNotContain(BODY_TEXT));
    }

    private static User user(long id, UserRole role, String tenantId) {
        User u = new User();
        u.setId(id);
        u.setUserId("u-" + id);
        u.setRole(role);
        u.setTenantId(tenantId);
        return u;
    }

    private static MockHttpSession session(long id, UserRole role, String tenantId) {
        User u = new User();
        u.setId(id);
        u.setUserId("u-" + id);
        u.setRole(role);
        u.setTenantId(tenantId);
        MockHttpSession s = new MockHttpSession();
        s.setAttribute(SessionConstants.USER_OBJECT, u);
        s.setAttribute(SessionConstants.TENANT_ID, tenantId);
        return s;
    }
}
