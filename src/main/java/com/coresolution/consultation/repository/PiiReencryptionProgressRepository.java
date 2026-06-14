package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.coresolution.consultation.entity.PiiReencryptionProgress;

/**
 * {@link PiiReencryptionProgress} JPA Repository.
 *
 * <p>PII 재암호화 chunk 진행률 SSOT 의 조회·갱신 진입점. 본 Repository 는 단일 행 신설·상태
 * 갱신 외에 chunk 일련번호 / 마지막 DONE chunk 의 종료 ID / 실패 chunk 목록 조회 헬퍼를
 * 제공한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-15
 */
@Repository
public interface PiiReencryptionProgressRepository extends JpaRepository<PiiReencryptionProgress, Long> {

    /**
     * 동일 (테이블, target_key_id) 의 다음 chunk_no 를 계산한다.
     *
     * <p>기존 chunk 가 0건이면 0 을 반환한다.</p>
     */
    @Query("SELECT COALESCE(MAX(p.chunkNo), -1) + 1 "
        + "FROM PiiReencryptionProgress p "
        + "WHERE p.tableName = :tableName AND p.targetKeyId = :targetKeyId")
    int findNextChunkNo(@Param("tableName") String tableName,
                        @Param("targetKeyId") String targetKeyId);

    /**
     * 마지막으로 DONE 처리된 chunk 의 종료 PK 를 조회한다. 없으면 0 반환.
     */
    @Query("SELECT COALESCE(MAX(p.chunkEndId), 0) "
        + "FROM PiiReencryptionProgress p "
        + "WHERE p.tableName = :tableName AND p.targetKeyId = :targetKeyId AND p.status = 'DONE'")
    long findLastDoneEndId(@Param("tableName") String tableName,
                           @Param("targetKeyId") String targetKeyId);

    /** 실패 chunk 목록 (재시도 대상) 조회. */
    List<PiiReencryptionProgress> findByTableNameAndTargetKeyIdAndStatusOrderByChunkNoAsc(
        String tableName, String targetKeyId, String status);

    /** 동일 (테이블, target_key_id) chunk 전체 — 진행률 / 통계 조회용. */
    List<PiiReencryptionProgress> findByTableNameAndTargetKeyIdOrderByChunkNoAsc(
        String tableName, String targetKeyId);

    /** 단일 chunk 조회 (resume 시 단건 갱신용). */
    Optional<PiiReencryptionProgress> findByTableNameAndChunkNoAndTargetKeyId(
        String tableName, Integer chunkNo, String targetKeyId);
}
