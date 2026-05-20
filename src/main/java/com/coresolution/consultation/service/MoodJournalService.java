package com.coresolution.consultation.service;

import java.time.LocalDate;
import java.util.List;
import com.coresolution.consultation.dto.moodjournal.MoodJournalEntryResponse;
import com.coresolution.consultation.dto.moodjournal.MoodJournalInboxItemResponse;
import com.coresolution.consultation.dto.moodjournal.MoodJournalUpsertRequest;
import com.coresolution.consultation.dto.moodjournal.MoodStatRowResponse;
import com.coresolution.consultation.entity.User;

/**
 * Expo {@code MOOD_JOURNAL_API} 서비스.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
public interface MoodJournalService {

    List<MoodJournalEntryResponse> listMonth(User client, String month);

    MoodJournalEntryResponse getByDate(User client, LocalDate date);

    MoodJournalEntryResponse createOrReplace(User client, MoodJournalUpsertRequest request);

    MoodJournalEntryResponse updateByDate(User client, LocalDate date, MoodJournalUpsertRequest request);

    void deleteByDate(User client, LocalDate date);

    List<MoodStatRowResponse> stats(User client, String period);

    /**
     * 상담사 수신함 — ACTIVE 매칭 내담자의 {@code sharedWithConsultant=true} 일기.
     *
     * @param consultant 상담사 세션 사용자
     * @return 수신함 항목(최신 일자 순)
     */
    List<MoodJournalInboxItemResponse> listInboxForConsultant(User consultant);
}
