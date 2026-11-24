package com.coresolution.consultation.sct.entity;

import com.coresolution.consultation.converter.ConsultationBodyAttributeConverter;
import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * SCT 영역별 상담사 메모. 본문은 ConsultationBodyAttributeConverter(랜덤 IV).
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Entity
@Table(name = "sct_domain_memos", uniqueConstraints = {
    @UniqueConstraint(name = "uk_sct_domain_memo_inv_domain",
            columnNames = {"invitation_id", "domain_code", "is_deleted"})
}, indexes = {
    @Index(name = "idx_sct_domain_memo_tenant_inv", columnList = "tenant_id,invitation_id")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class SctDomainMemo extends BaseEntity {

    @Column(name = "invitation_id", nullable = false)
    private Long invitationId;

    @Column(name = "domain_code", nullable = false, length = 64)
    private String domainCode;

    @Convert(converter = ConsultationBodyAttributeConverter.class)
    @Column(name = "memo_text_enc", columnDefinition = "TEXT")
    private String memoText;

    @Column(name = "author_user_id", nullable = false)
    private Long authorUserId;
}
