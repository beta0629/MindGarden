package com.coresolution.consultation.dto.moodjournal;

import java.util.List;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 감정 일기 생성·수정 요청 (POST 본문 또는 PUT 본문).
 * 세부 길이·척도는 서비스에서 검증한다.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
public class MoodJournalUpsertRequest {

    /** POST 시 필수, yyyy-MM-dd */
    @Size(min = 10, max = 10)
    private String date;

    @NotNull
    private Integer moodValue;

    @NotNull
    private List<String> tags;

    @NotNull
    private String memo;

    @NotNull
    private Boolean sharedWithConsultant;
}
