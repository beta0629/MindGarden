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
 * 분개 목록 응답 DTO.
 * <p>
 * {@link AccountingEntry#getLines()} 가 LAZY 컬렉션이라 컨트롤러에서 엔티티를 그대로
 * 직렬화하면 {@code LazyInitializationException} 이 발생한다. 본 DTO 는 서비스 트랜잭션
 * 경계 안에서 매핑되며, 프론트엔드(분개 탭, 원장 모달 등)가 사용하는 라인 목록을 함께
 * 포함한다.
 *
 * @author MindGarden
 * @since 2026-05-27
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountingEntryListDto {

    private Long id;
    private String tenantId;
    private String entryNumber;
    private LocalDate entryDate;
    private String description;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private String entryStatus;
    private String approvalStatus;
    private LocalDateTime createdAt;

    /**
     * 분개 라인 수 (lines.size()).
     * 프론트엔드 카운터·요약 표시 용도.
     */
    private Integer lineCount;

    /**
     * 분개 상세 라인 목록.
     * <p>
     * 프론트엔드 {@code LedgerDetailModal} 에서 목록 응답의 {@code entry.lines} 를 사용해
     * 계정별 필터링을 수행하므로 목록 응답에도 포함한다.
     */
    @Builder.Default
    private List<JournalEntryLineDto> lines = Collections.emptyList();

    /**
     * 엔티티에서 목록용 DTO 로 변환.
     * 호출 시점은 반드시 {@code @Transactional} 경계 안이어야 한다.
     *
     * @param entity 분개 엔티티 (null 허용)
     * @return DTO, entity 가 null 이면 null
     */
    public static AccountingEntryListDto fromEntity(AccountingEntry entity) {
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
        return AccountingEntryListDto.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .entryNumber(entity.getEntryNumber())
                .entryDate(entity.getEntryDate())
                .description(entity.getDescription())
                .totalDebit(entity.getTotalDebit())
                .totalCredit(entity.getTotalCredit())
                .entryStatus(entity.getEntryStatus() != null ? entity.getEntryStatus().name() : null)
                .approvalStatus(entity.getApprovalStatus() != null ? entity.getApprovalStatus().name() : null)
                .createdAt(entity.getCreatedAt())
                .lineCount(mappedLines.size())
                .lines(mappedLines)
                .build();
    }
}
