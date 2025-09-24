package com.mindgarden.consultation.entity;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ConsultantPerformance 복합 키 클래스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantPerformanceId implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long consultantId;
    private LocalDate performanceDate;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ConsultantPerformanceId that = (ConsultantPerformanceId) o;
        return Objects.equals(consultantId, that.consultantId) &&
               Objects.equals(performanceDate, that.performanceDate);
    }

    @Override
    public int hashCode() {
        return Objects.hash(consultantId, performanceDate);
    }
}
