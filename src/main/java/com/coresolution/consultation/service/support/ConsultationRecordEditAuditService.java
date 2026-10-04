package com.coresolution.consultation.service.support;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.entity.ConsultationRecordEditAudit;
import com.coresolution.consultation.repository.ConsultationRecordEditAuditRepository;
import com.coresolution.consultation.util.ConsultationRecordChangedFields;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 상담일지 작성·수정 감사 기록 서비스.
 *
 * <p>일지 저장과 <strong>같은 트랜잭션</strong>에서 1행을 남긴다. 저장이 롤백되면 감사 행도 남지 않으므로
 * "성공한 작성·수정 1건 = 감사 1행" 이 유지된다. 필드명만 저장하며 본문 값은 받지도 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConsultationRecordEditAuditService {

    private final ConsultationRecordEditAuditRepository consultationRecordEditAuditRepository;

    /**
     * 작성·수정 감사 1행 기록.
     *
     * @param tenantId      테넌트 ID (필수)
     * @param recordId      상담일지 ID (필수)
     * @param action        {@code ConsultationRecordAccessAudit.ACTION_CREATE}·{@code ACTION_EDIT}
     * @param writer        실제 작성·수정자 (null 이면 시스템)
     * @param changedFields 바뀐 필드명 목록 (값 아님)
     * @return 저장된 감사 행
     * @throws IllegalArgumentException tenantId·recordId·action 이 없을 때
     */
    @Transactional
    public ConsultationRecordEditAudit record(String tenantId, Long recordId, String action,
            ConsultationRecordWriter writer, List<String> changedFields) {
        if (tenantId == null || tenantId.isBlank() || recordId == null || action == null) {
            throw new IllegalArgumentException("상담일지 수정 감사에 필요한 식별자가 없습니다.");
        }
        ConsultationRecordEditAudit audit = ConsultationRecordEditAudit.builder()
                .recordId(recordId)
                .action(action)
                .editorId(writer != null ? writer.userId() : null)
                .editorRole(writer != null ? writer.role() : null)
                .changedFields(ConsultationRecordChangedFields.join(changedFields))
                .editedAt(LocalDateTime.now())
                .build();
        audit.setTenantId(tenantId);
        ConsultationRecordEditAudit saved = consultationRecordEditAuditRepository.save(audit);
        log.info("상담일지 {} 감사 기록: recordId={}, editorId={}, changedFieldCount={}",
                action, recordId, audit.getEditorId(), changedFields != null ? changedFields.size() : 0);
        return saved;
    }
}
