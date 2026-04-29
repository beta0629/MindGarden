package com.coresolution.consultation.repository;

import java.util.List;
import com.coresolution.consultation.entity.ClientScheduleNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 내담자 스케줄 특이사항 저장소.
 *
 * @author CoreSolution
 * @since 2026-04-29
 */
@Repository
public interface ClientScheduleNoteRepository extends JpaRepository<ClientScheduleNote, Long> {

    @Query("SELECT n FROM ClientScheduleNote n WHERE n.tenantId = :tenantId AND n.scheduleId = :sid "
            + "AND (n.isDeleted = false OR :inc = true) ORDER BY n.createdAt DESC")
    List<ClientScheduleNote> listBySchedule(
            @Param("tenantId") String tenantId,
            @Param("sid") Long scheduleId,
            @Param("inc") boolean includeDeleted);

    @Query("SELECT n FROM ClientScheduleNote n WHERE n.tenantId = :tenantId AND n.clientId = :cid "
            + "AND (n.isDeleted = false OR :inc = true) ORDER BY n.createdAt DESC")
    List<ClientScheduleNote> listByClient(
            @Param("tenantId") String tenantId,
            @Param("cid") Long clientId,
            @Param("inc") boolean includeDeleted);

    @Query("SELECT n FROM ClientScheduleNote n WHERE n.tenantId = :tenantId AND n.mappingId = :mid "
            + "AND (n.isDeleted = false OR :inc = true) ORDER BY n.createdAt DESC")
    List<ClientScheduleNote> listByMapping(
            @Param("tenantId") String tenantId,
            @Param("mid") Long mappingId,
            @Param("inc") boolean includeDeleted);
}
