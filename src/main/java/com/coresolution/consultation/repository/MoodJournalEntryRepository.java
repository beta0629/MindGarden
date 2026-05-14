package com.coresolution.consultation.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.MoodJournalEntry;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 감정 일기 저장소.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Repository
public interface MoodJournalEntryRepository extends BaseRepository<MoodJournalEntry, Long> {

    @Query("SELECT e FROM MoodJournalEntry e WHERE e.tenantId = :tenantId AND e.clientId = :clientId "
        + "AND e.isDeleted = false AND e.journalDate BETWEEN :from AND :to ORDER BY e.journalDate")
    List<MoodJournalEntry> findByTenantClientAndDateRange(
        @Param("tenantId") String tenantId,
        @Param("clientId") Long clientId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to);

    @Query("SELECT e FROM MoodJournalEntry e WHERE e.tenantId = :tenantId AND e.clientId = :clientId "
        + "AND e.journalDate = :day AND e.isDeleted = false")
    Optional<MoodJournalEntry> findByTenantClientAndDate(
        @Param("tenantId") String tenantId,
        @Param("clientId") Long clientId,
        @Param("day") LocalDate day);
}
