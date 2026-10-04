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
 * 상담일지 읽기 권한 단일 판정 가드.
 *
 * <p>모든 상담일지 읽기 경로(단건·일정 단위 목록·상담사 단위 목록·임상 리포트·타기관 연계 일지)는
 * 이 클래스의 판정 메서드만 호출한다. 판정 규칙은 {@link #canRead(User, String, String, Long)} 하나다.</p>
 * <ul>
 *   <li>허용 — 일지 작성 상담사 본인({@code consultation_records.consultant_id == 로그인 사용자})</li>
 *   <li>허용 — 같은 테넌트 관리자 계열({@link ClientPathAccessGuard#isTenantManager}: ADMIN·STAFF).
 *       본문까지 열람한다.</li>
 *   <li>거부(403) — 다른 상담사(현재 담당 상담사여도 작성자가 아니면 거부), 내담자, 다른 테넌트</li>
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
        return isAuthor(caller, authorConsultantId) || clientPathAccessGuard.isTenantManager(caller);
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
                && (clientPathAccessGuard.isTenantManager(caller) || isAuthor(caller, schedule.getConsultantId()));
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
