package com.coresolution.consultation.dto.moodjournal;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

/**
 * 상담사 감정 일기 수신함 항목 — Expo {@code MoodJournalInboxItem}.
 *
 * @author MindGarden
 * @since 2026-05-21
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.ALWAYS)
public class MoodJournalInboxItemResponse {

    Long id;
    Long clientId;
    String clientName;
    String date;
    int moodValue;
    String emoji;
    List<String> tags;
    String memo;
    boolean sharedWithConsultant;
    String createdAt;
    String updatedAt;
}
