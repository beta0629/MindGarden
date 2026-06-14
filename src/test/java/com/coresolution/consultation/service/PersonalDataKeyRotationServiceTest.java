package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import com.coresolution.consultation.dto.security.PiiRotationResult;
import com.coresolution.consultation.entity.PiiReencryptionProgress;
import com.coresolution.consultation.entity.PiiReencryptionProgress.Status;
import com.coresolution.consultation.repository.PiiReencryptionProgressRepository;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;

/**
 * {@link PersonalDataKeyRotationService} 단위 테스트.
 *
 * <p>JdbcTemplate / Repository / EncryptionUtil 를 모두 mock 으로 주입하여 chunk 회전·진행률
 * 추적·실패 chunk 재시도·평문 백필 게이트의 동작을 검증한다. 실제 DB 접근 없음.</p>
 *
 * @author CoreSolution
 * @since 2026-06-15
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PersonalDataKeyRotationService 단위 테스트 — chunk 회전·진행률·재시도")
class PersonalDataKeyRotationServiceTest {

    private static final String ACTIVE_KEY = "v2";

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;

    @Mock
    private PiiReencryptionProgressRepository progressRepository;

    private TransactionTemplate transactionTemplate;
    private PersonalDataKeyRotationService service;

    @BeforeEach
    void setUp() {
        transactionTemplate = new TransactionTemplate(new NoOpTransactionManager());
        service = new PersonalDataKeyRotationService(
            jdbcTemplate, transactionTemplate, encryptionUtil, progressRepository, false);
        // 테스트 기본 stub — 실제 활성 키 ID 는 테스트별로 재정의
        when(encryptionUtil.getActiveKeyId()).thenReturn(ACTIVE_KEY);
    }

    private void stubProgressSaveEcho() {
        when(progressRepository.save(any(PiiReencryptionProgress.class)))
            .thenAnswer(inv -> inv.getArgument(0));
    }

    private void stubTableExists(String tableName, boolean exists) {
        when(jdbcTemplate.queryForObject(
            anyString(), eq(Integer.class), eq(tableName)))
            .thenReturn(exists ? 1 : 0);
    }

    private List<Map<String, Object>> rowsForUsers(int startId, int count) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", (long) (startId + i));
            row.put("email", "v1::email-" + (startId + i));
            row.put("name", "v1::name-" + (startId + i));
            row.put("nickname", null);
            row.put("phone", "v1::phone-" + (startId + i));
            row.put("gender", null);
            row.put("address", null);
            row.put("rrn_encrypted", null);
            rows.add(row);
        }
        return rows;
    }

    @Nested
    @DisplayName("rotateUserPersonalData — chunk 회전 시나리오")
    class UsersRotation {

        @Test
        @DisplayName("2 chunk 회전 — 모든 row 가 v1 → v2 재암호화 되고 진행률 DONE 으로 마킹된다")
        void rotateUsers_twoChunks_allDone() {
            stubTableExists("users", true);
            when(progressRepository.findLastDoneEndId("users", ACTIVE_KEY)).thenReturn(0L);
            when(progressRepository.findNextChunkNo("users", ACTIVE_KEY)).thenReturn(0);
            stubProgressSaveEcho();

            // chunk 1: id 1..2, chunk 2: id 3..4, chunk 3: empty
            List<Map<String, Object>> chunk1 = rowsForUsers(1, 2);
            List<Map<String, Object>> chunk2 = rowsForUsers(3, 2);
            when(jdbcTemplate.queryForList(anyString(), eq(0L), eq(2)))
                .thenReturn(chunk1);
            when(jdbcTemplate.queryForList(anyString(), eq(2L), eq(2)))
                .thenReturn(chunk2);
            when(jdbcTemplate.queryForList(anyString(), eq(4L), eq(2)))
                .thenReturn(List.of());

            // ensureActiveKeyEncryption: v1::* → v2::*
            when(encryptionUtil.ensureActiveKeyEncryption(anyString()))
                .thenAnswer(inv -> {
                    String s = inv.getArgument(0);
                    return s.startsWith("v1::") ? s.replaceFirst("^v1::", "v2::") : s;
                });

            PiiRotationResult result = service.rotateUserPersonalData(2, ACTIVE_KEY);

            assertThat(result.getChunksProcessed()).isEqualTo(2);
            assertThat(result.getChunksDone()).isEqualTo(2);
            assertThat(result.getChunksFailed()).isZero();
            assertThat(result.getRowsScanned()).isEqualTo(4);
            assertThat(result.getRowsRotated()).isEqualTo(4);
            verify(jdbcTemplate, times(4)).update(anyString(), any(Object[].class));
        }

        @Test
        @DisplayName("이미 활성 키로 암호화된 row 는 UPDATE 가 발생하지 않는다 (idempotent)")
        void rotateUsers_alreadyActive_noUpdate() {
            stubTableExists("users", true);
            when(progressRepository.findLastDoneEndId("users", ACTIVE_KEY)).thenReturn(0L);
            when(progressRepository.findNextChunkNo("users", ACTIVE_KEY)).thenReturn(0);
            stubProgressSaveEcho();

            List<Map<String, Object>> chunk = new ArrayList<>();
            Map<String, Object> row = new HashMap<>();
            row.put("id", 1L);
            row.put("email", ACTIVE_KEY + "::already");
            row.put("name", ACTIVE_KEY + "::already");
            row.put("nickname", null);
            row.put("phone", null);
            row.put("gender", null);
            row.put("address", null);
            row.put("rrn_encrypted", null);
            chunk.add(row);

            when(jdbcTemplate.queryForList(anyString(), eq(0L), eq(100)))
                .thenReturn(chunk);
            when(jdbcTemplate.queryForList(anyString(), eq(1L), eq(100)))
                .thenReturn(List.of());

            // 활성 키와 동일 → no-op
            when(encryptionUtil.ensureActiveKeyEncryption(anyString()))
                .thenAnswer(inv -> inv.getArgument(0));

            PiiRotationResult result = service.rotateUserPersonalData(100, ACTIVE_KEY);

            assertThat(result.getRowsScanned()).isEqualTo(1);
            assertThat(result.getRowsRotated()).isZero();
            verify(jdbcTemplate, never()).update(anyString(), any(Object[].class));
        }

        @Test
        @DisplayName("chunk 처리 중 예외 발생 시 해당 chunk 만 FAILED 로 마킹되고 다음 chunk 는 계속 진행한다")
        void rotateUsers_failureMarkedFailed_continuesNextChunk() {
            stubTableExists("users", true);
            when(progressRepository.findLastDoneEndId("users", ACTIVE_KEY)).thenReturn(0L);
            when(progressRepository.findNextChunkNo("users", ACTIVE_KEY)).thenReturn(0);
            stubProgressSaveEcho();

            List<Map<String, Object>> chunk1 = rowsForUsers(1, 1);
            List<Map<String, Object>> chunk2 = rowsForUsers(2, 1);
            when(jdbcTemplate.queryForList(anyString(), eq(0L), eq(1))).thenReturn(chunk1);
            when(jdbcTemplate.queryForList(anyString(), eq(1L), eq(1))).thenReturn(chunk2);
            when(jdbcTemplate.queryForList(anyString(), eq(2L), eq(1))).thenReturn(List.of());

            when(encryptionUtil.ensureActiveKeyEncryption(anyString()))
                .thenAnswer(inv -> {
                    String s = inv.getArgument(0);
                    return s.startsWith("v1::") ? s.replaceFirst("^v1::", "v2::") : s;
                });
            // chunk1 의 update 는 RuntimeException, chunk2 는 정상 (호출 순서 기반 stubbing)
            when(jdbcTemplate.update(anyString(), any(Object[].class)))
                .thenThrow(new RuntimeException("simulated failure"))
                .thenReturn(1);

            PiiRotationResult result = service.rotateUserPersonalData(1, ACTIVE_KEY);

            assertThat(result.getChunksProcessed()).isEqualTo(2);
            assertThat(result.getChunksDone()).isEqualTo(1);
            assertThat(result.getChunksFailed()).isEqualTo(1);
        }

        @Test
        @DisplayName("targetKeyId 가 활성 키와 일치하지 않으면 IllegalArgumentException")
        void rotateUsers_targetKeyMismatch_throws() {
            assertThatThrownBy(() -> service.rotateUserPersonalData(100, "v9"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not match active key");
        }

        @Test
        @DisplayName("chunkSize 범위 밖이면 IllegalArgumentException")
        void rotateUsers_invalidChunkSize_throws() {
            assertThatThrownBy(() -> service.rotateUserPersonalData(0, ACTIVE_KEY))
                .isInstanceOf(IllegalArgumentException.class);
            assertThatThrownBy(() -> service.rotateUserPersonalData(1001, ACTIVE_KEY))
                .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("rotateClientPersonalData — clients 별도 메서드")
    class ClientsRotation {

        @Test
        @DisplayName("clients 7컬럼 chunk 회전 — emergency_contact / emergency_phone 포함")
        void rotateClients_includesEmergencyColumns() {
            stubTableExists("clients", true);
            when(progressRepository.findLastDoneEndId("clients", ACTIVE_KEY)).thenReturn(0L);
            when(progressRepository.findNextChunkNo("clients", ACTIVE_KEY)).thenReturn(0);
            stubProgressSaveEcho();

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", 1L);
            row.put("name", "v1::n");
            row.put("email", "v1::e");
            row.put("phone", null);
            row.put("gender", null);
            row.put("address", null);
            row.put("emergency_contact", "v1::ec");
            row.put("emergency_phone", "v1::ep");

            when(jdbcTemplate.queryForList(anyString(), eq(0L), eq(50)))
                .thenReturn(List.of(row));
            when(jdbcTemplate.queryForList(anyString(), eq(1L), eq(50)))
                .thenReturn(List.of());

            when(encryptionUtil.ensureActiveKeyEncryption(anyString()))
                .thenAnswer(inv -> ((String) inv.getArgument(0)).replaceFirst("^v1::", "v2::"));

            ArgumentCaptor<Object[]> argsCaptor = ArgumentCaptor.forClass(Object[].class);
            when(jdbcTemplate.update(anyString(), argsCaptor.capture()))
                .thenReturn(1);

            PiiRotationResult result = service.rotateClientPersonalData(50, ACTIVE_KEY);

            assertThat(result.getTableName()).isEqualTo("clients");
            assertThat(result.getRowsRotated()).isEqualTo(1);
            // 4 non-null columns updated (name, email, emergency_contact, emergency_phone) + id
            assertThat(argsCaptor.getValue()).hasSize(5);
        }
    }

    @Nested
    @DisplayName("rotateAccountPersonalData — 평문 백필 게이트")
    class AccountsRotation {

        @Test
        @DisplayName("allow-plaintext-encryption=false 이면 SKIPPED 결과만 반환하고 회전 미수행")
        void rotateAccounts_flagDisabled_returnsEmpty() {
            // service 는 default false flag 로 생성됨
            PiiRotationResult result = service.rotateAccountPersonalData(100, ACTIVE_KEY);

            assertThat(result.getChunksProcessed()).isZero();
            assertThat(result.getRowsRotated()).isZero();
            verify(jdbcTemplate, never()).queryForList(anyString(), anyLong(), anyInt());
        }

        @Test
        @DisplayName("allow-plaintext-encryption=true 이면 accounts 테이블 회전이 정상 수행된다")
        void rotateAccounts_flagEnabled_performsRotation() {
            service = new PersonalDataKeyRotationService(
                jdbcTemplate, transactionTemplate, encryptionUtil, progressRepository, true);
            when(encryptionUtil.getActiveKeyId()).thenReturn(ACTIVE_KEY);

            stubTableExists("accounts", true);
            when(progressRepository.findLastDoneEndId("accounts", ACTIVE_KEY)).thenReturn(0L);
            when(progressRepository.findNextChunkNo("accounts", ACTIVE_KEY)).thenReturn(0);
            stubProgressSaveEcho();

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", 1L);
            row.put("account_number", "1234567890");
            row.put("account_holder", "홍길동");
            when(jdbcTemplate.queryForList(anyString(), eq(0L), eq(100)))
                .thenReturn(List.of(row));
            when(jdbcTemplate.queryForList(anyString(), eq(1L), eq(100)))
                .thenReturn(List.of());

            when(encryptionUtil.ensureActiveKeyEncryption(anyString()))
                .thenAnswer(inv -> ACTIVE_KEY + "::cipher");
            when(jdbcTemplate.update(anyString(), any(Object[].class))).thenReturn(1);

            PiiRotationResult result = service.rotateAccountPersonalData(100, ACTIVE_KEY);

            assertThat(result.getRowsRotated()).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("rotateBranchPersonalData — 테이블 부재 가드")
    class BranchesRotation {

        @Test
        @DisplayName("branches 테이블이 schema 에 없으면 SKIPPED 로 즉시 반환한다")
        void rotateBranches_tableMissing_returnsEmpty() {
            service = new PersonalDataKeyRotationService(
                jdbcTemplate, transactionTemplate, encryptionUtil, progressRepository, true);
            when(encryptionUtil.getActiveKeyId()).thenReturn(ACTIVE_KEY);
            stubTableExists("branches", false);

            PiiRotationResult result = service.rotateBranchPersonalData(100, ACTIVE_KEY);

            assertThat(result.getChunksProcessed()).isZero();
            verify(jdbcTemplate, never()).queryForList(anyString(), anyLong(), anyInt());
        }
    }

    @Nested
    @DisplayName("rotateDormantPiiVault — Phase 1 scan-only")
    class DormantRotation {

        @Test
        @DisplayName("dormant vault 는 chunk scan + SKIPPED 만 수행하고 ciphertext 를 변경하지 않는다")
        void rotateDormant_scanOnly() {
            stubTableExists("dormant_user_pii_vault", true);
            when(progressRepository.findLastDoneEndId("dormant_user_pii_vault", ACTIVE_KEY)).thenReturn(0L);
            when(progressRepository.findNextChunkNo("dormant_user_pii_vault", ACTIVE_KEY)).thenReturn(0);
            stubProgressSaveEcho();

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", 1L);
            row.put("encrypted_pii", "{\"v\":1}");
            when(jdbcTemplate.queryForList(anyString(), eq(0L), eq(50)))
                .thenReturn(List.of(row));
            when(jdbcTemplate.queryForList(anyString(), eq(1L), eq(50)))
                .thenReturn(List.of());

            PiiRotationResult result = service.rotateDormantPiiVault(50, ACTIVE_KEY);

            assertThat(result.getRowsScanned()).isEqualTo(1);
            assertThat(result.getRowsRotated()).isZero();
            verify(jdbcTemplate, never()).update(anyString(), any(Object[].class));
        }
    }

    @Nested
    @DisplayName("resumeFailedChunks — FAILED chunk 재시도")
    class Resume {

        @Test
        @DisplayName("FAILED chunk 1건이 있으면 해당 chunk 만 재실행하고 DONE 으로 마킹한다")
        void resume_singleFailedChunk_succeeds() {
            stubProgressSaveEcho();
            PiiReencryptionProgress failed = PiiReencryptionProgress.builder()
                .id(10L)
                .tableName("users")
                .chunkNo(3)
                .chunkStartId(1L)
                .chunkEndId(2L)
                .status(Status.FAILED.name())
                .activeKeyId(ACTIVE_KEY)
                .targetKeyId(ACTIVE_KEY)
                .build();
            when(progressRepository.findByTableNameAndTargetKeyIdAndStatusOrderByChunkNoAsc(
                eq("users"), eq(ACTIVE_KEY), eq(Status.FAILED.name())))
                .thenReturn(List.of(failed));

            when(jdbcTemplate.queryForList(anyString(), eq(1L), eq(2L)))
                .thenReturn(rowsForUsers(1, 2));
            when(encryptionUtil.ensureActiveKeyEncryption(anyString()))
                .thenAnswer(inv -> ((String) inv.getArgument(0)).replaceFirst("^v1::", "v2::"));
            when(jdbcTemplate.update(anyString(), any(Object[].class))).thenReturn(1);

            PiiRotationResult result = service.resumeFailedChunks(
                "users", PersonalDataKeyRotationService.USERS_PII_COLUMNS, ACTIVE_KEY);

            assertThat(result.getChunksProcessed()).isEqualTo(1);
            assertThat(result.getChunksDone()).isEqualTo(1);
            assertThat(result.getRowsRotated()).isEqualTo(2);
            assertThat(failed.statusEnum()).isEqualTo(Status.DONE);
        }

        @Test
        @DisplayName("FAILED chunk 가 0건이면 즉시 빈 결과 반환")
        void resume_noFailedChunks_returnsEmpty() {
            when(progressRepository.findByTableNameAndTargetKeyIdAndStatusOrderByChunkNoAsc(
                eq("users"), eq(ACTIVE_KEY), eq(Status.FAILED.name())))
                .thenReturn(List.of());

            PiiRotationResult result = service.resumeFailedChunks(
                "users", PersonalDataKeyRotationService.USERS_PII_COLUMNS, ACTIVE_KEY);

            assertThat(result.getChunksProcessed()).isZero();
        }
    }

    @Nested
    @DisplayName("aggregateProgress / cancelPendingChunks")
    class ProgressAndCancel {

        @Test
        @DisplayName("status 별 카운트가 정확히 집계된다")
        void aggregateProgress_countsByStatus() {
            PiiReencryptionProgress p1 = sampleChunk(0, Status.DONE);
            PiiReencryptionProgress p2 = sampleChunk(1, Status.DONE);
            PiiReencryptionProgress p3 = sampleChunk(2, Status.FAILED);
            PiiReencryptionProgress p4 = sampleChunk(3, Status.PENDING);

            when(progressRepository.findByTableNameAndTargetKeyIdOrderByChunkNoAsc("users", ACTIVE_KEY))
                .thenReturn(List.of(p1, p2, p3, p4));

            Map<Status, Long> agg = service.aggregateProgress("users", ACTIVE_KEY);

            assertThat(agg).containsEntry(Status.DONE, 2L);
            assertThat(agg).containsEntry(Status.FAILED, 1L);
            assertThat(agg).containsEntry(Status.PENDING, 1L);
        }

        @Test
        @DisplayName("PENDING / IN_PROGRESS chunk 가 모두 SKIPPED 로 마킹된다")
        void cancelPendingChunks_marksSkipped() {
            stubProgressSaveEcho();
            PiiReencryptionProgress pending = sampleChunk(0, Status.PENDING);
            PiiReencryptionProgress inProgress = sampleChunk(1, Status.IN_PROGRESS);
            when(progressRepository.findByTableNameAndTargetKeyIdAndStatusOrderByChunkNoAsc(
                eq("users"), eq(ACTIVE_KEY), eq(Status.PENDING.name())))
                .thenReturn(List.of(pending));
            when(progressRepository.findByTableNameAndTargetKeyIdAndStatusOrderByChunkNoAsc(
                eq("users"), eq(ACTIVE_KEY), eq(Status.IN_PROGRESS.name())))
                .thenReturn(List.of(inProgress));

            int cancelled = service.cancelPendingChunks("users", ACTIVE_KEY);

            assertThat(cancelled).isEqualTo(2);
            assertThat(pending.statusEnum()).isEqualTo(Status.SKIPPED);
            assertThat(inProgress.statusEnum()).isEqualTo(Status.SKIPPED);
        }

        private PiiReencryptionProgress sampleChunk(int chunkNo, Status status) {
            return PiiReencryptionProgress.builder()
                .id((long) chunkNo + 1)
                .tableName("users")
                .chunkNo(chunkNo)
                .chunkStartId((long) chunkNo * 10 + 1)
                .chunkEndId((long) chunkNo * 10 + 10)
                .status(status.name())
                .activeKeyId(ACTIVE_KEY)
                .targetKeyId(ACTIVE_KEY)
                .build();
        }
    }

    /**
     * 테스트 전용 — 트랜잭션 매니저 noop. {@link TransactionTemplate} 동작에는 충분하지만
     * 실제 트랜잭션 경계는 형성되지 않는다. 테스트에서 트랜잭션 격리는 검증 대상 아님.
     */
    private static final class NoOpTransactionManager
            implements org.springframework.transaction.PlatformTransactionManager {
        @Override
        public org.springframework.transaction.TransactionStatus getTransaction(
                org.springframework.transaction.TransactionDefinition definition) {
            return new org.springframework.transaction.support.SimpleTransactionStatus();
        }

        @Override
        public void commit(org.springframework.transaction.TransactionStatus status) {
            // noop
        }

        @Override
        public void rollback(org.springframework.transaction.TransactionStatus status) {
            // noop
        }
    }
}
