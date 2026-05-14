package com.coresolution.consultation.service;

import java.time.LocalDate;
import java.util.List;
import com.coresolution.consultation.dto.moodjournal.MoodJournalEntryResponse;
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

    /**
     * 월별 목록.
     *
     * @param client 내담자 세션 사용자
     * @param month    yyyy-MM
     * @return 해당 월 일기 배열
     */
    List<MoodJournalEntryResponse> listMonth(User client, String month);

    /**
     * 일자별 상세.
     *
     * @param client 내담자
     * @param date     yyyy-MM-dd
     * @return 일기 또는 없으면 null
     */
    MoodJournalEntryResponse getByDate(User client, LocalDate date);

    /**
     * 신규 저장(동일 일자가 있으면 갱신).
     *
     * @param client  내담자
     * @param request 본문
     * @return 저장 결과
     */
    MoodJournalEntryResponse createOrReplace(User client, MoodJournalUpsertRequest request);

    /**
     * 일자 기준 수정.
     *
     * @param client  내담자
     * @param date    경로 일자
     * @param request 본문
     * @return 수정 결과
     */
    MoodJournalEntryResponse updateByDate(User client, LocalDate date, MoodJournalUpsertRequest request);

    /**
     * 일자 기준 소프트 삭제.
     *
     * @param client 내담자
     * @param date   일자
     */
    void deleteByDate(User client, LocalDate date);

    /**
     * 기간별 통계 행.
     *
     * @param client 내담자
     * @param period weekly | monthly
     * @return 날짜별 값(없으면 0)
     */
    List<MoodStatRowResponse> stats(User client, String period);
}
