package com.coresolution.consultation.service.impl;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import com.coresolution.consultation.constant.SelfAssessmentType;
import com.coresolution.consultation.dto.selfassessment.SelfAssessmentInterpretationJson;
import com.coresolution.consultation.dto.selfassessment.SelfAssessmentInterpretationResponse;
import com.coresolution.consultation.dto.selfassessment.SelfAssessmentResultResponse;
import com.coresolution.consultation.dto.selfassessment.SelfAssessmentSubmitRequest;
import com.coresolution.consultation.entity.SelfAssessmentSubmission;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.SelfAssessmentSubmissionRepository;
import com.coresolution.consultation.service.SelfAssessmentService;
import com.coresolution.consultation.service.selfassessment.SelfAssessmentInterpretationCalculator;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link SelfAssessmentService} 구현.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SelfAssessmentServiceImpl implements SelfAssessmentService {

    private static final ZoneId DISPLAY_ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter ISO_OFFSET = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final SelfAssessmentSubmissionRepository submissionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SelfAssessmentResultResponse> listMine(User client) {
        assertTenantMatchesUser(client);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return submissionRepository.findByTenantAndClientOrderByCreatedAtDesc(tenantId, client.getId()).stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SelfAssessmentResultResponse getMineById(User client, long id) {
        assertTenantMatchesUser(client);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        SelfAssessmentSubmission s = submissionRepository.findByTenantClientAndId(tenantId, client.getId(), id)
            .orElseThrow(() -> new EntityNotFoundException("SelfAssessmentSubmission", id));
        return toResponse(s);
    }

    @Override
    public SelfAssessmentResultResponse submit(User client, SelfAssessmentSubmitRequest request) {
        assertTenantMatchesUser(client);
        SelfAssessmentType type = SelfAssessmentType.fromClient(request.getType())
            .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 type 입니다."));
        List<Integer> answers = request.getAnswers();
        if (answers == null || answers.size() != type.expectedAnswerCount()) {
            throw new IllegalArgumentException("answers 개수가 올바르지 않습니다.");
        }
        validateAnswerValues(type, answers);
        int total = SelfAssessmentInterpretationCalculator.calculateTotalScore(type, answers);
        SelfAssessmentInterpretationJson interpretation =
            SelfAssessmentInterpretationCalculator.interpret(type, total);

        SelfAssessmentSubmission s = new SelfAssessmentSubmission();
        s.setTenantId(TenantContextHolder.getRequiredTenantId());
        s.setClientId(client.getId());
        s.setAssessmentType(type);
        s.setAnswers(new ArrayList<>(answers));
        s.setTotalScore(total);
        s.setInterpretation(interpretation);
        s.setSharedWithConsultant(Boolean.TRUE.equals(request.getSharedWithConsultant()));
        submissionRepository.save(s);
        return toResponse(s);
    }

    @Override
    public void updateShare(User client, long id, boolean sharedWithConsultant) {
        assertTenantMatchesUser(client);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        SelfAssessmentSubmission s = submissionRepository.findByTenantClientAndId(tenantId, client.getId(), id)
            .orElseThrow(() -> new EntityNotFoundException("SelfAssessmentSubmission", id));
        s.setSharedWithConsultant(sharedWithConsultant);
        submissionRepository.save(s);
    }

    private void validateAnswerValues(SelfAssessmentType type, List<Integer> answers) {
        for (Integer a : answers) {
            if (a == null) {
                throw new IllegalArgumentException("answers에 null이 포함되어 있습니다.");
            }
        }
        int min;
        int max;
        if (type == SelfAssessmentType.PSS) {
            min = 0;
            max = 4;
        } else {
            min = 0;
            max = 3;
        }
        for (int v : answers) {
            if (v < min || v > max) {
                throw new IllegalArgumentException("answers 값 범위가 올바르지 않습니다.");
            }
        }
    }

    private SelfAssessmentResultResponse toResponse(SelfAssessmentSubmission s) {
        SelfAssessmentInterpretationJson j = s.getInterpretation();
        SelfAssessmentInterpretationResponse interp = SelfAssessmentInterpretationResponse.builder()
            .level(j != null ? j.getLevel() : null)
            .severity(j != null ? j.getSeverity() : null)
            .description(j != null ? j.getDescription() : null)
            .build();
        return SelfAssessmentResultResponse.builder()
            .id(String.valueOf(s.getId()))
            .type(s.getAssessmentType().name())
            .answers(s.getAnswers() == null ? List.of() : List.copyOf(s.getAnswers()))
            .totalScore(s.getTotalScore())
            .interpretation(interp)
            .sharedWithConsultant(s.isSharedWithConsultant())
            .createdAt(formatOffset(s.getCreatedAt()))
            .build();
    }

    private static String formatOffset(java.time.LocalDateTime t) {
        if (t == null) {
            return null;
        }
        return t.atZone(DISPLAY_ZONE).format(ISO_OFFSET);
    }

    private void assertTenantMatchesUser(User user) {
        String ctx = TenantContextHolder.getRequiredTenantId();
        if (user.getTenantId() == null || user.getTenantId().isBlank() || !ctx.equals(user.getTenantId())) {
            throw new AccessDeniedException("테넌트 정보가 일치하지 않습니다.");
        }
    }
}
