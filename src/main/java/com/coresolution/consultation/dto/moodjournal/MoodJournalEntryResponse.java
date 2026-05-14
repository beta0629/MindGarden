package com.coresolution.consultation.dto.moodjournal;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

/**
 * Expo {@link com.coresolution.consultation.service.MoodJournalService} 응답 — {@code MoodJournalEntry}.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MoodJournalEntryResponse {

    String date;
    int moodValue;
    String emoji;
    List<String> tags;
    String memo;
    boolean sharedWithConsultant;
    String createdAt;
}
