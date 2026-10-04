package com.coresolution.consultation.service.support;

import java.util.List;
import java.util.Objects;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.consultation.ConsultationRecordAccessAudit;
import com.coresolution.consultation.entity.ClinicalReport;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.InstitutionLinkConsultationLog;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.repository.ClinicalReportRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.InstitutionLinkConsultationLogRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 상담일지 읽기·쓰기 권한 단일 판정 가드.
 *
 * <p>쓰기(2026-10-06): 수정은 {@link #canWrite}(읽기와 같은 규칙), 신규 작성은 {@link #canCreate}
 * (일정 담당 상담사 또는 같은 테넌트 관리자 계열)로 판정한다. 모든 작성·수정 경로는
 * {@link #requireCreateAccess}·{@link #requireWriteAccess} 를 통과한 뒤 저장한다. 삭제 규칙은 바꾸지 않는다.</p>
 *
 * <p>모든 상담일지 읽기 경로(단건·일정 단위 목록·상담사 단위 목록·임상 리포트·타기관 연계 일지)는
 * 이 클래스의 판정 메서드만 호출한다. 판정 규칙은 {@link #canRead(User, String, String, Long)} 하나다.</p>
 * <ul>
 *   <li>허용 — 일지 작성 상담사 본인({@code consultation_records.consultant_id == 로그인 사용자})</li>
 *   <li>허용 — 같은 테넌트 관리자({@link #isRecordBodyManager}: ADMIN). 본문까지 열람한다.</li>
 *   <li>거부(403) — 사무원(STAFF), 다른 상담사(현재 담당 상담사여도 작성자가 아니면 거부), 내담자, 다른 테넌트.
 *       사무원은 누락 알림·일정·목록 메타 등 본문이 없는 경로만 쓴다.</li>
 *   <li>거부(401) — 미인증</li>
 * </ul>
 * <p>요청 파라미터({@code consultantId} 등)와 일정의 현재 담당 상담사는 허용 근거로 쓰지 않는다.
 * 테넌트 안에 일지가 없으면 존재 여부를 드러내지 않도록 403 으로 거부한다. 모든 판정은
 * {@link ConsultationRecordAccessLogService} 로 감사 로그를 남긴다(허용·거부 모두, 본문 미포함).</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@Component
@RequiredArgsConstructor
public class ConsultationRecordAccessGuard {

    /** 테넌트 내 일지 부재·타 테넌트·내담자 등 모든 거부에 공통으로 쓰는 사유 (존재 여부 비노출). */
    public static final String DENIAL_RECORD_UNAVAILABLE = "접근할 수 없는 상담일지입니다.";

    /** 작성 상담사도 같은 테넌트 관리자도 아닌 호출자의 거부 사유. */
    public static final String DENIAL_AUTHOR_ONLY = "본인이 작성한 상담일지만 조회할 수 있습니다.";

    /** 작성 상담사도 같은 테넌트 관리자도 아닌 호출자의 수정 거부 사유. */
    public static final String DENIAL_WRITE_AUTHOR_ONLY = "본인이 작성한 상담일지만 수정할 수 있습니다.";

    /** 일정 담당 상담사도 같은 테넌트 관리자도 아닌 호출자의 작성 거부 사유. */
    public static final String DENIAL_CREATE_ASSIGNEE_ONLY = "담당 일정의 상담일지만 작성할 수 있습니다.";

    private final ClientPathAccessGuard clientPathAccessGuard;
    private final ClinicalReportRepository clinicalReportRepository;
    private final ConsultationRecordAccessLogService consultationRecordAccessLogService;
    private final ConsultationRecordRepository consultationRecordRepository;
    private final InstitutionLinkConsultationLogRepository institutionLinkConsultationLogRepository;
    private final ScheduleRepository scheduleRepository;

    /**
     * 상담일지 읽기 허용 여부 — 모든 읽기 경로가 공유하는 유일한 판정 규칙.
     *
     * @param caller             세션 사용자
     * @param callerTenantId     세션 사용자 테넌트 ID
     * @param recordTenantId     일지 테넌트 ID
     * @param authorConsultantId 일지 작성 상담사 ID ({@code consultation_records.consultant_id})
     * @return 작성 상담사 본인이거나 같은 테넌트 관리자 계열이면 {@code true}
     */
    public boolean canRead(User caller, String callerTenantId, String recordTenantId, Long authorConsultantId) {
        if (caller == null || callerTenantId == null || !Objects.equals(callerTenantId, recordTenantId)) {
            return false;
        }
        return isAuthor(caller, authorConsultantId) || isRecordBodyManager(caller);
    }

    /**
     * 상담일지 수정 허용 여부 — 모든 수정 경로가 공유하는 판정 규칙. 읽기 규칙({@link #canRead})과 같다.
     *
     * @param caller             세션 사용자
     * @param callerTenantId     세션 사용자 테넌트 ID
     * @param recordTenantId     일지 테넌트 ID
     * @param authorConsultantId 일지 작성 상담사 ID ({@code consultation_records.consultant_id})
     * @return 작성 상담사 본인이거나 같은 테넌트 관리자 계열이면 {@code true}
     */
    public boolean canWrite(User caller, String callerTenantId, String recordTenantId, Long authorConsultantId) {
        return canRead(caller, callerTenantId, recordTenantId, authorConsultantId);
    }

    /**
     * 상담일지 신규 작성 허용 여부 — 모든 작성 경로가 공유하는 판정 규칙.
     *
     * <p>일정이 호출자 테넌트에 있고(삭제되지 않음), 호출자가 그 일정의 담당 상담사이거나 같은 테넌트
     * 관리자 계열이면 허용한다. 요청 본문의 {@code consultantId} 는 근거로 쓰지 않는다.</p>
     *
     * @param caller         세션 사용자
     * @param callerTenantId 세션 사용자 테넌트 ID
     * @param schedule       대상 일정 (null 이면 거부)
     * @return 허용이면 {@code true}
     */
    public boolean canCreate(User caller, String callerTenantId, Schedule schedule) {
        if (caller == null || callerTenantId == null || schedule == null
                || Boolean.TRUE.equals(schedule.getIsDeleted())
                || !Objects.equals(callerTenantId, schedule.getTenantId())) {
            return false;
        }
        return canCreateFor(caller, schedule.getConsultantId());
    }

    /**
     * 담당 상담사 기준 작성 허용 여부 — 회기권·타기관 작성이 공유하는 단일 규칙.
     *
     * @param caller               세션 사용자
     * @param assigneeConsultantId 담당 상담사 ID (일정·매핑·계약의 상담사)
     * @return 담당 상담사 본인이거나 같은 테넌트 관리자 계열이면 {@code true}
     */
    private boolean canCreateFor(User caller, Long assigneeConsultantId) {
        return isAuthor(caller, assigneeConsultantId) || isRecordBodyManager(caller);
    }

    /**
     * 상담일지 신규 작성 검증. 작성 경로는 저장 전에 반드시 이 메서드를 통과한다.
     *
     * @param session    HTTP 세션
     * @param scheduleId 대상 일정 ID ({@code consultation_records.consultation_id})
     * @return 판정을 통과한 작성자 정보 (서비스가 실제 작성자 기록에 사용)
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 일정이 없거나 담당 상담사·같은 테넌트 관리자가 아닐 때
     */
    @Transactional(readOnly = true)
    public ConsultationRecordWriter requireCreateAccess(HttpSession session, Long scheduleId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        Schedule schedule = scheduleId == null ? null
            : scheduleRepository.findByTenantIdAndId(tenantId, scheduleId).orElse(null);
        if (schedule == null || Boolean.TRUE.equals(schedule.getIsDeleted())) {
            audit(caller, tenantId, ConsultationRecordAccessAudit.KIND_CONSULTATION_RECORD, null, null, null,
                    ConsultationRecordAccessAudit.ACTION_CREATE, ConsultationRecordAccessAudit.RESULT_DENIED,
                    DENIAL_RECORD_UNAVAILABLE);
            deny(DENIAL_RECORD_UNAVAILABLE, caller, "scheduleId", scheduleId);
        }
        boolean allowed = canCreate(caller, tenantId, schedule);
        audit(caller, tenantId, ConsultationRecordAccessAudit.KIND_CONSULTATION_RECORD, null,
                schedule.getClientId(), schedule.getConsultantId(), ConsultationRecordAccessAudit.ACTION_CREATE,
                allowed ? ConsultationRecordAccessAudit.RESULT_ALLOWED : ConsultationRecordAccessAudit.RESULT_DENIED,
                allowed ? null : DENIAL_CREATE_ASSIGNEE_ONLY);
        if (!allowed) {
            deny(DENIAL_CREATE_ASSIGNEE_ONLY, caller, "scheduleId", scheduleId);
        }
        return ConsultationRecordWriter.forCreate(caller, isRecordBodyManager(caller),
                schedule.getId());
    }

    /**
     * 타기관 연계 상담일지 작성 1차 검증 (컨트롤러). 저장 전에 반드시 통과한다.
     *
     * <p>일정이 있으면 회기권과 같은 {@link #requireCreateAccess} 규칙(일정 담당 상담사 또는 같은 테넌트
     * 관리자)이다. 일정이 없으면 같은 테넌트 상담사·관리자(ADMIN)만 통과하고(사무원은 감사 기록 후 403), 담당 상담사 대조는
     * 서비스가 매핑·계약을 읽은 뒤 {@link #requireInstitutionLinkAssignee} 로 한다. 본문의 타기관 표시
     * ({@code contractId}·{@code mappingId} 등)는 허용 근거가 아니다.</p>
     *
     * @param session    HTTP 세션
     * @param scheduleId 대상 일정 ID (없으면 null)
     * @return 판정을 통과한 작성자 정보
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 내담자·다른 테넌트이거나 일정 담당 상담사·관리자가 아닐 때
     */
    @Transactional(readOnly = true)
    public ConsultationRecordWriter requireInstitutionLinkCreateAccess(HttpSession session, Long scheduleId) {
        if (scheduleId != null) {
            return requireCreateAccess(session, scheduleId);
        }
        User caller = requireConsultationRecordRole(session);
        boolean manager = isRecordBodyManager(caller);
        boolean consultant = caller.getRole() != null && caller.getRole().isConsultant();
        if (!manager && !consultant) {
            String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
            audit(caller, tenantId, ConsultationRecordAccessAudit.KIND_INSTITUTION_LINK_LOG, null, null, null,
                    ConsultationRecordAccessAudit.ACTION_CREATE, ConsultationRecordAccessAudit.RESULT_DENIED,
                    DENIAL_CREATE_ASSIGNEE_ONLY);
            deny(DENIAL_CREATE_ASSIGNEE_ONLY, caller, "scheduleId", null);
        }
        return ConsultationRecordWriter.forCreate(caller, manager, null);
    }

    /**
     * 타기관 작성 대상(매핑·계약)이 세션 테넌트에 없을 때 던질 예외. 담당이 아닐 때와 같은 403 이라
     * 다른 테넌트·같은 테넌트 모두 id 존재 여부를 알 수 없다.
     *
     * @param writer 컨트롤러 가드가 만든 작성자 정보 (로그용)
     * @return 던질 {@link AccessDeniedException}
     */
    public AccessDeniedException institutionLinkTargetDenied(ConsultationRecordWriter writer) {
        return ClientPathAccessGuard.denied(DENIAL_CREATE_ASSIGNEE_ONLY, null, "writerUserId",
            writer != null ? writer.userId() : null);
    }

    /**
     * 타기관 연계 상담일지 작성 2차 검증 (서비스). 매핑·계약에서 읽은 담당자로 다시 판정한다.
     *
     * <p>작성자가 담당 상담사 본인이거나 같은 테넌트 관리자 계열이어야 하고, 본문의 상담사·내담자는
     * 매핑·계약의 담당 상담사·내담자와 같아야 한다. 판정 대상 일정이 있으면 저장 대상 일정과 같아야 한다.</p>
     *
     * @param writer               컨트롤러 가드가 만든 작성자 정보 (null 이면 거부)
     * @param assigneeConsultantId 매핑·계약의 담당 상담사 ID
     * @param assigneeClientId     매핑·계약의 내담자 ID
     * @param requestConsultantId  본문 상담사 ID
     * @param requestClientId      본문 내담자 ID
     * @param requestScheduleId    본문 일정 ID
     * @throws AccessDeniedException 위 조건 중 하나라도 맞지 않을 때
     */
    public void requireInstitutionLinkAssignee(ConsultationRecordWriter writer, Long assigneeConsultantId,
            Long assigneeClientId, Long requestConsultantId, Long requestClientId, Long requestScheduleId) {
        Long writerUserId = writer != null ? writer.userId() : null;
        boolean allowed = writerUserId != null
            && assigneeConsultantId != null
            && (writer.tenantManager() || Objects.equals(writerUserId, assigneeConsultantId))
            && Objects.equals(requestConsultantId, assigneeConsultantId)
            && (assigneeClientId == null || Objects.equals(requestClientId, assigneeClientId))
            && (writer.scheduleId() == null || writer.matchesSchedule(requestScheduleId));
        if (!allowed) {
            deny(DENIAL_CREATE_ASSIGNEE_ONLY, null, "writerUserId", writerUserId);
        }
    }

    /**
     * 상담일지 수정 검증. 수정 경로는 저장 전에 반드시 이 메서드를 통과한다.
     *
     * @param session  HTTP 세션
     * @param recordId 상담일지 ID
     * @return 판정을 통과한 작성자 정보 (서비스가 실제 수정자 기록에 사용)
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 일지가 없거나 작성자·같은 테넌트 관리자가 아닐 때
     */
    @Transactional(readOnly = true)
    public ConsultationRecordWriter requireWriteAccess(HttpSession session, Long recordId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        ConsultationRecord record = recordId == null ? null
            : consultationRecordRepository.findByTenantIdAndId(tenantId, recordId).orElse(null);
        if (record == null || Boolean.TRUE.equals(record.getIsDeleted())) {
            audit(caller, tenantId, ConsultationRecordAccessAudit.KIND_CONSULTATION_RECORD, recordId, null, null,
                    ConsultationRecordAccessAudit.ACTION_EDIT, ConsultationRecordAccessAudit.RESULT_DENIED,
                    DENIAL_RECORD_UNAVAILABLE);
            deny(DENIAL_RECORD_UNAVAILABLE, caller, "recordId", recordId);
        }
        boolean allowed = canWrite(caller, tenantId, record.getTenantId(), record.getConsultantId());
        audit(caller, tenantId, ConsultationRecordAccessAudit.KIND_CONSULTATION_RECORD, record.getId(),
                record.getClientId(), record.getConsultantId(), ConsultationRecordAccessAudit.ACTION_EDIT,
                allowed ? ConsultationRecordAccessAudit.RESULT_ALLOWED : ConsultationRecordAccessAudit.RESULT_DENIED,
                allowed ? null : DENIAL_WRITE_AUTHOR_ONLY);
        if (!allowed) {
            deny(DENIAL_WRITE_AUTHOR_ONLY, caller, "recordId", recordId);
        }
        return ConsultationRecordWriter.forEdit(caller, isRecordBodyManager(caller),
                record.getId());
    }

    /**
     * 상담일지 삭제 검증 — {@link #requireWriteAccess} 와 같은 규칙이되, 거부 문구를 하나로 맞춘다.
     *
     * <p>내담자·역할 미상은 일지를 조회하기 전에 거부하고, 일지가 없을 때와 권한이 없을 때 모두
     * {@link #DENIAL_RECORD_UNAVAILABLE} 403 이므로 응답으로 id 존재 여부를 알 수 없다.
     * 관리자 쪽 삭제와 상담사 경로 삭제가 모두 이 판정 하나를 쓰며, 사무원(STAFF)은
     * {@link #isRecordBodyManager} 가 아니므로 거부된다.</p>
     *
     * @param session  HTTP 세션
     * @param recordId 삭제 대상 상담일지 ID
     * @return 판정을 통과한 작성자 정보
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 일지가 없거나 작성자·같은 테넌트 관리자(ADMIN)가 아닐 때 (사무원 포함)
     */
    @Transactional(readOnly = true)
    public ConsultationRecordWriter requireDeleteAccess(HttpSession session, Long recordId) {
        requireConsultationRecordRole(session);
        try {
            return requireWriteAccess(session, recordId);
        } catch (AccessDeniedException e) {
            throw new AccessDeniedException(DENIAL_RECORD_UNAVAILABLE, e);
        }
    }

    /**
     * 상담일지 단건 읽기 검증 (본문 포함).
     *
     * @param session  HTTP 세션
     * @param recordId 상담일지 ID
     * @return 테넌트 범위로 조회한 상담일지
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 일지가 없거나 작성자·같은 테넌트 관리자가 아닐 때
     */
    @Transactional(readOnly = true)
    public ConsultationRecord requireReadAccess(HttpSession session, Long recordId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        ConsultationRecord record = recordId == null ? null
            : consultationRecordRepository.findByTenantIdAndId(tenantId, recordId).orElse(null);
        if (record == null || Boolean.TRUE.equals(record.getIsDeleted())) {
            audit(caller, tenantId, ConsultationRecordAccessAudit.KIND_CONSULTATION_RECORD, recordId, null, null,
                    ConsultationRecordAccessAudit.ACTION_VIEW, ConsultationRecordAccessAudit.RESULT_DENIED,
                    DENIAL_RECORD_UNAVAILABLE);
            deny(DENIAL_RECORD_UNAVAILABLE, caller, "recordId", recordId);
        }
        boolean allowed = canRead(caller, tenantId, record.getTenantId(), record.getConsultantId());
        audit(caller, tenantId, ConsultationRecordAccessAudit.KIND_CONSULTATION_RECORD, record.getId(),
                record.getClientId(), record.getConsultantId(), ConsultationRecordAccessAudit.ACTION_VIEW,
                allowed ? ConsultationRecordAccessAudit.RESULT_ALLOWED : ConsultationRecordAccessAudit.RESULT_DENIED,
                allowed ? null : DENIAL_AUTHOR_ONLY);
        if (!allowed) {
            deny(DENIAL_AUTHOR_ONLY, caller, "recordId", recordId);
        }
        return record;
    }

    /**
     * 상담사 단위 목록 읽기 검증 ({@code ?consultantId=}).
     *
     * <p>목록은 {@code consultant_id = consultantId} 로 조회되므로 대상 상담사가 곧 작성자다.
     * 상담사는 본인 id 만, 관리자 계열은 같은 테넌트 상담사만 허용한다.</p>
     *
     * @param session      HTTP 세션
     * @param consultantId 목록 대상(작성) 상담사 ID
     * @return 세션 사용자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 본인 상담사도 같은 테넌트 관리자도 아닐 때
     */
    public User requireConsultantScopeReadAccess(HttpSession session, Long consultantId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        try {
            clientPathAccessGuard.assertCanAccessConsultant(caller, consultantId);
        } catch (AccessDeniedException e) {
            auditList(caller, tenantId, consultantId, ConsultationRecordAccessAudit.RESULT_DENIED, e.getMessage());
            throw e;
        }
        auditList(caller, tenantId, consultantId, ConsultationRecordAccessAudit.RESULT_ALLOWED, null);
        return caller;
    }

    /**
     * 일정 단위 목록 읽기 검증 + 읽을 수 있는 일지만 반환 ({@code ?consultationId=}).
     *
     * <p>일정에 달린 일지마다 {@link #canRead} 로 거른다. 관리자 계열은 전부, 상담사는 본인이 작성한
     * 일지만 받는다. 일지가 있는데 하나도 읽을 수 없으면 403 이다(현재 담당 상담사여도 마찬가지).
     * 일지가 아직 없으면 돌려줄 본문이 없으므로, 그 일정의 담당 상담사 또는 관리자 계열에게만 빈 목록을
     * 준다(작성 화면 진입용 — 데이터 노출 없음).</p>
     *
     * @param session        HTTP 세션
     * @param consultationId 일정(스케줄) ID
     * @return 호출자가 읽을 수 있는 일지 목록
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 읽을 수 있는 일지가 없거나 일정이 테넌트 밖일 때
     */
    @Transactional(readOnly = true)
    public List<ConsultationRecord> requireConsultationScopeReadAccess(HttpSession session, Long consultationId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        Schedule schedule = consultationId == null ? null
            : scheduleRepository.findByTenantIdAndId(tenantId, consultationId).orElse(null);
        List<ConsultationRecord> records;
        if (consultationId == null) {
            records = List.of();
        } else if (schedule != null) {
            records = consultationRecordRepository.findActiveForScheduleSsot(tenantId, schedule.getId());
        } else {
            records = consultationRecordRepository
                .findByTenantIdAndConsultationIdAndIsDeletedFalse(tenantId, consultationId);
        }
        List<ConsultationRecord> readable = records.stream()
            .filter(record -> canRead(caller, tenantId, record.getTenantId(), record.getConsultantId()))
            .toList();
        boolean allowed;
        if (!records.isEmpty()) {
            allowed = !readable.isEmpty();
        } else {
            allowed = schedule != null
                && (isRecordBodyManager(caller) || isAuthor(caller, schedule.getConsultantId()));
        }
        Long auditedAuthor = readable.isEmpty() ? null : readable.get(0).getConsultantId();
        audit(caller, tenantId, ConsultationRecordAccessAudit.KIND_CONSULTATION_RECORD, null, null, auditedAuthor,
                ConsultationRecordAccessAudit.ACTION_LIST,
                allowed ? ConsultationRecordAccessAudit.RESULT_ALLOWED : ConsultationRecordAccessAudit.RESULT_DENIED,
                allowed ? null : DENIAL_AUTHOR_ONLY);
        if (!allowed) {
            deny(DENIAL_AUTHOR_ONLY, caller, "consultationId", consultationId);
        }
        return readable;
    }

    /**
     * 임상 리포트(SOAP·DAP·진단 초안) 접근 검증 — 원본 상담일지의 읽기 규칙을 그대로 적용한다.
     *
     * @param session  HTTP 세션
     * @param reportId 임상 리포트 ID
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 리포트·원본 일지가 없거나 읽기 권한이 없을 때
     */
    @Transactional(readOnly = true)
    public void requireClinicalReportAccess(HttpSession session, Long reportId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        clientPathAccessGuard.requireCallerTenantId(caller);
        Long consultationRecordId = reportId == null ? null
            : clinicalReportRepository.findByIdAndIsDeletedFalse(reportId)
                .map(ClinicalReport::getConsultationRecordId).orElse(null);
        if (consultationRecordId == null) {
            deny(DENIAL_RECORD_UNAVAILABLE, caller, "reportId", reportId);
        }
        // 원본 일지는 테넌트 범위로 조회되므로 타 테넌트 리포트도 여기서 403 이 된다.
        requireReadAccess(session, consultationRecordId);
    }

    /**
     * 타기관 연계 상담일지 단건 읽기 검증 — {@link #canRead} 규칙을 그대로 적용한다.
     *
     * @param session  HTTP 세션
     * @param recordId 타기관 연계 일지 ID
     * @return 테넌트 범위로 조회한 일지
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 일지가 없거나 작성자·같은 테넌트 관리자가 아닐 때
     */
    @Transactional(readOnly = true)
    public InstitutionLinkConsultationLog requireInstitutionLinkLogReadAccess(HttpSession session, Long recordId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        InstitutionLinkConsultationLog log = recordId == null ? null
            : institutionLinkConsultationLogRepository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, recordId).orElse(null);
        if (log == null) {
            audit(caller, tenantId, ConsultationRecordAccessAudit.KIND_INSTITUTION_LINK_LOG, recordId, null, null,
                    ConsultationRecordAccessAudit.ACTION_VIEW, ConsultationRecordAccessAudit.RESULT_DENIED,
                    DENIAL_RECORD_UNAVAILABLE);
            deny(DENIAL_RECORD_UNAVAILABLE, caller, "recordId", recordId);
        }
        boolean allowed = canRead(caller, tenantId, log.getTenantId(), log.getConsultantId());
        audit(caller, tenantId, ConsultationRecordAccessAudit.KIND_INSTITUTION_LINK_LOG, recordId,
                log.getClientId(), log.getConsultantId(), ConsultationRecordAccessAudit.ACTION_VIEW,
                allowed ? ConsultationRecordAccessAudit.RESULT_ALLOWED : ConsultationRecordAccessAudit.RESULT_DENIED,
                allowed ? null : DENIAL_AUTHOR_ONLY);
        if (!allowed) {
            deny(DENIAL_AUTHOR_ONLY, caller, "recordId", recordId);
        }
        return log;
    }

    /**
     * 타기관 연계 상담일지 수정·완료 검증 — {@link #canWrite} 규칙을 그대로 적용한다.
     *
     * @param session  HTTP 세션
     * @param recordId 타기관 연계 일지 ID
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 일지가 없거나 작성자·같은 테넌트 관리자가 아닐 때
     */
    @Transactional(readOnly = true)
    public void requireInstitutionLinkLogWriteAccess(HttpSession session, Long recordId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        InstitutionLinkConsultationLog log = recordId == null ? null
            : institutionLinkConsultationLogRepository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, recordId).orElse(null);
        if (log == null) {
            audit(caller, tenantId, ConsultationRecordAccessAudit.KIND_INSTITUTION_LINK_LOG, recordId, null, null,
                    ConsultationRecordAccessAudit.ACTION_EDIT, ConsultationRecordAccessAudit.RESULT_DENIED,
                    DENIAL_RECORD_UNAVAILABLE);
            deny(DENIAL_RECORD_UNAVAILABLE, caller, "recordId", recordId);
        }
        boolean allowed = canWrite(caller, tenantId, log.getTenantId(), log.getConsultantId());
        audit(caller, tenantId, ConsultationRecordAccessAudit.KIND_INSTITUTION_LINK_LOG, recordId,
                log.getClientId(), log.getConsultantId(), ConsultationRecordAccessAudit.ACTION_EDIT,
                allowed ? ConsultationRecordAccessAudit.RESULT_ALLOWED : ConsultationRecordAccessAudit.RESULT_DENIED,
                allowed ? null : DENIAL_WRITE_AUTHOR_ONLY);
        if (!allowed) {
            deny(DENIAL_WRITE_AUTHOR_ONLY, caller, "recordId", recordId);
        }
    }

    /**
     * 여러 상담사의 일지 본문이 섞이는 테넌트 단위 목록(예: 타기관 월말 상담내역) 검증.
     * 같은 테넌트 관리자({@link #isRecordBodyManager})만 허용한다.
     *
     * @param session HTTP 세션
     * @return 세션 사용자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 관리자가 아닐 때 (사무원 포함)
     */
    public User requireRecordBodyManager(HttpSession session) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        boolean allowed = isRecordBodyManager(caller);
        audit(caller, tenantId, ConsultationRecordAccessAudit.KIND_INSTITUTION_LINK_LOG, null, null, null,
                ConsultationRecordAccessAudit.ACTION_LIST,
                allowed ? ConsultationRecordAccessAudit.RESULT_ALLOWED : ConsultationRecordAccessAudit.RESULT_DENIED,
                allowed ? null : DENIAL_AUTHOR_ONLY);
        if (!allowed) {
            deny(DENIAL_AUTHOR_ONLY, caller, "userId", caller.getId());
        }
        return caller;
    }

    /**
     * 상담일지 본문(읽기·작성·수정)을 작성자가 아니어도 다룰 수 있는 관리자인지 — ADMIN 만.
     *
     * <p>사무원(STAFF)은 테넌트 관리 기능은 쓰지만 상담일지 본문은 다루지 않는다. 초안 가드 등 본문을
     * 다루는 다른 가드도 이 판정을 쓴다.</p>
     *
     * @param caller 세션 사용자
     * @return ADMIN 이면 {@code true}
     */
    public static boolean isRecordBodyManager(User caller) {
        UserRole role = caller != null ? caller.getRole() : null;
        return role != null && role.isAdmin();
    }

    /**
     * 상담일지 계열 조회를 시도할 수 있는 역할인지만 검증한다 (내담자·역할 미상 거부).
     *
     * <p>자원 id 를 특정하기 전 단계(예: {@code ?scheduleId=} 최신 1건 조회)에서 내담자의
     * 존재 여부 probing 을 막는 선검증용이다. 자원이 특정되면
     * {@link #requireInstitutionLinkLogReadAccess} 등으로 작성자까지 검증해야 한다.</p>
     *
     * @param session HTTP 세션
     * @return 세션 사용자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 내담자이거나 역할·테넌트가 맞지 않을 때
     */
    public User requireConsultationRecordRole(HttpSession session) {
        return clientPathAccessGuard.requireTenantManagerOrConsultant(session);
    }

    private static boolean isAuthor(User caller, Long authorId) {
        if (caller == null || authorId == null) {
            return false;
        }
        UserRole role = caller.getRole();
        return role != null && role.isConsultant() && Objects.equals(caller.getId(), authorId);
    }

    private void auditList(User caller, String tenantId, Long consultantId, String result, String denialReason) {
        audit(caller, tenantId, ConsultationRecordAccessAudit.KIND_CONSULTATION_RECORD, null, null, consultantId,
                ConsultationRecordAccessAudit.ACTION_LIST, result, denialReason);
    }

    private void audit(User caller, String tenantId, String recordKind, Long recordId, Long clientId,
            Long authorConsultantId, String action, String result, String denialReason) {
        consultationRecordAccessLogService.record(consultationRecordAccessLogService.buildCommand(
                caller, tenantId, recordKind, recordId, clientId, authorConsultantId, action, result,
                denialReason));
    }

    private static void deny(String message, User caller, String field, Long requestedId) {
        ClientPathAccessGuard.deny(message, caller, field, requestedId);
    }
}
