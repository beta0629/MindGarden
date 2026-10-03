package com.coresolution.consultation.service.support;

import java.util.Objects;
import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.entity.ConsultantAvailability;
import com.coresolution.consultation.entity.ConsultantRating;
import com.coresolution.consultation.entity.ConsultationAudioFile;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.MultimodalEmotionReport;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.repository.ConsultantAvailabilityRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultationAudioFileRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.MultimodalEmotionReportRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 자원 id(문서·평가·상담기록·음성파일·리포트·가용시간)로 접근하는 API 의 소유자 가드.
 *
 * <p>자원을 세션 테넌트 범위로 먼저 읽고, 그 소유 내담자/상담사에 {@link ClientPathAccessGuard} 와
 * 같은 규칙(내담자 본인 · 매칭 상담사 · 같은 테넌트 관리자/사무원)을 적용한다.
 * 테넌트 안에 자원이 없으면 존재 여부를 드러내지 않도록 403 으로 거부한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@Component
@RequiredArgsConstructor
public class ResourceOwnerAccessGuard {

    public static final String DENIAL_RESOURCE_UNAVAILABLE = "접근할 수 없는 자료입니다.";
    public static final String DENIAL_CLIENT_RATING_ONLY = "내담자 본인만 평가를 등록할 수 있습니다.";
    public static final String DENIAL_OWN_RATING_ONLY = "본인의 평가만 변경할 수 있습니다.";
    public static final String DENIAL_RECORD_CLIENT_MISMATCH = "해당 내담자의 상담 기록이 아닙니다.";

    private final ClientPathAccessGuard clientPathAccessGuard;
    private final PsychAssessmentDocumentRepository psychDocumentRepository;
    private final ConsultantRatingRepository ratingRepository;
    private final ConsultationRecordRepository consultationRecordRepository;
    private final ConsultationAudioFileRepository audioFileRepository;
    private final MultimodalEmotionReportRepository multimodalReportRepository;
    private final ConsultantAvailabilityRepository availabilityRepository;

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
        PsychAssessmentDocument document = documentId == null ? null
            : psychDocumentRepository.findByTenantIdAndId(tenantId, documentId).orElse(null);
        if (document == null) {
            ClientPathAccessGuard.deny(DENIAL_RESOURCE_UNAVAILABLE, caller, "documentId", documentId);
        }
        if (document.getClientId() == null) {
            if (!clientPathAccessGuard.isTenantManager(caller)) {
                ClientPathAccessGuard.deny(DENIAL_RESOURCE_UNAVAILABLE, caller, "documentId", documentId);
            }
            return caller;
        }
        clientPathAccessGuard.assertCanAccessClient(caller, document.getClientId());
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
        ConsultantRating rating = ratingId == null ? null
            : ratingRepository.findByTenantIdAndId(tenantId, ratingId).orElse(null);
        Long ownerId = rating != null && rating.getClient() != null ? rating.getClient().getId() : null;
        if (ownerId == null) {
            ClientPathAccessGuard.deny(DENIAL_RESOURCE_UNAVAILABLE, caller, "ratingId", ratingId);
        }
        if (requestedClientId != null && !Objects.equals(ownerId, requestedClientId)) {
            ClientPathAccessGuard.deny(DENIAL_OWN_RATING_ONLY, caller, "ratingId", ratingId);
        }
        boolean owner = caller.getRole().isClient() && Objects.equals(caller.getId(), ownerId);
        boolean manager = allowManager && clientPathAccessGuard.isTenantManager(caller);
        if (!owner && !manager) {
            ClientPathAccessGuard.deny(DENIAL_OWN_RATING_ONLY, caller, "ratingId", ratingId);
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
            ClientPathAccessGuard.deny(DENIAL_RECORD_CLIENT_MISMATCH, caller, "consultationRecordId",
                consultationRecordId);
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
        ConsultationAudioFile audioFile = audioFileId == null ? null
            : audioFileRepository.findByTenantIdAndId(tenantId, audioFileId).orElse(null);
        if (audioFile == null) {
            ClientPathAccessGuard.deny(DENIAL_RESOURCE_UNAVAILABLE, caller, "audioFileId", audioFileId);
        }
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
        MultimodalEmotionReport report = reportId == null ? null
            : multimodalReportRepository.findByTenantIdAndIdAndIsDeletedFalse(tenantId, reportId).orElse(null);
        if (report == null) {
            ClientPathAccessGuard.deny(DENIAL_RESOURCE_UNAVAILABLE, caller, "reportId", reportId);
        }
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
        ConsultantAvailability availability = availabilityId == null ? null
            : availabilityRepository.findByTenantIdAndId(tenantId, availabilityId).orElse(null);
        if (availability == null) {
            ClientPathAccessGuard.deny(DENIAL_RESOURCE_UNAVAILABLE, caller, "availabilityId", availabilityId);
        }
        clientPathAccessGuard.assertCanAccessConsultant(caller, availability.getConsultantId());
    }

    private ConsultationRecord loadAccessibleRecord(User caller, Long consultationRecordId) {
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        ConsultationRecord record = consultationRecordId == null ? null
            : consultationRecordRepository.findByTenantIdAndId(tenantId, consultationRecordId).orElse(null);
        if (record == null || record.getClientId() == null) {
            ClientPathAccessGuard.deny(DENIAL_RESOURCE_UNAVAILABLE, caller, "consultationRecordId",
                consultationRecordId);
        }
        clientPathAccessGuard.assertCanAccessClient(caller, record.getClientId());
        return record;
    }
}
