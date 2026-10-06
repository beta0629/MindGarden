package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.Set;
import java.util.TreeSet;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 내담자 직접 예약(가예약 신청) 요청.
 *
 * <p>내담자·테넌트·상태·결제 수단은 받지 않는다. 내담자는 세션 사용자, 테넌트는 TenantContextHolder 에서 정한다.
 * 정의되지 않은 필드(clientId 등)가 오면 검증 오류로 거부한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@Getter
@Setter
@NoArgsConstructor
public class ClientDirectBookingRequest {

    /** 상담 유형 코드 최대 길이 (common_codes.code_value 컬럼과 동일) */
    public static final int CONSULTATION_TYPE_MAX_LENGTH = 50;

    /** 요청 메모 최대 길이 */
    public static final int MEMO_MAX_LENGTH = 500;

    @NotNull(message = "상담사를 선택해 주세요.")
    private Long consultantId;

    @NotNull(message = "예약 날짜를 선택해 주세요.")
    private LocalDate date;

    @NotNull(message = "시작 시간을 선택해 주세요.")
    private LocalTime startTime;

    @NotNull(message = "종료 시간을 선택해 주세요.")
    private LocalTime endTime;

    /** 공통코드 CONSULTATION_TYPE 의 활성 code_value */
    @NotBlank(message = "상담 유형을 선택해 주세요.")
    @Size(max = CONSULTATION_TYPE_MAX_LENGTH, message = "상담 유형 값이 올바르지 않습니다.")
    private String consultationType;

    @Size(max = MEMO_MAX_LENGTH, message = "메모는 500자 이내로 입력해 주세요.")
    private String memo;

    @JsonIgnore
    private final Set<String> unexpectedFields = new TreeSet<>();

    /**
     * 정의되지 않은 필드 이름을 모은다 (값은 보관하지 않음).
     *
     * @param name  필드 이름
     * @param value 값 (무시)
     */
    @JsonAnySetter
    public void captureUnexpectedField(String name, Object value) {
        unexpectedFields.add(name);
    }

    /**
     * @return 정의되지 않은 필드 이름 (읽기 전용)
     */
    @JsonIgnore
    public Set<String> getUnexpectedFields() {
        return Collections.unmodifiableSet(unexpectedFields);
    }

    /**
     * @return 정의되지 않은 필드가 없으면 true
     */
    @JsonIgnore
    @AssertTrue(message = "허용되지 않은 항목이 포함되어 있습니다. 내담자 정보는 로그인 정보로만 정해집니다.")
    public boolean isWithoutUnexpectedFields() {
        return unexpectedFields.isEmpty();
    }

    /**
     * @return 종료가 시작보다 뒤이면 true (둘 중 하나가 없으면 @NotNull 이 처리)
     */
    @JsonIgnore
    @AssertTrue(message = "종료 시간은 시작 시간보다 뒤여야 합니다.")
    public boolean isEndAfterStart() {
        return startTime == null || endTime == null || endTime.isAfter(startTime);
    }
}
