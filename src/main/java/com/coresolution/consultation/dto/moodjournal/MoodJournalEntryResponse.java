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
    /**
     * 사용자가 상담사 공유를 의도했지만 활성 매핑 부재 등으로 푸시 발송이 skip / 실패한 경우 {@code true}.
     * 일기 저장 자체는 항상 성공한다 (트랜잭션 분리, best-effort 푸시).
     *
     * @since 2026-06-09
     */
    boolean consultantSharePending;
    String createdAt;
}
