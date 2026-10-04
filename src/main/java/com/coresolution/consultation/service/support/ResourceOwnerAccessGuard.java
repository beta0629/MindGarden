package com.coresolution.consultation.service.support;

import java.util.Objects;
import java.util.Optional;
import java.util.function.Supplier;
import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.entity.ConsultantAvailability;
import com.coresolution.consultation.entity.ConsultantRating;
import com.coresolution.consultation.entity.ConsultationAudioFile;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.MultimodalEmotionReport;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.repository.ConsultantAvailabilityRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultationAudioFileRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.MultimodalEmotionReportRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.util.ServerErrorResponses;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 자원 id(문서·평가·상담기록·음성파일·리포트·가용시간·재무 거래·상담사 급여)로 접근하는 API 의 소유자 가드.
 *
 * <p>자원을 세션 테넌트 범위로 먼저 읽고, 그 소유 내담자/상담사에 {@link ClientPathAccessGuard} 와
 * 같은 규칙(내담자 본인 · 매칭 상담사 · 같은 테넌트 관리자/사무원)을 적용한다.</p>
 *
 * <p>자원 id 로 인한 거부는 사유와 무관하게 하나의 문구({@link #DENIAL_RESOURCE_UNAVAILABLE})로 403 을
 * 돌려준다. 없는 자원·타인 자원·조회 실패가 서로 다른 상태 코드나 문구로 구분되면 그 자체가 존재 여부를
 * 드러내기 때문이다. 조회 중 DB 오류가 나도 500 으로 흘리지 않고 같은 403 으로 거부하며, 원인 예외는
 * 추적 id 와 함께 로그에만 남긴다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ResourceOwnerAccessGuard {

    /** 자원 id 기반 거부 공통 문구 (없음·타인·조회 실패를 구분하지 않는다) */
    public static final String DENIAL_RESOURCE_UNAVAILABLE = "접근할 수 없는 자료입니다.";
    public static final String DENIAL_CLIENT_RATING_ONLY = "내담자 본인만 평가를 등록할 수 있습니다.";

    private final ClientPathAccessGuard clientPathAccessGuard;
    private final PsychAssessmentDocumentRepository psychDocumentRepository;
    private final ConsultantRatingRepository ratingRepository;
    private final ConsultationRecordRepository consultationRecordRepository;
    private final ConsultationAudioFileRepository audioFileRepository;
    private final MultimodalEmotionReportRepository multimodalReportRepository;
    private final ConsultantAvailabilityRepository availabilityRepository;
    private final FinancialTransactionRepository financialTransactionRepository;

    /**
     * 심리검사 문서(및 그 리포트) 접근 검증. 내담자 미지정 문서는 같은 테넌트 관리자·사무원만.
     *
     * @param session    HTTP 세션
     * @param documentId 문서 ID
     * @return 세션 사용자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 문서가 없거나 소유 내담자에 접근할 수 없을 때
     */
    @Transactional(readOnly = true)
    public User requirePsychDocumentAccess(HttpSession session, Long documentId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        PsychAssessmentDocument document = load(caller, "documentId", documentId,
            () -> psychDocumentRepository.findByTenantIdAndId(tenantId, documentId));
        if (document.getClientId() == null) {
            if (!clientPathAccessGuard.isTenantManager(caller)) {
                throw denyResource(caller, "documentId", documentId);
            }
            return caller;
        }
        assertClientAccess(caller, document.getClientId(), "documentId", documentId);
        return caller;
    }

    /**
     * 평가 등록 검증. 세션 내담자 본인만 등록할 수 있다.
     *
     * @param session           HTTP 세션
     * @param requestedClientId 요청 본문 clientId (null 이면 세션 내담자로 강제)
     * @return 평가를 등록할 내담자 ID (세션 사용자 ID)
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 내담자가 아니거나 요청 clientId 가 세션 사용자와 다를 때
     */
    public Long requireRatingSubmitter(HttpSession session, Long requestedClientId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        clientPathAccessGuard.requireCallerTenantId(caller);
        if (!caller.getRole().isClient()) {
            ClientPathAccessGuard.deny(DENIAL_CLIENT_RATING_ONLY, caller, "clientId", requestedClientId);
        }
        if (requestedClientId != null && !Objects.equals(caller.getId(), requestedClientId)) {
            ClientPathAccessGuard.deny(DENIAL_CLIENT_RATING_ONLY, caller, "clientId", requestedClientId);
        }
        return caller.getId();
    }

    /**
     * 평가 변경·삭제 검증. 작성 내담자 본인, {@code allowManager} 이면 같은 테넌트 관리자·사무원도 허용.
     *
     * @param session           HTTP 세션
     * @param ratingId          평가 ID
     * @param requestedClientId 요청 clientId (null 허용. 값이 있으면 평가 작성자와 같아야 함)
     * @param allowManager      관리자·사무원 허용 여부
     * @return 평가 작성 내담자 ID
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 평가가 없거나 작성자·관리자가 아닐 때
     */
    @Transactional(readOnly = true)
    public Long requireRatingOwner(HttpSession session, Long ratingId, Long requestedClientId,
            boolean allowManager) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        ConsultantRating rating = load(caller, "ratingId", ratingId,
            () -> ratingRepository.findByTenantIdAndId(tenantId, ratingId));
        Long ownerId = rating.getClient() != null ? rating.getClient().getId() : null;
        if (ownerId == null) {
            throw denyResource(caller, "ratingId", ratingId);
        }
        if (requestedClientId != null && !Objects.equals(ownerId, requestedClientId)) {
            throw denyResource(caller, "ratingId", ratingId);
        }
        boolean owner = caller.getRole().isClient() && Objects.equals(caller.getId(), ownerId);
        boolean manager = allowManager && clientPathAccessGuard.isTenantManager(caller);
        if (!owner && !manager) {
            throw denyResource(caller, "ratingId", ratingId);
        }
        return ownerId;
    }

    /**
     * 상담 기록 id 기반 감정 분석 접근 검증 (기록의 내담자에 본인·매칭·관리자 규칙 적용).
     *
     * @param session              HTTP 세션
     * @param consultationRecordId 상담 기록 ID
     * @return 테넌트 범위로 조회한 상담 기록
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 기록이 없거나 기록의 내담자에 접근할 수 없을 때
     */
    @Transactional(readOnly = true)
    public ConsultationRecord requireConsultationRecordAccess(HttpSession session, Long consultationRecordId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        return loadAccessibleRecord(caller, consultationRecordId);
    }

    /**
     * {@link #requireConsultationRecordAccess} + 기록의 내담자가 경로 내담자와 같은지 검증.
     *
     * @param session              HTTP 세션
     * @param consultationRecordId 상담 기록 ID
     * @param clientId             경로 내담자 ID
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 접근 불가 또는 기록 내담자 불일치
     */
    @Transactional(readOnly = true)
    public void requireConsultationRecordOfClient(HttpSession session, Long consultationRecordId, Long clientId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        ConsultationRecord record = loadAccessibleRecord(caller, consultationRecordId);
        if (!Objects.equals(record.getClientId(), clientId)) {
            throw denyResource(caller, "consultationRecordId", consultationRecordId);
        }
    }

    /**
     * 상담 음성 파일 id 기반 접근 검증.
     *
     * @param session     HTTP 세션
     * @param audioFileId 음성 파일 ID
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 파일·기록이 없거나 접근할 수 없을 때
     */
    @Transactional(readOnly = true)
    public void requireAudioFileAccess(HttpSession session, Long audioFileId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        ConsultationAudioFile audioFile = load(caller, "audioFileId", audioFileId,
            () -> audioFileRepository.findByTenantIdAndId(tenantId, audioFileId));
        loadAccessibleRecord(caller, audioFile.getConsultationRecordId());
    }

    /**
     * 멀티모달 감정 리포트 id 기반 접근 검증.
     *
     * @param session  HTTP 세션
     * @param reportId 리포트 ID
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 리포트·기록이 없거나 접근할 수 없을 때
     */
    @Transactional(readOnly = true)
    public void requireMultimodalReportAccess(HttpSession session, Long reportId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        MultimodalEmotionReport report = load(caller, "reportId", reportId,
            () -> multimodalReportRepository.findByTenantIdAndIdAndIsDeletedFalse(tenantId, reportId));
        loadAccessibleRecord(caller, report.getConsultationRecordId());
    }

    /**
     * 상담 가능 시간 id 기반 변경 검증 (해당 상담사 본인 또는 같은 테넌트 관리자·사무원).
     *
     * @param session        HTTP 세션
     * @param availabilityId 상담 가능 시간 ID
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 자원이 없거나 소유 상담사·관리자가 아닐 때
     */
    @Transactional(readOnly = true)
    public void requireAvailabilityWrite(HttpSession session, Long availabilityId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        ConsultantAvailability availability = load(caller, "availabilityId", availabilityId,
            () -> availabilityRepository.findByTenantIdAndId(tenantId, availabilityId));
        assertConsultantAccess(caller, availability.getConsultantId(), "availabilityId", availabilityId);
    }

    /**
     * 재무 거래 id 기반 접근 검증 (같은 테넌트 관리자·사무원만).
     *
     * @param session       HTTP 세션
     * @param transactionId 거래 ID
     * @return 테넌트 범위로 조회한 거래
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 거래가 없거나 관리자·사무원이 아닐 때
     */
    @Transactional(readOnly = true)
    public FinancialTransaction requireFinancialTransactionAccess(HttpSession session, Long transactionId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        FinancialTransaction transaction = load(caller, "transactionId", transactionId,
            () -> financialTransactionRepository.findByTenantIdAndId(tenantId, transactionId));
        if (!clientPathAccessGuard.isTenantManager(caller)) {
            throw denyResource(caller, "transactionId", transactionId);
        }
        return transaction;
    }

    /**
     * 상담사 id 로 읽는 자원(급여 프로필·급여 계산 등) 접근 검증. 상담사 본인 또는 같은 테넌트 관리자·사무원.
     *
     * @param session      HTTP 세션
     * @param consultantId 상담사 ID
     * @return 세션 사용자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 상담사가 아니거나 본인·관리자가 아닐 때
     */
    @Transactional(readOnly = true)
    public User requireConsultantResourceAccess(HttpSession session, Long consultantId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        clientPathAccessGuard.requireCallerTenantId(caller);
        if (consultantId == null) {
            throw denyResource(caller, "consultantId", null);
        }
        assertConsultantAccess(caller, consultantId, "consultantId", consultantId);
        return caller;
    }

    private ConsultationRecord loadAccessibleRecord(User caller, Long consultationRecordId) {
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        ConsultationRecord record = load(caller, "consultationRecordId", consultationRecordId,
            () -> consultationRecordRepository.findByTenantIdAndId(tenantId, consultationRecordId));
        if (record.getClientId() == null) {
            throw denyResource(caller, "consultationRecordId", consultationRecordId);
        }
        assertClientAccess(caller, record.getClientId(), "consultationRecordId", consultationRecordId);
        return record;
    }

    /**
     * 테넌트 범위로 자원을 읽는다.
     *
     * <p>id 누락·테넌트 내 미존재·조회 실패를 모두 같은 403 으로 수렴시킨다. 조회 실패(스키마 불일치 등)를
     * 500 으로 흘리면 없는 id 와 읽을 수 있는 id 의 상태 코드가 갈려 존재 여부가 드러난다.</p>
     */
    private <T> T load(User caller, String field, Long resourceId, Supplier<Optional<T>> lookup) {
        if (resourceId == null) {
            throw denyResource(caller, field, null);
        }
        Optional<T> found;
        try {
            found = lookup.get();
        } catch (DataAccessException e) {
            log.error("[security] 자원 조회 실패 — 403 으로 거부: traceId={}, {}={}",
                ServerErrorResponses.newTraceId(), field, resourceId, e);
            throw denyResource(caller, field, resourceId);
        }
        return found.orElseThrow(() -> denyResource(caller, field, resourceId));
    }

    /** 소유 내담자 접근 검증. 거부 사유를 자원 공통 문구로 바꿔 존재 여부를 숨긴다. */
    private void assertClientAccess(User caller, Long clientId, String field, Long resourceId) {
        try {
            clientPathAccessGuard.assertCanAccessClient(caller, clientId);
        } catch (AccessDeniedException e) {
            throw denyResource(caller, field, resourceId);
        }
    }

    /** 소유 상담사 접근 검증. 거부 사유를 자원 공통 문구로 바꿔 존재 여부를 숨긴다. */
    private void assertConsultantAccess(User caller, Long consultantId, String field, Long resourceId) {
        try {
            clientPathAccessGuard.assertCanAccessConsultant(caller, consultantId);
        } catch (AccessDeniedException e) {
            throw denyResource(caller, field, resourceId);
        }
    }

    private static AccessDeniedException denyResource(User caller, String field, Long resourceId) {
        return ClientPathAccessGuard.denied(DENIAL_RESOURCE_UNAVAILABLE, caller, field, resourceId);
    }
}
