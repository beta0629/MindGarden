package com.coresolution.consultation.service.support;

import java.util.List;
import java.util.Objects;
import com.coresolution.consultation.constant.UserRole;
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
 * 상담일지(본문) 읽기 전용 소유자 가드.
 *
 * <p>{@link ResourceOwnerAccessGuard} 의 상담기록 규칙(내담자 본인 · 매칭 상담사 · 같은 테넌트
 * 관리자)보다 엄격하다. 상담일지 본문은 <b>작성 상담사(author)</b> 와 명시 권한자만 읽을 수 있다.
 * 현재 저장소에 상담일지 단위 공유(share) 기구는 없으므로 명시 권한자는 같은 테넌트
 * ADMIN·STAFF 뿐이다.</p>
 * <ul>
 *   <li>CONSULTANT(전문가 계열) — 일지의 {@code consultantId} 가 본인일 때만. 같은 테넌트의
 *       다른 상담사는 매칭이 있어도 거부.</li>
 *   <li>ADMIN·STAFF — 같은 테넌트 범위 허용 (기존 관리자 화면 유지).</li>
 *   <li>CLIENT — 거부. 상담일지 본문은 내담자에게 공개하지 않는다.</li>
 * </ul>
 * <p>테넌트 안에 일지가 없으면 존재 여부를 드러내지 않도록 403 으로 거부한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@Component
@RequiredArgsConstructor
public class ConsultationRecordAccessGuard {

    /** 테넌트 내 일지 부재·타 테넌트·내담자 등 모든 거부에 공통으로 쓰는 사유 (존재 여부 비노출). */
    public static final String DENIAL_RECORD_UNAVAILABLE = "접근할 수 없는 상담일지입니다.";

    /** 작성 상담사가 아닌 호출자의 거부 사유. */
    public static final String DENIAL_AUTHOR_ONLY = "본인이 작성한 상담일지만 조회할 수 있습니다.";

    private final ClientPathAccessGuard clientPathAccessGuard;
    private final ClinicalReportRepository clinicalReportRepository;
    private final ConsultationRecordRepository consultationRecordRepository;
    private final InstitutionLinkConsultationLogRepository institutionLinkConsultationLogRepository;
    private final ScheduleRepository scheduleRepository;

    /**
     * 일지 id 단건 읽기 검증.
     *
     * @param session  HTTP 세션
     * @param recordId 상담일지 ID
     * @return 테넌트 범위로 조회한 상담일지
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 일지가 없거나 작성자·관리자가 아닐 때
     */
    @Transactional(readOnly = true)
    public ConsultationRecord requireConsultationRecordReadAccess(HttpSession session, Long recordId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        ConsultationRecord record = recordId == null ? null
            : consultationRecordRepository.findByTenantIdAndId(tenantId, recordId).orElse(null);
        if (record == null || Boolean.TRUE.equals(record.getIsDeleted())) {
            deny(DENIAL_RECORD_UNAVAILABLE, caller, "recordId", recordId);
        }
        assertAuthorOrManager(caller, record.getConsultantId(), "recordId", recordId);
        return record;
    }

    /**
     * 상담사 범위 목록 읽기 검증 ({@code ?consultantId=}).
     *
     * @param session      HTTP 세션
     * @param consultantId 목록 대상 상담사 ID
     * @return 세션 사용자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 본인 상담사도 같은 테넌트 관리자도 아닐 때
     */
    public User requireConsultantScopeReadAccess(HttpSession session, Long consultantId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        clientPathAccessGuard.requireCallerTenantId(caller);
        assertAuthorOrManager(caller, consultantId, "consultantId", consultantId);
        return caller;
    }

    /**
     * 일정(상담) 범위 목록 읽기 검증 ({@code ?consultationId=}).
     *
     * <p>일정의 담당 상담사를 기준으로 판정하고, 일정이 없으면 해당 일정에 달린 일지의
     * 작성 상담사로 판정한다. 둘 다 확정할 수 없으면 거부한다.</p>
     *
     * @param session        HTTP 세션
     * @param consultationId 일정(스케줄) ID
     * @return 세션 사용자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 담당 상담사도 같은 테넌트 관리자도 아닐 때
     */
    @Transactional(readOnly = true)
    public User requireConsultationScopeReadAccess(HttpSession session, Long consultationId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        if (clientPathAccessGuard.isTenantManager(caller)) {
            return caller;
        }
        Long ownerConsultantId = resolveConsultationOwner(tenantId, consultationId);
        assertAuthorOrManager(caller, ownerConsultantId, "consultationId", consultationId);
        return caller;
    }

    /**
     * 임상 리포트(SOAP·DAP·진단 초안) 접근 검증. 원본 상담일지의 소유자 규칙을 그대로 적용한다.
     *
     * @param session  HTTP 세션
     * @param reportId 임상 리포트 ID
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 리포트·원본 일지가 없거나 작성자·관리자가 아닐 때
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
        requireConsultationRecordReadAccess(session, consultationRecordId);
    }

    /**
     * 타기관 연계 상담일지 단건 읽기 검증.
     *
     * @param session  HTTP 세션
     * @param recordId 타기관 연계 일지 ID
     * @return 테넌트 범위로 조회한 일지
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 일지가 없거나 작성자·관리자가 아닐 때
     */
    @Transactional(readOnly = true)
    public InstitutionLinkConsultationLog requireInstitutionLinkLogReadAccess(HttpSession session, Long recordId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        InstitutionLinkConsultationLog log = recordId == null ? null
            : institutionLinkConsultationLogRepository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, recordId).orElse(null);
        if (log == null) {
            deny(DENIAL_RECORD_UNAVAILABLE, caller, "recordId", recordId);
        }
        assertAuthorOrManager(caller, log.getConsultantId(), "recordId", recordId);
        return log;
    }

    /**
     * 상담일지 계열 조회를 시도할 수 있는 역할인지만 검증한다 (내담자·역할 미상 거부).
     *
     * <p>자원 id 를 특정하기 전 단계(예: {@code ?scheduleId=} 최신 1건 조회)에서 내담자의
     * 존재 여부 probing 을 막는 선검증용이다. 자원이 특정되면
     * {@link #requireInstitutionLinkLogReadAccess} 등으로 소유자까지 검증해야 한다.</p>
     *
     * @param session HTTP 세션
     * @return 세션 사용자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 내담자이거나 역할·테넌트가 맞지 않을 때
     */
    public User requireConsultationRecordRole(HttpSession session) {
        return clientPathAccessGuard.requireTenantManagerOrConsultant(session);
    }

    /**
     * 작성 상담사 본인 또는 같은 테넌트 관리자·사무원인지 검증한다.
     *
     * @param caller       세션 사용자
     * @param authorId     일지 작성 상담사 ID (null 이면 거부)
     * @param field        거부 로그에 남길 필드명
     * @param requestedId  거부 로그에 남길 요청 값
     * @throws AccessDeniedException 작성자·관리자가 아닐 때
     */
    private void assertAuthorOrManager(User caller, Long authorId, String field, Long requestedId) {
        if (clientPathAccessGuard.isTenantManager(caller)) {
            return;
        }
        UserRole role = caller.getRole();
        if (role != null && role.isConsultant() && authorId != null
                && Objects.equals(caller.getId(), authorId)) {
            return;
        }
        deny(DENIAL_AUTHOR_ONLY, caller, field, requestedId);
    }

    private Long resolveConsultationOwner(String tenantId, Long consultationId) {
        if (consultationId == null) {
            return null;
        }
        Schedule schedule = scheduleRepository.findByTenantIdAndId(tenantId, consultationId).orElse(null);
        if (schedule != null && schedule.getConsultantId() != null) {
            return schedule.getConsultantId();
        }
        List<ConsultationRecord> records = consultationRecordRepository
            .findByTenantIdAndConsultationIdAndIsDeletedFalse(tenantId, consultationId);
        if (records.size() == 1) {
            return records.get(0).getConsultantId();
        }
        return null;
    }

    private static void deny(String message, User caller, String field, Long requestedId) {
        ClientPathAccessGuard.deny(message, caller, field, requestedId);
    }
}
