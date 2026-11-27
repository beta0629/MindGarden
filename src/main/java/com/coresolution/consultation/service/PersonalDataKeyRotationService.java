package com.coresolution.consultation.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.coresolution.consultation.dto.security.PiiRotationResult;
import com.coresolution.consultation.entity.PiiReencryptionProgress;
import com.coresolution.consultation.entity.PiiReencryptionProgress.Status;
import com.coresolution.consultation.repository.PiiReencryptionProgressRepository;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.util.LogSanitizer;

import lombok.extern.slf4j.Slf4j;

/**
 * PII KEY/IV 회전 인프라 (Phase 1).
 *
 * <p>{@code PersonalDataEncryptionUtil} 의 dual-read 인프라를 확장하여 chunk 단위로 운영
 * PII 컬럼을 활성 키 ({@code PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID}) 로 재암호화한다.
 * Phase 1 인프라이며 실제 운영 회전 실행은 별도 PR (Phase 2) 에서 트리거 한다.</p>
 *
 * <h3>회전 대상</h3>
 * <ul>
 *   <li>{@code users} — 7컬럼 (email, name, nickname, phone, gender, address, rrn_encrypted)</li>
 *   <li>{@code clients} — 7컬럼 (name, email, phone, gender, address, emergency_contact, emergency_phone)</li>
 *   <li>{@code accounts} — 2컬럼 (account_number, account_holder) — 평문 → 암호화 백필 포함</li>
 *   <li>{@code branches} — 4컬럼 (phone_number, fax_number, email, address) — 평문 → 암호화 백필 포함</li>
 *   <li>{@code dormant_user_pii_vault} — 1컬럼 (encrypted_pii) — 별도 키 (AES-GCM) 로 별도 처리</li>
 * </ul>
 *
 * <h3>설계 핵심</h3>
 * <ul>
 *   <li>JdbcTemplate 직접 사용 — JPA AttributeConverter 의 자동 암복호화 경로를 우회하여
 *       원본 ciphertext 를 그대로 다룬다. {@code ensureActiveKeyEncryption} 의 idempotency
 *       에 의해 활성 키로 이미 암호화된 row 는 no-op 처리된다.</li>
 *   <li>chunk 1개 = 트랜잭션 1개 — {@link TransactionTemplate} 사용. chunk 도중 실패 시
 *       해당 chunk 만 rollback 되고 진행률은 FAILED 로 marking, 다음 chunk 는 계속 진행.</li>
 *   <li>seek 기반 pagination — 마지막 DONE chunk 의 종료 ID 이후부터 재개.</li>
 *   <li>로그 인젝션 차단 — {@link LogSanitizer#forLog(String)} 으로 외부 입력 sanitize.
 *       평문 / 암호문 PII 는 절대 출력하지 않는다.</li>
 * </ul>
 *
 * <h3>관련 표준</h3>
 * <ul>
 *   <li>{@code docs/standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md} §3.2</li>
 *   <li>{@code docs/standards/SECRET_ROTATION_POLICY.md} v1.2.0 §3.4</li>
 *   <li>{@code docs/standards/PII_PROTECTION_STANDARD.md}</li>
 * </ul>
 *
 * @author CoreSolution
 * @author MindGarden
 * @version 2.0.0
 * @since 2026-06-15
 */
@Slf4j
@Service
public class PersonalDataKeyRotationService {

    /** 기본 chunk 크기 — 운영 가이드에서 조정 가능. */
    public static final int DEFAULT_CHUNK_SIZE = 100;

    /** chunk size 허용 범위 — 너무 큰 값은 트랜잭션 timeout / lock 위험. */
    public static final int MIN_CHUNK_SIZE = 1;
    public static final int MAX_CHUNK_SIZE = 1000;

    /** users 테이블 회전 컬럼 (Phase 1 §3.2.1 7컬럼). */
    public static final List<String> USERS_PII_COLUMNS = List.of(
        "email", "name", "nickname", "phone", "gender", "address", "rrn_encrypted"
    );

    /** clients 테이블 회전 컬럼 (Phase 1 §3.2.2 7컬럼). */
    public static final List<String> CLIENTS_PII_COLUMNS = List.of(
        "name", "email", "phone", "gender", "address", "emergency_contact", "emergency_phone"
    );

    /** accounts 테이블 평문 PII 컬럼 (백필 + 회전). */
    public static final List<String> ACCOUNTS_PII_COLUMNS = List.of(
        "account_number", "account_holder"
    );

    /** branches 테이블 평문 PII 컬럼 (백필 + 회전, deprecated 테이블이지만 잔존 데이터 보호). */
    public static final List<String> BRANCHES_PII_COLUMNS = List.of(
        "phone_number", "fax_number", "email", "address"
    );

    /** dormant_user_pii_vault 테이블의 단일 컬럼. */
    public static final String DORMANT_VAULT_TABLE = "dormant_user_pii_vault";
    public static final String DORMANT_VAULT_COLUMN = "encrypted_pii";

    /**
     * SQL injection 방어 — 회전 대상 테이블 화이트리스트.
     *
     * <p>SQL 식별자(테이블명) 동적 합성 시 본 set 에 포함된 값만 허용된다.
     * CodeQL Java 의 sql-injection sanitizer 휴리스틱이 {@link Set#contains(Object)}
     * 검증을 명시적 sanitizer 로 인식하도록 화이트리스트를 별도 상수로 분리하였다.</p>
     */
    public static final Set<String> ALLOWED_TABLES = Set.of(
        "users", "clients", "accounts", "branches", DORMANT_VAULT_TABLE
    );

    /**
     * SQL injection 방어 — 회전 대상 컬럼 화이트리스트.
     *
     * <p>모든 회전 대상 PII 컬럼 + {@code id} 의 union. SQL 식별자(컬럼명) 동적 합성 시
     * 본 set 포함 여부를 검증한 값만 사용한다.</p>
     */
    public static final Set<String> ALLOWED_COLUMNS;

    static {
        Set<String> cols = new HashSet<>();
        cols.add("id");
        cols.addAll(USERS_PII_COLUMNS);
        cols.addAll(CLIENTS_PII_COLUMNS);
        cols.addAll(ACCOUNTS_PII_COLUMNS);
        cols.addAll(BRANCHES_PII_COLUMNS);
        cols.add(DORMANT_VAULT_COLUMN);
        ALLOWED_COLUMNS = Collections.unmodifiableSet(cols);
    }

    private final JdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final PiiReencryptionProgressRepository progressRepository;

    /**
     * 운영 / 테스트 환경에서 평문 → 암호화 백필 (accounts / branches) 을 허용할지 여부.
     *
     * <p>이 플래그가 false 이면 accounts / branches 회전은 즉시 거부된다. Phase 2 PR 에서
     * 엔티티 @Convert 적용 후 본 플래그를 true 로 전환한다 (운영 yml 에서 control).</p>
     */
    private final boolean allowPlaintextEncryption;

    @Autowired
    public PersonalDataKeyRotationService(
            JdbcTemplate jdbcTemplate,
            PlatformTransactionManager transactionManager,
            PersonalDataEncryptionUtil encryptionUtil,
            PiiReencryptionProgressRepository progressRepository,
            @Value("${pii-rotation.allow-plaintext-encryption:false}") boolean allowPlaintextEncryption) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.encryptionUtil = encryptionUtil;
        this.progressRepository = progressRepository;
        this.allowPlaintextEncryption = allowPlaintextEncryption;
    }

    /**
     * 단위 테스트 용 — {@link TransactionTemplate} 을 직접 주입한다.
     *
     * <p>Spring 4.3+ 부터 다중 생성자가 있으면 어느 것을 inject 할지 모호해지므로,
     * 위 운영 생성자에 {@link Autowired} 를 명시했다. 이 생성자는 package-private 으로
     * Spring DI 대상이 아니며, 단위 테스트에서만 직접 호출된다.</p>
     */
    PersonalDataKeyRotationService(
            JdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            PersonalDataEncryptionUtil encryptionUtil,
            PiiReencryptionProgressRepository progressRepository,
            boolean allowPlaintextEncryption) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.encryptionUtil = encryptionUtil;
        this.progressRepository = progressRepository;
        this.allowPlaintextEncryption = allowPlaintextEncryption;
    }

    // ----------------------------------------------------------------
    // Public — 테이블별 회전 진입점
    // ----------------------------------------------------------------

    /**
     * users 테이블 7컬럼 chunk 회전.
     *
     * @param chunkSize chunk 크기 ({@link #MIN_CHUNK_SIZE} ~ {@link #MAX_CHUNK_SIZE})
     * @param targetKeyId 회전 목표 키 ID — Phase 1 에서는 활성 키와 같아야 한다
     * @return 회전 결과 집계
     */
    public PiiRotationResult rotateUserPersonalData(int chunkSize, String targetKeyId) {
        return rotateTableChunked("users", USERS_PII_COLUMNS, chunkSize, targetKeyId, false);
    }

    /** clients 테이블 7컬럼 chunk 회전 (별도 메서드 — §3.2.2). */
    public PiiRotationResult rotateClientPersonalData(int chunkSize, String targetKeyId) {
        return rotateTableChunked("clients", CLIENTS_PII_COLUMNS, chunkSize, targetKeyId, false);
    }

    /**
     * accounts 테이블 평문 PII 컬럼 백필 + 회전.
     *
     * <p>현재 accounts 엔티티는 @Convert 미적용이므로 본 메서드는 {@code allowPlaintextEncryption}
     * 플래그가 true 일 때만 동작한다 (Phase 2 PR 에서 변환기 추가 후 활성).</p>
     */
    public PiiRotationResult rotateAccountPersonalData(int chunkSize, String targetKeyId) {
        return rotateTableChunked("accounts", ACCOUNTS_PII_COLUMNS, chunkSize, targetKeyId, true);
    }

    /**
     * branches 테이블 평문 PII 컬럼 백필 + 회전.
     *
     * <p>{@code Branch} 엔티티는 {@code @Deprecated, forRemoval = true} 이지만, 잔존 PII 보호를
     * 위해 회전 메서드를 동일 인프라로 제공한다.</p>
     */
    public PiiRotationResult rotateBranchPersonalData(int chunkSize, String targetKeyId) {
        return rotateTableChunked("branches", BRANCHES_PII_COLUMNS, chunkSize, targetKeyId, true);
    }

    /**
     * dormant_user_pii_vault 1컬럼 회전.
     *
     * <p><strong>Phase 1 인프라 한정.</strong> 휴면 vault 는 AES-GCM + 단일 키 SSOT
     * ({@code MINDGARDEN_DORMANT_PII_ENC_KEY}) 를 사용한다. {@link PersonalDataEncryptionUtil}
     * 의 다중 키 인프라와 호환되지 않으므로 본 메서드는 chunk scan + progress 만 기록하고
     * 실제 ciphertext 는 변경하지 않는다 (no-op SKIPPED). Phase 2 PR 에서 dormant 다중 키
     * SSOT 가 추가되면 본 메서드를 활성 회전으로 전환한다.</p>
     */
    public PiiRotationResult rotateDormantPiiVault(int chunkSize, String targetKeyId) {
        return scanAndSkipChunked(DORMANT_VAULT_TABLE, List.of(DORMANT_VAULT_COLUMN),
            chunkSize, targetKeyId,
            "dormant vault rotation requires Phase 2 multi-key SSOT — chunk scan only");
    }

    // ----------------------------------------------------------------
    // Public — 진행률 / resume
    // ----------------------------------------------------------------

    /**
     * 진행률 집계 — chunk 상태별 카운트.
     */
    public Map<Status, Long> aggregateProgress(String tableName, String targetKeyId) {
        List<PiiReencryptionProgress> rows = progressRepository
            .findByTableNameAndTargetKeyIdOrderByChunkNoAsc(tableName, targetKeyId);
        return rows.stream()
            .map(PiiReencryptionProgress::statusEnum)
            .filter(Objects::nonNull)
            .collect(Collectors.groupingBy(s -> s, Collectors.counting()));
    }

    /**
     * 실패 chunk 재시도 — FAILED 상태 chunk 만 다시 회전 시도한다.
     */
    public PiiRotationResult resumeFailedChunks(String tableName, List<String> piiColumns,
                                                String targetKeyId) {
        validateTargetKey(targetKeyId, false);
        List<PiiReencryptionProgress> failed = progressRepository
            .findByTableNameAndTargetKeyIdAndStatusOrderByChunkNoAsc(
                tableName, targetKeyId, Status.FAILED.name());
        if (failed.isEmpty()) {
            log.info("재시도할 FAILED chunk 가 없습니다. table={}, targetKeyId={}",
                LogSanitizer.forLog(tableName), LogSanitizer.forLog(targetKeyId));
            return PiiRotationResult.builder()
                .tableName(tableName)
                .chunksProcessed(0).chunksDone(0).chunksFailed(0)
                .rowsScanned(0).rowsRotated(0)
                .activeKeyId(encryptionUtil.getActiveKeyId())
                .targetKeyId(targetKeyId)
                .build();
        }

        int totalScanned = 0;
        int totalRotated = 0;
        int chunksDone = 0;
        int chunksFailed = 0;
        for (PiiReencryptionProgress chunk : failed) {
            ChunkOutcome outcome = rerunChunk(tableName, piiColumns, chunk);
            totalScanned += outcome.rowsScanned;
            totalRotated += outcome.rowsRotated;
            if (outcome.success) {
                chunksDone++;
            } else {
                chunksFailed++;
            }
        }
        return PiiRotationResult.builder()
            .tableName(tableName)
            .chunksProcessed(failed.size())
            .chunksDone(chunksDone)
            .chunksFailed(chunksFailed)
            .rowsScanned(totalScanned)
            .rowsRotated(totalRotated)
            .activeKeyId(encryptionUtil.getActiveKeyId())
            .targetKeyId(targetKeyId)
            .build();
    }

    /**
     * 진행 중 (PENDING / IN_PROGRESS) chunk 를 SKIPPED 로 마킹하여 취소한다.
     *
     * <p>이미 DONE / FAILED chunk 는 변경하지 않는다.</p>
     *
     * @return 취소된 chunk 개수
     */
    public int cancelPendingChunks(String tableName, String targetKeyId) {
        int total = 0;
        for (Status pending : List.of(Status.PENDING, Status.IN_PROGRESS)) {
            List<PiiReencryptionProgress> rows = progressRepository
                .findByTableNameAndTargetKeyIdAndStatusOrderByChunkNoAsc(
                    tableName, targetKeyId, pending.name());
            for (PiiReencryptionProgress row : rows) {
                row.setStatusEnum(Status.SKIPPED);
                row.setFinishedAt(LocalDateTime.now());
                row.setErrorMessage("cancelled by admin");
                progressRepository.save(row);
                total++;
            }
        }
        log.info("PII 회전 취소 — table={}, targetKeyId={}, cancelled={} chunks",
            LogSanitizer.forLog(tableName), LogSanitizer.forLog(targetKeyId), total);
        return total;
    }

    // ----------------------------------------------------------------
    // Internal — 공통 chunk 회전 엔진
    // ----------------------------------------------------------------

    /**
     * chunk 단위 회전의 코어 엔진.
     *
     * @param tableName 회전 대상 테이블
     * @param piiColumns 재암호화 대상 컬럼 목록
     * @param chunkSize 1 chunk 의 row 수
     * @param targetKeyId 회전 목표 키 ID
     * @param requiresPlaintextFlag {@code true} 인 테이블은 {@link #allowPlaintextEncryption}
     *                              플래그가 true 일 때만 실제 회전 수행, 그 외에는 SKIPPED
     * @return 회전 결과 집계
     */
    PiiRotationResult rotateTableChunked(String tableName, List<String> piiColumns,
                                          int chunkSize, String targetKeyId,
                                          boolean requiresPlaintextFlag) {
        validateTableName(tableName);
        validateColumns(piiColumns);
        int normalizedChunkSize = normalizeChunkSize(chunkSize);
        validateTargetKey(targetKeyId, false);

        if (requiresPlaintextFlag && !allowPlaintextEncryption) {
            log.warn("PII 회전 SKIP — table={} 는 평문 백필 플래그가 비활성화되어 있습니다 (Phase 2 활성).",
                LogSanitizer.forLog(tableName));
            return emptyResult(tableName, targetKeyId,
                "plaintext encryption flag disabled — Phase 2 only");
        }

        if (!tableExists(tableName)) {
            log.warn("PII 회전 SKIP — table={} 가 현재 스키마에 존재하지 않습니다.",
                LogSanitizer.forLog(tableName));
            return emptyResult(tableName, targetKeyId, "table not found in current schema");
        }

        long lastDoneEndId = progressRepository.findLastDoneEndId(tableName, targetKeyId);
        long cursor = lastDoneEndId;
        int chunkNo = progressRepository.findNextChunkNo(tableName, targetKeyId);

        int chunksProcessed = 0;
        int chunksDone = 0;
        int chunksFailed = 0;
        int rowsScanned = 0;
        int rowsRotated = 0;

        log.info("PII 회전 시작 — table={}, columns={}, chunkSize={}, targetKeyId={}, resumeFromId={}",
            LogSanitizer.forLog(tableName),
            LogSanitizer.forLog(String.join(",", piiColumns)),
            normalizedChunkSize,
            LogSanitizer.forLog(targetKeyId),
            cursor);

        while (true) {
            List<Map<String, Object>> chunk = fetchChunk(tableName, piiColumns, cursor, normalizedChunkSize);
            if (chunk.isEmpty()) {
                break;
            }

            long chunkStartId = ((Number) chunk.get(0).get("id")).longValue();
            long chunkEndId = ((Number) chunk.get(chunk.size() - 1).get("id")).longValue();

            PiiReencryptionProgress progress = createProgressRow(
                tableName, chunkNo, chunkStartId, chunkEndId, chunk.size(), targetKeyId);

            ChunkOutcome outcome = runChunk(progress, tableName, piiColumns, chunk);

            chunksProcessed++;
            rowsScanned += outcome.rowsScanned;
            rowsRotated += outcome.rowsRotated;
            if (outcome.success) {
                chunksDone++;
            } else {
                chunksFailed++;
            }

            cursor = chunkEndId;
            chunkNo++;
        }

        log.info("PII 회전 종료 — table={}, chunks={}, done={}, failed={}, rowsScanned={}, rowsRotated={}",
            LogSanitizer.forLog(tableName), chunksProcessed, chunksDone, chunksFailed,
            rowsScanned, rowsRotated);

        return PiiRotationResult.builder()
            .tableName(tableName)
            .chunksProcessed(chunksProcessed)
            .chunksDone(chunksDone)
            .chunksFailed(chunksFailed)
            .rowsScanned(rowsScanned)
            .rowsRotated(rowsRotated)
            .activeKeyId(encryptionUtil.getActiveKeyId())
            .targetKeyId(targetKeyId)
            .build();
    }

    /**
     * 회전을 실행하지 않고 chunk scan + SKIPPED 마킹만 수행한다 (Phase 2 활성 플래그 비활성 시 사용).
     */
    PiiRotationResult scanAndSkipChunked(String tableName, List<String> piiColumns,
                                          int chunkSize, String targetKeyId, String reason) {
        validateTableName(tableName);
        validateColumns(piiColumns);
        int normalizedChunkSize = normalizeChunkSize(chunkSize);
        validateTargetKey(targetKeyId, true);

        if (!tableExists(tableName)) {
            log.warn("PII 회전 scan-only SKIP — table={} 가 현재 스키마에 존재하지 않습니다.",
                LogSanitizer.forLog(tableName));
            return emptyResult(tableName, targetKeyId, "table not found in current schema");
        }

        long cursor = progressRepository.findLastDoneEndId(tableName, targetKeyId);
        int chunkNo = progressRepository.findNextChunkNo(tableName, targetKeyId);

        int chunksProcessed = 0;
        int rowsScanned = 0;

        while (true) {
            List<Map<String, Object>> chunk = fetchChunk(tableName, piiColumns, cursor, normalizedChunkSize);
            if (chunk.isEmpty()) {
                break;
            }

            long chunkStartId = ((Number) chunk.get(0).get("id")).longValue();
            long chunkEndId = ((Number) chunk.get(chunk.size() - 1).get("id")).longValue();

            PiiReencryptionProgress progress = createProgressRow(
                tableName, chunkNo, chunkStartId, chunkEndId, chunk.size(), targetKeyId);
            progress.setStatusEnum(Status.SKIPPED);
            progress.setStartedAt(LocalDateTime.now());
            progress.setFinishedAt(LocalDateTime.now());
            progress.setRowsDone(0);
            progress.setErrorMessage(LogSanitizer.forLog(reason));
            progressRepository.save(progress);

            cursor = chunkEndId;
            chunkNo++;
            chunksProcessed++;
            rowsScanned += chunk.size();
        }

        log.info("PII 회전 scan-only — table={}, chunks={}, rowsScanned={}, reason={}",
            LogSanitizer.forLog(tableName), chunksProcessed, rowsScanned,
            LogSanitizer.forLog(reason));

        return PiiRotationResult.builder()
            .tableName(tableName)
            .chunksProcessed(chunksProcessed)
            .chunksDone(0)
            .chunksFailed(0)
            .rowsScanned(rowsScanned)
            .rowsRotated(0)
            .activeKeyId(encryptionUtil.getActiveKeyId())
            .targetKeyId(targetKeyId)
            .build();
    }

    // ----------------------------------------------------------------
    // Internal — chunk 실행
    // ----------------------------------------------------------------

    private ChunkOutcome runChunk(PiiReencryptionProgress progress, String tableName,
                                   List<String> piiColumns, List<Map<String, Object>> rows) {
        progress.setStatusEnum(Status.IN_PROGRESS);
        progress.setStartedAt(LocalDateTime.now());
        progressRepository.save(progress);

        try {
            Integer rotated = transactionTemplate.execute(status -> reencryptRows(tableName, piiColumns, rows));
            int rotatedCount = rotated == null ? 0 : rotated;
            progress.setStatusEnum(Status.DONE);
            progress.setRowsDone(rotatedCount);
            progress.setFinishedAt(LocalDateTime.now());
            progressRepository.save(progress);
            return new ChunkOutcome(true, rows.size(), rotatedCount);
        } catch (RuntimeException e) {
            String sanitized = LogSanitizer.forLog(e.getClass().getSimpleName() + ": " + e.getMessage());
            log.error("PII chunk 회전 실패 — table={}, chunkNo={}, error={}",
                LogSanitizer.forLog(tableName), progress.getChunkNo(), sanitized);
            progress.setStatusEnum(Status.FAILED);
            progress.setRowsDone(0);
            progress.setFinishedAt(LocalDateTime.now());
            progress.setErrorMessage(sanitized);
            progressRepository.save(progress);
            return new ChunkOutcome(false, rows.size(), 0);
        }
    }

    private ChunkOutcome rerunChunk(String tableName, List<String> piiColumns,
                                    PiiReencryptionProgress chunk) {
        Long startId = chunk.getChunkStartId();
        Long endId = chunk.getChunkEndId();
        if (startId == null || endId == null) {
            log.warn("PII chunk 재시도 SKIP — chunkStartId/chunkEndId 누락. id={}", chunk.getId());
            return new ChunkOutcome(false, 0, 0);
        }
        List<Map<String, Object>> rows = fetchChunkByRange(tableName, piiColumns, startId, endId);
        return runChunk(chunk, tableName, piiColumns, rows);
    }

    /**
     * 한 chunk 내 row 들을 활성 키로 재암호화한다. 트랜잭션 내부에서 실행되어야 한다.
     */
    int reencryptRows(String tableName, List<String> piiColumns, List<Map<String, Object>> rows) {
        int rotated = 0;
        for (Map<String, Object> row : rows) {
            Long id = ((Number) row.get("id")).longValue();
            Map<String, String> updates = new LinkedHashMap<>();
            for (String col : piiColumns) {
                Object current = row.get(col);
                if (current == null) {
                    continue;
                }
                String oldCipher = String.valueOf(current);
                String newCipher = encryptionUtil.ensureActiveKeyEncryption(oldCipher);
                if (!Objects.equals(oldCipher, newCipher)) {
                    updates.put(col, newCipher);
                }
            }
            if (!updates.isEmpty()) {
                applyRowUpdate(tableName, id, updates);
                rotated++;
            }
        }
        return rotated;
    }

    // ----------------------------------------------------------------
    // Internal — JdbcTemplate 헬퍼
    // ----------------------------------------------------------------

    private List<Map<String, Object>> fetchChunk(String tableName, List<String> piiColumns,
                                                  long afterId, int chunkSize) {
        String columnsCsv = renderColumnsCsv(piiColumns);
        String sql = "SELECT id, " + columnsCsv + " FROM " + quoteTable(tableName)
            + " WHERE id > ? ORDER BY id ASC LIMIT ?";
        return jdbcTemplate.queryForList(sql, afterId, chunkSize);
    }

    private List<Map<String, Object>> fetchChunkByRange(String tableName, List<String> piiColumns,
                                                         long startId, long endId) {
        String columnsCsv = renderColumnsCsv(piiColumns);
        String sql = "SELECT id, " + columnsCsv + " FROM " + quoteTable(tableName)
            + " WHERE id BETWEEN ? AND ? ORDER BY id ASC";
        return jdbcTemplate.queryForList(sql, startId, endId);
    }

    /**
     * 회전 대상 테이블이 현재 DB 스키마에 존재하는지 확인한다.
     *
     * <p>{@code branches} 처럼 RENAME/DROP 으로 운영 스키마에서 사라진 테이블에 회전을 시도해도
     * NPE / DataAccessException 으로 흐름이 깨지지 않도록 사전 가드로 사용한다.</p>
     */
    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM information_schema.tables "
                + "WHERE table_schema = DATABASE() AND table_name = ?",
            Integer.class, tableName);
        return count != null && count > 0;
    }

    private PiiRotationResult emptyResult(String tableName, String targetKeyId, String reason) {
        log.info("PII 회전 empty result — table={}, reason={}",
            LogSanitizer.forLog(tableName), LogSanitizer.forLog(reason));
        return PiiRotationResult.builder()
            .tableName(tableName)
            .chunksProcessed(0)
            .chunksDone(0)
            .chunksFailed(0)
            .rowsScanned(0)
            .rowsRotated(0)
            .activeKeyId(encryptionUtil.getActiveKeyId())
            .targetKeyId(targetKeyId)
            .build();
    }

    private void applyRowUpdate(String tableName, long id, Map<String, String> updates) {
        if (updates.isEmpty()) {
            return;
        }
        StringBuilder sql = new StringBuilder("UPDATE ")
            .append(quoteTable(tableName))
            .append(" SET ");
        List<Object> args = new ArrayList<>(updates.size() + 1);
        boolean first = true;
        for (Map.Entry<String, String> entry : updates.entrySet()) {
            if (!first) {
                sql.append(", ");
            }
            sql.append(quoteColumn(entry.getKey())).append(" = ?");
            args.add(entry.getValue());
            first = false;
        }
        sql.append(" WHERE id = ?");
        args.add(id);
        jdbcTemplate.update(sql.toString(), args.toArray());
    }

    private String renderColumnsCsv(List<String> columns) {
        return columns.stream().map(this::quoteColumn).collect(Collectors.joining(", "));
    }

    /**
     * MySQL 테이블 식별자 quoting — {@link #ALLOWED_TABLES} 화이트리스트에 포함된 값만 허용한다.
     *
     * <p>SQL 식별자 동적 합성에 사용. CodeQL sql-injection sanitizer 휴리스틱이 명시적
     * {@link Set#contains(Object)} 검증을 인식하도록 본 메서드에서 한 번 더 가드한다
     * ({@link #validateTableName(String)} 가 이미 호출되었더라도 다중 가드).</p>
     *
     * @throws IllegalArgumentException 화이트리스트 외 식별자
     */
    private String quoteTable(String tableName) {
        if (tableName == null || !ALLOWED_TABLES.contains(tableName)) {
            throw new IllegalArgumentException(
                "disallowed table identifier: " + LogSanitizer.forLog(tableName));
        }
        return "`" + tableName + "`";
    }

    /**
     * MySQL 컬럼 식별자 quoting — {@link #ALLOWED_COLUMNS} 화이트리스트에 포함된 값만 허용한다.
     *
     * @throws IllegalArgumentException 화이트리스트 외 식별자
     */
    private String quoteColumn(String columnName) {
        if (columnName == null || !ALLOWED_COLUMNS.contains(columnName)) {
            throw new IllegalArgumentException(
                "disallowed column identifier: " + LogSanitizer.forLog(columnName));
        }
        return "`" + columnName + "`";
    }

    // ----------------------------------------------------------------
    // Internal — 진행률 헬퍼
    // ----------------------------------------------------------------

    private PiiReencryptionProgress createProgressRow(String tableName, int chunkNo,
                                                       long chunkStartId, long chunkEndId,
                                                       int rowsTotal, String targetKeyId) {
        PiiReencryptionProgress entity = PiiReencryptionProgress.builder()
            .tableName(tableName)
            .chunkNo(chunkNo)
            .chunkStartId(chunkStartId)
            .chunkEndId(chunkEndId)
            .status(Status.PENDING.name())
            .rowsTotal(rowsTotal)
            .rowsDone(0)
            .activeKeyId(encryptionUtil.getActiveKeyId())
            .targetKeyId(targetKeyId)
            .build();
        return progressRepository.save(entity);
    }

    // ----------------------------------------------------------------
    // Internal — 검증
    // ----------------------------------------------------------------

    private void validateTableName(String tableName) {
        if (tableName == null
                || !tableName.matches("[A-Za-z_][A-Za-z0-9_]*")
                || !ALLOWED_TABLES.contains(tableName)) {
            throw new IllegalArgumentException(
                "invalid or disallowed table name: " + LogSanitizer.forLog(tableName));
        }
    }

    private void validateColumns(List<String> columns) {
        if (columns == null || columns.isEmpty()) {
            throw new IllegalArgumentException("piiColumns must not be empty");
        }
        for (String col : columns) {
            if (col == null
                    || !col.matches("[A-Za-z_][A-Za-z0-9_]*")
                    || !ALLOWED_COLUMNS.contains(col)) {
                throw new IllegalArgumentException(
                    "invalid or disallowed column name: " + LogSanitizer.forLog(col));
            }
        }
    }

    private int normalizeChunkSize(int chunkSize) {
        if (chunkSize < MIN_CHUNK_SIZE || chunkSize > MAX_CHUNK_SIZE) {
            throw new IllegalArgumentException(
                "chunkSize must be between " + MIN_CHUNK_SIZE + " and " + MAX_CHUNK_SIZE);
        }
        return chunkSize;
    }

    /**
     * 회전 목표 키와 활성 키 일치 여부 검증.
     *
     * @param targetKeyId 회전 목표 키 ID
     * @param allowMismatch true 이면 활성 키와 불일치해도 허용 (scan-only 경로용)
     */
    private void validateTargetKey(String targetKeyId, boolean allowMismatch) {
        if (targetKeyId == null || targetKeyId.isBlank()) {
            throw new IllegalArgumentException("targetKeyId must not be blank");
        }
        String activeKeyId = encryptionUtil.getActiveKeyId();
        if (!allowMismatch && !Objects.equals(activeKeyId, targetKeyId)) {
            throw new IllegalArgumentException(
                "targetKeyId (" + LogSanitizer.forLog(targetKeyId)
                + ") does not match active key (" + LogSanitizer.forLog(activeKeyId)
                + "). Phase 1 only supports rotating to the currently active key.");
        }
    }

    // ----------------------------------------------------------------
    // Internal — Result 객체
    // ----------------------------------------------------------------

    /** chunk 1개의 처리 결과. */
    private static final class ChunkOutcome {
        private final boolean success;
        private final int rowsScanned;
        private final int rowsRotated;

        private ChunkOutcome(boolean success, int rowsScanned, int rowsRotated) {
            this.success = success;
            this.rowsScanned = rowsScanned;
            this.rowsRotated = rowsRotated;
        }
    }

    // ----------------------------------------------------------------
    // 공개 상수 헬퍼 — 테이블명 → 회전 컬럼 매핑 (Controller 단순화용)
    // ----------------------------------------------------------------

    /** 지원 테이블 목록 — 순서는 권장 회전 순서 (users → clients → accounts → branches → dormant). */
    public static final Map<String, List<String>> SUPPORTED_TABLES = Collections.unmodifiableMap(
        new LinkedHashMap<>(Map.of(
            "users", USERS_PII_COLUMNS,
            "clients", CLIENTS_PII_COLUMNS,
            "accounts", ACCOUNTS_PII_COLUMNS,
            "branches", BRANCHES_PII_COLUMNS,
            DORMANT_VAULT_TABLE, List.of(DORMANT_VAULT_COLUMN)
        )));

    /** 호환성 — 활성 키 ID 노출 (Controller / 단위 테스트). */
    public String getActiveKeyId() {
        return encryptionUtil.getActiveKeyId();
    }
}
