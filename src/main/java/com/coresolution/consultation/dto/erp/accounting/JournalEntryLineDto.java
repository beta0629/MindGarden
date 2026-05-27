package com.coresolution.consultation.dto.erp.accounting;

import java.math.BigDecimal;
import com.coresolution.consultation.entity.erp.accounting.JournalEntryLine;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 분개 상세 라인 응답 DTO.
 * <p>
 * {@link JournalEntryLine} 엔티티의 직렬화 시 발생하는 {@code LazyInitializationException}
 * 회피 및 응답 스키마 안정화를 위해 도입한다. 매핑은 트랜잭션 경계 안에서 수행되어야 한다.
 *
 * @author MindGarden
 * @since 2026-05-27
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntryLineDto {

    private Long id;
    private String tenantId;
    private Long accountId;
    private Integer lineNumber;
    private BigDecimal debitAmount;
    private BigDecimal creditAmount;
    private String description;

    /**
     * 엔티티에서 응답 DTO 로 변환.
     * 호출 시점은 반드시 {@code @Transactional} 경계 안이어야 한다.
     *
     * @param entity 분개 라인 엔티티 (null 허용)
     * @return DTO, entity 가 null 이면 null
     */
    public static JournalEntryLineDto fromEntity(JournalEntryLine entity) {
        if (entity == null) {
            return null;
        }
        return JournalEntryLineDto.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .accountId(entity.getAccountId())
                .lineNumber(entity.getLineNumber())
                .debitAmount(entity.getDebitAmount())
                .creditAmount(entity.getCreditAmount())
                .description(entity.getDescription())
                .build();
    }
}
