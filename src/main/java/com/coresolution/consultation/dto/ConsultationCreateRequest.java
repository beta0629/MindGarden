package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 상담 요청(Consultation) 생성 — 센터(관리자·사무원) 전용 명시 필드.
 *
 * <p>상태·테넌트·버전·생성일은 받지 않는다. 내담자 직접 예약은 {@code POST /api/v1/clients/me/bookings} 이다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@Getter
@Setter
@NoArgsConstructor
public class ConsultationCreateRequest {

    /** consultations.title 컬럼 길이 */
    public static final int TITLE_MAX_LENGTH = 200;

    /** consultations.consultation_method 컬럼 길이 */
    public static final int METHOD_MAX_LENGTH = 20;

    /** 메모 최대 길이 */
    public static final int NOTES_MAX_LENGTH = 500;

    @NotNull(message = "상담사를 선택해 주세요.")
    private Long consultantId;

    @NotNull(message = "내담자를 선택해 주세요.")
    private Long clientId;

    @NotNull(message = "상담 날짜를 입력해 주세요.")
    private LocalDate consultationDate;

    @NotNull(message = "시작 시간을 입력해 주세요.")
    private LocalTime startTime;

    @NotNull(message = "종료 시간을 입력해 주세요.")
    private LocalTime endTime;

    @NotBlank(message = "상담 제목을 입력해 주세요.")
    @Size(max = TITLE_MAX_LENGTH, message = "상담 제목은 200자 이내로 입력해 주세요.")
    private String title;

    @Size(max = METHOD_MAX_LENGTH, message = "상담 방식 값이 올바르지 않습니다.")
    private String consultationMethod;

    @Size(max = NOTES_MAX_LENGTH, message = "메모는 500자 이내로 입력해 주세요.")
    private String notes;

    /**
     * @return 종료가 시작보다 뒤이면 true (둘 중 하나가 없으면 @NotNull 이 처리)
     */
    @JsonIgnore
    @AssertTrue(message = "종료 시간은 시작 시간보다 뒤여야 합니다.")
    public boolean isEndAfterStart() {
        return startTime == null || endTime == null || endTime.isAfter(startTime);
    }
}
