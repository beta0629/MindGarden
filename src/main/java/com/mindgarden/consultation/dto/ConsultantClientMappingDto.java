package com.mindgarden.consultation.dto;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantClientMappingDto {
    private Long consultantId;
    private Long clientId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String notes;
    private String responsibility;
    private String specialConsiderations;
    private String assignedBy;
}
