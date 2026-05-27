package com.coresolution.consultation.dto.erp.accounting;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import com.coresolution.consultation.entity.erp.accounting.AccountingEntry;
import com.coresolution.consultation.entity.erp.accounting.JournalEntryLine;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 분개 상세 응답 DTO.
 * <p>
 * 목록 DTO 와 별도로 분리하여 후속 변경(첨부·승인 이력·감사 로그 등) 시 목록 응답을
 * 무겁게 만들지 않도록 한다. LAZY 컬렉션 직렬화 회피를 위해 {@link AccountingEntry#getLines()}
 * 매핑은 서비스 트랜잭션 경계 안에서 수행한다.
 *
 * @author MindGarden
 * @since 2026-05-27
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountingEntryDetailDto {

    private Long id;
    private String tenantId;
    private String entryNumber;
    private LocalDate entryDate;
    private String description;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private String entryStatus;
    private String approvalStatus;
    private Long approverId;
    private LocalDateTime approvedAt;
    private String approvalComment;
    private LocalDateTime postedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 분개 라인 수 (lines.size()).
     */
    private Integer lineCount;

    /**
     * 분개 상세 라인 목록.
     */
    @Builder.Default
    private List<JournalEntryLineDto> lines = Collections.emptyList();

    /**
     * 엔티티에서 상세 DTO 로 변환.
     * 호출 시점은 반드시 {@code @Transactional} 경계 안이어야 한다.
     *
     * @param entity 분개 엔티티 (null 허용)
     * @return DTO, entity 가 null 이면 null
     */
    public static AccountingEntryDetailDto fromEntity(AccountingEntry entity) {
        if (entity == null) {
            return null;
        }
        List<JournalEntryLine> entityLines = entity.getLines();
        List<JournalEntryLineDto> mappedLines = entityLines == null
                ? Collections.emptyList()
                : entityLines.stream()
                        .filter(line -> line != null && !Boolean.TRUE.equals(line.getIsDeleted()))
                        .map(JournalEntryLineDto::fromEntity)
                        .collect(Collectors.toList());
        return AccountingEntryDetailDto.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .entryNumber(entity.getEntryNumber())
                .entryDate(entity.getEntryDate())
                .description(entity.getDescription())
                .totalDebit(entity.getTotalDebit())
                .totalCredit(entity.getTotalCredit())
                .entryStatus(entity.getEntryStatus() != null ? entity.getEntryStatus().name() : null)
                .approvalStatus(entity.getApprovalStatus() != null ? entity.getApprovalStatus().name() : null)
                .approverId(entity.getApproverId())
                .approvedAt(entity.getApprovedAt())
                .approvalComment(entity.getApprovalComment())
                .postedAt(entity.getPostedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .lineCount(mappedLines.size())
                .lines(mappedLines)
                .build();
    }
}
