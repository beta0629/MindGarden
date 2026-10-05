package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import javax.sql.DataSource;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.coresolution.consultation.config.ManualNotificationProperties;
import com.coresolution.consultation.constant.ManualNotificationDeliveryStatus;
import com.coresolution.consultation.constant.ManualNotificationJobConstants;
import com.coresolution.consultation.constant.ManualNotificationJobStatus;
import com.coresolution.consultation.constant.ManualNotificationRecipientMode;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ManualNotificationJobRequest;
import com.coresolution.consultation.dto.MobilePushBroadcastResult;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.entity.ManualNotificationDispatchRecord;
import com.coresolution.consultation.entity.ManualNotificationJob;
import com.coresolution.consultation.entity.ManualNotificationJobRecipient;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserPrivacyConsent;
import com.coresolution.consultation.repository.ManualNotificationDispatchRecordRepository;
import com.coresolution.consultation.repository.ManualNotificationJobRecipientRepository;
import com.coresolution.consultation.repository.ManualNotificationJobRepository;
import com.coresolution.consultation.repository.UserPrivacyConsentRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.impl.ManualNotificationDispatchPacer;
import com.coresolution.consultation.service.impl.ManualNotificationJobServiceImpl;
import com.coresolution.consultation.service.impl.ManualNotificationJobWorker;
import com.coresolution.consultation.service.impl.NotificationDispatchHelper;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.support.WithMockAdminSecurityContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 수동 발송 작업 통합 테스트(H2): 전체 내담자·제외, 서버 대상 규칙, 확인 인원 = 발송 인원, 상한 500/501,
 * 멱등 키, 청크·재개·중복 실행 방지, 프로바이더 호출 시 트랜잭션·커넥션 0, 로그 번호 마스킹, 권한 403.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockAdminSecurityContext
@TestPropertySource(properties = {
    "notification.manual.job.provider-mode=REAL",
    "notification.manual.job.sms.chunk-size=3",
    "notification.manual.job.sms.per-second=2",
    "notification.manual.job.push.chunk-size=3",
    "notification.manual.job.push.per-second=0"
})
@DisplayName("어드민 수동 발송 작업 — 전체 내담자·제외·확인·비동기 발송")
class ManualNotificationJobIntegrationTest {

    private static final String BASE = "/api/v1/admin/manual-notifications";
    private static final String PREVIEW_URL = BASE + "/jobs/preview";
    private static final String JOBS_URL = BASE + "/jobs";
    private static final String PHONE_PREFIX = "0105";
    private static final int PHONE_SUFFIX_WIDTH = 7;
    private static final long CALLER_ID = 1L;

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private UserPrivacyConsentRepository consentRepository;
    @Autowired private ManualNotificationJobRepository jobRepository;
    @Autowired private ManualNotificationJobRecipientRepository recipientRepository;
    @Autowired private ManualNotificationDispatchRecordRepository dispatchRecordRepository;
    @Autowired private ManualNotificationJobWorker worker;
    @Autowired private ManualNotificationProperties properties;
    @Autowired private DataSource dataSource;
    @Autowired private EntityManagerFactory entityManagerFactory;

    @MockBean private NotificationDispatchHelper dispatchHelper;
    @MockBean private MobilePushDispatchService mobilePushDispatchService;
    @MockBean private ManualNotificationDispatchPacer.Sleeper sleeper;

    private final List<CallBoundary> boundaries = new CopyOnWriteArrayList<>();
    private final List<String> smsPhones = new CopyOnWriteArrayList<>();
    private final List<Long> createdUserIds = new ArrayList<>();
    private final AtomicInteger phoneSeq = new AtomicInteger();
    private String tenantId;
    private ListAppender<ILoggingEvent> logAppender;

    @BeforeEach
    void setUp() {
        tenantId = "mnj-" + UUID.randomUUID().toString().replace("-", "").substring(0, 28);
        TenantContextHolder.setTenantId(tenantId);
        when(dispatchHelper.dispatchSms(anyString(), anyString())).thenAnswer(inv -> {
            recordBoundary("dispatchSms");
            smsPhones.add(inv.getArgument(0));
            return new NotificationDispatchHelper.DispatchResult(true, null, null, null, null);
        });
        logAppender = new ListAppender<>();
        logAppender.start();
        ((Logger) LoggerFactory.getLogger(ManualNotificationJobWorker.class)).addAppender(logAppender);
        ((Logger) LoggerFactory.getLogger(ManualNotificationJobServiceImpl.class)).addAppender(logAppender);
    }

    @AfterEach
    void tearDown() {
        ((Logger) LoggerFactory.getLogger(ManualNotificationJobWorker.class)).detachAppender(logAppender);
        ((Logger) LoggerFactory.getLogger(ManualNotificationJobServiceImpl.class)).detachAppender(logAppender);
        properties.getJob().setProviderMode("REAL");
        properties.setMaxRecipients(ManualNotificationProperties.DEFAULT_MAX_RECIPIENTS);
        for (ManualNotificationJob job : jobRepository.findAll()) {
            if (tenantId.equals(job.getTenantId()) || job.getTenantId().startsWith(tenantId)) {
                dispatchRecordRepository.deleteAll(dispatchRecordRepository.findByJobIdOrderByChunkIndexAscIdAsc(
                    job.getId()));
                recipientRepository.deleteAll(recipientRepository.findByJobIdOrderBySeqAsc(job.getId()));
                jobRepository.delete(job);
            }
        }
        consentRepository.deleteAll(consentRepository.findAll().stream()
            .filter(c -> c.getTenantId() != null && c.getTenantId().startsWith(tenantId)).toList());
        userRepository.deleteAllById(createdUserIds);
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("전체 내담자 − 제외: 다른 테넌트·비활성·번호 없음·미동의(광고)·상담사는 빠지고, 다른 테넌트 제외 id 는 무시")
    void preview_allClients_appliesServerRules() throws Exception {
        User ok1 = saveClient(tenantId, true, true, true);
        User ok2 = saveClient(tenantId, true, true, true);
        User excluded = saveClient(tenantId, true, true, true);
        saveClient(tenantId, false, true, true);
        saveClient(tenantId, true, false, true);
        User noConsent = saveClient(tenantId, true, true, false);
        saveUser(tenantId, UserRole.CONSULTANT, true, nextPhone());
        User otherTenant = saveClient(tenantId + "x", true, true, true);

        ManualNotificationJobRequest request = allClients(List.of(excluded.getId(), otherTenant.getId()), true);
        JsonNode data = data(perform(PREVIEW_URL, request, admin(tenantId)).andExpect(status().isOk()));

        assertThat(data.get("finalCount").asInt()).isEqualTo(2);
        assertThat(data.get("excludedCount").asInt()).isEqualTo(1);
        assertThat(data.get("ineligibleReasons").get(ManualNotificationJobConstants.INELIGIBLE_NO_PHONE).asInt())
            .isEqualTo(1);
        assertThat(data.get("ineligibleReasons")
            .get(ManualNotificationJobConstants.INELIGIBLE_NO_MARKETING_CONSENT).asInt()).isEqualTo(1);
        Set<Long> previewIds = new HashSet<>();
        data.get("previewRecipients").forEach(r -> previewIds.add(r.get("userId").asLong()));
        assertThat(previewIds).containsExactlyInAnyOrder(ok1.getId(), ok2.getId());
        assertThat(previewIds).doesNotContain(noConsent.getId(), otherTenant.getId());
        assertThat(data.toString()).doesNotContain(ok1.getPhone());

        JsonNode nonMarketing = data(perform(PREVIEW_URL, allClients(List.of(excluded.getId()), false),
            admin(tenantId)).andExpect(status().isOk()));
        assertThat(nonMarketing.get("finalCount").asInt()).isEqualTo(3);
    }

    @Test
    @DisplayName("직접 선택도 서버가 거른다: 다른 테넌트·비활성·번호 없음 제외, 같은 번호 1회")
    void preview_selected_filteredServerSide() throws Exception {
        User ok = saveClient(tenantId, true, true, true);
        User inactive = saveClient(tenantId, false, true, true);
        User noPhone = saveClient(tenantId, true, false, true);
        User otherTenant = saveClient(tenantId + "x", true, true, true);
        ManualNotificationJobRequest request = sms(ManualNotificationRecipientMode.SELECTED);
        request.setUserIds(List.of(ok.getId(), inactive.getId(), noPhone.getId(), otherTenant.getId()));
        request.setPhoneNumbers(List.of(ok.getPhone()));

        JsonNode data = data(perform(PREVIEW_URL, request, admin(tenantId)).andExpect(status().isOk()));

        assertThat(data.get("finalCount").asInt()).isEqualTo(1);
        assertThat(data.get("ineligibleReasons").get(ManualNotificationJobConstants.INELIGIBLE_NOT_FOUND).asInt())
            .isEqualTo(1);
        assertThat(data.get("ineligibleReasons").get(ManualNotificationJobConstants.INELIGIBLE_INACTIVE).asInt())
            .isEqualTo(1);
        assertThat(data.get("ineligibleReasons").get(ManualNotificationJobConstants.INELIGIBLE_DUPLICATE_PHONE)
            .asInt()).isEqualTo(1);
    }

    @Test
    @DisplayName("확인 인원 = 작업 인원 = 발송 기록 = 실제 호출, 청크는 3·3·1, 중복 0, 호출 시 트랜잭션·커넥션 0")
    void create_thenRun_countsMatchAndChunksFollowProviderLimit() throws Exception {
        for (int i = 0; i < 7; i++) {
            saveClient(tenantId, true, true, true);
        }
        ManualNotificationJobRequest request = allClients(List.of(), false);
        JsonNode preview = data(perform(PREVIEW_URL, request, admin(tenantId)).andExpect(status().isOk()));
        int confirmed = preview.get("finalCount").asInt();
        assertThat(confirmed).isEqualTo(7);

        String jobUuid = createJob(request, preview.get("snapshotToken").asText());
        ManualNotificationJob job = jobRepository.findByTenantIdAndJobUuidAndIsDeletedFalse(tenantId, jobUuid)
            .orElseThrow();
        assertThat(job.getTotalCount()).isEqualTo(confirmed);
        assertThat(recipientRepository.findByJobIdOrderBySeqAsc(job.getId())).hasSize(confirmed);

        TenantContextHolder.clear();
        assertThat(worker.run(job.getId())).isTrue();
        TenantContextHolder.setTenantId(tenantId);

        verify(dispatchHelper, times(confirmed)).dispatchSms(anyString(), anyString());
        assertThat(new HashSet<>(smsPhones)).hasSize(confirmed);
        assertExternalCallsOutsideTransaction(confirmed);

        JsonNode summaryJob = data(mockMvc.perform(get(JOBS_URL + "/" + jobUuid).param("includeRecords", "true")
                .sessionAttr(SessionConstants.USER_OBJECT, admin(tenantId))
                .sessionAttr(SessionConstants.TENANT_ID, tenantId))
            .andExpect(status().isOk()));
        assertThat(summaryJob.get("status").asText()).isEqualTo(ManualNotificationJobStatus.COMPLETED.name());
        assertThat(summaryJob.get("sentCount").asInt()).isEqualTo(confirmed);
        assertThat(summaryJob.get("remainingCount").asInt()).isZero();
        JsonNode summary = summaryJob.get("summary");
        assertThat(summary.get("total").asInt()).isEqualTo(confirmed);
        assertThat(summary.get("chunkCount").asInt()).isEqualTo(3);
        assertThat(ints(summary.get("chunkSizes"))).containsExactly(3, 3, 1);
        assertThat(ints(summary.get("dispatchChunkSizes"))).containsExactly(3, 3, 1);
        assertThat(summary.get("dispatchRecordCount").asInt()).isEqualTo(confirmed);
        assertThat(summary.get("duplicateCount").asInt()).isZero();
        assertThat(summaryJob.get("records")).hasSize(confirmed);
        summaryJob.get("records").forEach(r -> {
            assertThat(r.get("status").asText()).isEqualTo(ManualNotificationDeliveryStatus.SENT.name());
            assertThat(r.get("dispatchKey").asText()).startsWith(jobUuid + ManualNotificationJobConstants
                .DISPATCH_KEY_SEPARATOR);
        });

        List<ILoggingEvent> chunkLogs = logAppender.list.stream()
            .filter(e -> e.getFormattedMessage().startsWith("manual_notification_dispatch_chunk")).toList();
        assertThat(chunkLogs).hasSize(3);
        assertThat(chunkLogs.get(0).getFormattedMessage()).contains("providerMode=REAL", "realCall=true",
            "recipientCount=3", "dispatchKeys=[" + jobUuid);
        assertThat(chunkLogs.get(2).getFormattedMessage()).contains("recipientCount=1", "chunkIndex=2");
        for (ILoggingEvent event : logAppender.list) {
            for (String phone : smsPhones) {
                assertThat(event.getFormattedMessage()).doesNotContain(phone);
            }
        }
    }

    @Test
    @DisplayName("미리보기 뒤 대상이 바뀌면 409 RECIPIENT_SET_CHANGED, 작업을 만들지 않는다")
    void create_whenSetChangedAfterPreview_conflict() throws Exception {
        saveClient(tenantId, true, true, true);
        ManualNotificationJobRequest request = allClients(List.of(), false);
        String token = data(perform(PREVIEW_URL, request, admin(tenantId)).andExpect(status().isOk()))
            .get("snapshotToken").asText();
        saveClient(tenantId, true, true, true);

        request.setSnapshotToken(token);
        request.setIdempotencyKey(UUID.randomUUID().toString());
        perform(JOBS_URL, request, admin(tenantId))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.errorCode").value(ManualNotificationJobConstants.ERROR_RECIPIENT_SET_CHANGED));
        assertThat(jobsOfTenant()).isEmpty();
    }

    @Test
    @DisplayName("같은 멱등 키 재요청은 기존 작업을 돌려주고 두 번째 작업을 만들지 않는다")
    void create_sameIdempotencyKey_noSecondJob() throws Exception {
        saveClient(tenantId, true, true, true);
        ManualNotificationJobRequest request = allClients(List.of(), false);
        String token = data(perform(PREVIEW_URL, request, admin(tenantId)).andExpect(status().isOk()))
            .get("snapshotToken").asText();
        request.setSnapshotToken(token);
        request.setIdempotencyKey(UUID.randomUUID().toString());

        JsonNode first = data(perform(JOBS_URL, request, admin(tenantId)).andExpect(status().isAccepted()));
        JsonNode second = data(perform(JOBS_URL, request, admin(tenantId)).andExpect(status().isOk()));

        assertThat(second.get("jobId").asText()).isEqualTo(first.get("jobId").asText());
        assertThat(second.get("duplicateRequest").asBoolean()).isTrue();
        assertThat(jobsOfTenant()).hasSize(1);
    }

    @Test
    @DisplayName("상한 500: 500명은 통과, 501명은 422 RECIPIENTS_LIMIT_EXCEEDED 이고 메시지에 500")
    void limit_500Passes_501Rejected() throws Exception {
        List<User> clients = new ArrayList<>();
        for (int i = 0; i < ManualNotificationProperties.DEFAULT_MAX_RECIPIENTS; i++) {
            clients.add(newUser(tenantId, UserRole.CLIENT, true, nextPhone()));
        }
        userRepository.saveAll(clients).forEach(u -> createdUserIds.add(u.getId()));
        ManualNotificationJobRequest request = allClients(List.of(), false);
        assertThat(data(perform(PREVIEW_URL, request, admin(tenantId)).andExpect(status().isOk()))
            .get("finalCount").asInt()).isEqualTo(ManualNotificationProperties.DEFAULT_MAX_RECIPIENTS);

        saveClient(tenantId, true, true, true);
        MvcResult rejected = perform(PREVIEW_URL, request, admin(tenantId))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.errorCode").value(ManualNotificationJobConstants.ERROR_RECIPIENTS_LIMIT_EXCEEDED))
            .andReturn();
        assertThat(objectMapper.readTree(rejected.getResponse().getContentAsString()).get("message").asText())
            .contains(String.valueOf(ManualNotificationProperties.DEFAULT_MAX_RECIPIENTS));

        ManualNotificationJobRequest selected = sms(ManualNotificationRecipientMode.SELECTED);
        List<Long> ids = new ArrayList<>();
        for (long i = 1; i <= ManualNotificationProperties.DEFAULT_MAX_RECIPIENTS + 1; i++) {
            ids.add(i);
        }
        selected.setUserIds(ids);
        MvcResult invalid = perform(PREVIEW_URL, selected, admin(tenantId)).andExpect(status().isBadRequest())
            .andReturn();
        assertThat(invalid.getResponse().getContentAsString())
            .contains(String.valueOf(ManualNotificationProperties.DEFAULT_MAX_RECIPIENTS));
    }

    @Test
    @DisplayName("프로바이더 호출 중 서버가 멈춘 뒤 재개: 멈춘 수신자는 결과 미상 FAILED, 남은 PENDING 만 보내고 중복 기록·중복 호출 없음")
    void resume_afterCrash_noDuplicateDispatch() throws Exception {
        for (int i = 0; i < 7; i++) {
            saveClient(tenantId, true, true, true);
        }
        AtomicInteger calls = new AtomicInteger();
        doAnswer(inv -> {
            smsPhones.add(inv.getArgument(0));
            if (calls.incrementAndGet() == 4) {
                throw new SimulatedCrash();
            }
            return new NotificationDispatchHelper.DispatchResult(true, null, null, null, null);
        }).when(dispatchHelper).dispatchSms(anyString(), anyString());
        ManualNotificationJob job = createdJob(allClients(List.of(), false));

        TenantContextHolder.clear();
        try {
            worker.run(job.getId());
        } catch (SimulatedCrash expected) {
            // 프로세스가 프로바이더 호출 중 죽은 상황
        }
        TenantContextHolder.setTenantId(tenantId);
        ManualNotificationJob crashed = jobRepository.findById(job.getId()).orElseThrow();
        assertThat(crashed.getStatus()).isEqualTo(ManualNotificationJobStatus.RUNNING);
        assertThat(worker.run(job.getId())).as("점유가 살아 있으면 다른 실행자는 못 집는다").isFalse();

        crashed.setLeaseUntil(ManualNotificationJobConstants.nowKst().minusSeconds(1));
        jobRepository.saveAndFlush(crashed);
        TenantContextHolder.clear();
        assertThat(worker.run(job.getId())).isTrue();
        TenantContextHolder.setTenantId(tenantId);

        assertThat(calls.get()).isEqualTo(7);
        assertThat(new HashSet<>(smsPhones)).hasSize(7);
        List<ManualNotificationDispatchRecord> records = dispatchRecordRepository
            .findByJobIdOrderByChunkIndexAscIdAsc(job.getId());
        assertThat(records).hasSize(7);
        assertThat(records.stream().map(ManualNotificationDispatchRecord::getJobRecipientId).distinct().count())
            .isEqualTo(7);
        assertThat(records.stream().filter(r -> r.getStatus() == ManualNotificationDeliveryStatus.DISPATCHING))
            .isEmpty();
        List<ManualNotificationJobRecipient> recipients = recipientRepository.findByJobIdOrderBySeqAsc(job.getId());
        assertThat(recipients.get(3).getStatus()).isEqualTo(ManualNotificationDeliveryStatus.FAILED);
        assertThat(recipients.get(3).getProviderResultCode())
            .isEqualTo(ManualNotificationJobConstants.RESULT_DISPATCH_OUTCOME_UNKNOWN);
        assertThat(records.stream().filter(r -> r.getAttemptNo() == 2).count()).isEqualTo(3);
        ManualNotificationJob done = jobRepository.findById(job.getId()).orElseThrow();
        assertThat(done.getStatus()).isEqualTo(ManualNotificationJobStatus.COMPLETED);
        assertThat(done.getSentCount()).isEqualTo(6);
        assertThat(done.getFailedCount()).isEqualTo(1);
        assertThat(done.getExecutionAttempts()).isEqualTo(2);
    }

    @Test
    @DisplayName("같은 작업을 두 실행자가 동시에 돌려도 한 번만 실행(수신자별 1회 호출)")
    void concurrentRun_executesOnce() throws Exception {
        for (int i = 0; i < 5; i++) {
            saveClient(tenantId, true, true, true);
        }
        ManualNotificationJob job = createdJob(allClients(List.of(), false));
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Boolean>> runs = new ArrayList<>();
            for (int i = 0; i < 2; i++) {
                runs.add(pool.submit(() -> {
                    start.await();
                    return worker.run(job.getId());
                }));
            }
            start.countDown();
            int executed = 0;
            for (Future<Boolean> run : runs) {
                executed += run.get(30, TimeUnit.SECONDS) ? 1 : 0;
            }
            assertThat(executed).isEqualTo(1);
        } finally {
            pool.shutdownNow();
        }
        verify(dispatchHelper, times(5)).dispatchSms(anyString(), anyString());
        assertThat(dispatchRecordRepository.findByJobIdOrderByChunkIndexAscIdAsc(job.getId())).hasSize(5);
    }

    @Test
    @DisplayName("DRY_RUN 모드: 같은 기록 경로, 프로바이더 미호출, 로그 realCall=false")
    void dryRun_sameRecordPathWithoutProviderCall() throws Exception {
        properties.getJob().setProviderMode("DRY_RUN");
        for (int i = 0; i < 4; i++) {
            saveClient(tenantId, true, true, true);
        }
        ManualNotificationJob job = createdJob(allClients(List.of(), false));
        TenantContextHolder.clear();
        worker.run(job.getId());
        TenantContextHolder.setTenantId(tenantId);

        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
        List<ManualNotificationDispatchRecord> records = dispatchRecordRepository
            .findByJobIdOrderByChunkIndexAscIdAsc(job.getId());
        assertThat(records).hasSize(4);
        assertThat(records).allSatisfy(r -> {
            assertThat(r.getStatus()).isEqualTo(ManualNotificationDeliveryStatus.SENT);
            assertThat(r.getProviderResultCode()).isEqualTo(ManualNotificationJobConstants.RESULT_DRY_RUN);
        });
        assertThat(logAppender.list.stream().map(ILoggingEvent::getFormattedMessage)
            .filter(m -> m.startsWith("manual_notification_dispatch_chunk")))
            .allSatisfy(m -> assertThat(m).contains("providerMode=DRY_RUN", "realCall=false"));
    }

    @Test
    @DisplayName("푸시: 청크(3)마다 프로바이더 1회 요청, 크기 3·3·1, 호출 시 트랜잭션·커넥션 0")
    void push_chunkedPerProviderRequest() throws Exception {
        for (int i = 0; i < 7; i++) {
            saveClient(tenantId, true, false, true);
        }
        List<Integer> requestSizes = new CopyOnWriteArrayList<>();
        when(mobilePushDispatchService.dispatchAdminAnnouncement(anyString(), anyList(), anyString(), anyString(),
                anyString())).thenAnswer(inv -> {
                    recordBoundary("dispatchAdminAnnouncement");
                    List<Long> ids = inv.getArgument(1);
                    requestSizes.add(ids.size());
                    List<MobilePushBroadcastResult> out = new ArrayList<>();
                    for (Long id : ids) {
                        out.add(MobilePushBroadcastResult.builder().userId(id)
                            .status(MobilePushBroadcastResult.Status.SENT).build());
                    }
                    return out;
                });
        ManualNotificationJobRequest request = ManualNotificationJobRequest.builder()
            .channel(TestNotificationChannel.PUSH)
            .recipientMode(ManualNotificationRecipientMode.ALL_CLIENTS)
            .excludeIds(List.of())
            .title("공지")
            .body("본문")
            .reason("PR AD 통합 테스트")
            .build();
        ManualNotificationJob job = createdJob(request);
        TenantContextHolder.clear();
        worker.run(job.getId());
        TenantContextHolder.setTenantId(tenantId);

        assertThat(requestSizes).containsExactly(3, 3, 1);
        verify(mobilePushDispatchService, times(3)).dispatchAdminAnnouncement(eq(tenantId), anyList(), anyString(),
            anyString(), eq(job.getJobUuid()));
        assertExternalCallsOutsideTransaction(3);
        assertThat(jobRepository.findById(job.getId()).orElseThrow().getSentCount()).isEqualTo(7);
    }

    @Test
    @DisplayName("내담자·상담사·사무원 세션은 미리보기·생성·조회 403")
    void nonAdminRoles_forbidden() throws Exception {
        saveClient(tenantId, true, true, true);
        for (UserRole role : List.of(UserRole.CLIENT, UserRole.CONSULTANT, UserRole.STAFF)) {
            User caller = caller(role, tenantId);
            perform(PREVIEW_URL, allClients(List.of(), false), caller).andExpect(status().isForbidden());
            ManualNotificationJobRequest create = allClients(List.of(), false);
            create.setIdempotencyKey(UUID.randomUUID().toString());
            create.setSnapshotToken("x");
            perform(JOBS_URL, create, caller).andExpect(status().isForbidden());
            mockMvc.perform(get(JOBS_URL + "/" + UUID.randomUUID())
                    .sessionAttr(SessionConstants.USER_OBJECT, caller)
                    .sessionAttr(SessionConstants.TENANT_ID, tenantId))
                .andExpect(status().isForbidden());
        }
        assertThat(jobsOfTenant()).isEmpty();
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
    }

    @Test
    @WithMockUser(roles = {"CLIENT"})
    @DisplayName("ADMIN 권한이 없는 인증 사용자는 메서드 보안에서 403")
    void clientAuthority_forbiddenByMethodSecurity() throws Exception {
        perform(PREVIEW_URL, allClients(List.of(), false), caller(UserRole.CLIENT, tenantId))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("다른 테넌트 관리자: 이 테넌트 컨텍스트로는 403, 자기 테넌트로는 이 테넌트 작업을 못 본다(404)")
    void otherTenantAdmin_forbiddenAndCannotReadJob() throws Exception {
        saveClient(tenantId, true, true, true);
        ManualNotificationJob job = createdJob(allClients(List.of(), false));
        String otherTenant = tenantId + "x";

        perform(PREVIEW_URL, allClients(List.of(), false), admin(otherTenant)).andExpect(status().isForbidden());
        mockMvc.perform(get(JOBS_URL + "/" + job.getJobUuid())
                .sessionAttr(SessionConstants.USER_OBJECT, admin(otherTenant))
                .sessionAttr(SessionConstants.TENANT_ID, otherTenant))
            .andExpect(status().isForbidden());

        TenantContextHolder.setTenantId(otherTenant);
        MvcResult notFound = mockMvc.perform(get(JOBS_URL + "/" + job.getJobUuid()).param("includeRecords", "true")
                .sessionAttr(SessionConstants.USER_OBJECT, admin(otherTenant))
                .sessionAttr(SessionConstants.TENANT_ID, otherTenant))
            .andExpect(status().isNotFound())
            .andReturn();
        assertThat(notFound.getResponse().getContentAsString()).doesNotContain("records");
        TenantContextHolder.setTenantId(tenantId);
    }

    private ManualNotificationJob createdJob(ManualNotificationJobRequest request) throws Exception {
        String token = data(perform(PREVIEW_URL, request, admin(tenantId)).andExpect(status().isOk()))
            .get("snapshotToken").asText();
        String jobUuid = createJob(request, token);
        return jobRepository.findByTenantIdAndJobUuidAndIsDeletedFalse(tenantId, jobUuid).orElseThrow();
    }

    private String createJob(ManualNotificationJobRequest request, String token) throws Exception {
        request.setSnapshotToken(token);
        request.setIdempotencyKey(UUID.randomUUID().toString());
        return data(perform(JOBS_URL, request, admin(tenantId)).andExpect(status().isAccepted()))
            .get("jobId").asText();
    }

    private ResultActions perform(String url, Object body, User caller) throws Exception {
        return mockMvc.perform(post(url)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(body))
            .sessionAttr(SessionConstants.USER_OBJECT, caller)
            .sessionAttr(SessionConstants.TENANT_ID, caller.getTenantId()));
    }

    private JsonNode data(ResultActions actions) throws Exception {
        return objectMapper.readTree(actions.andReturn().getResponse().getContentAsString()).get("data");
    }

    private List<ManualNotificationJob> jobsOfTenant() {
        return jobRepository.findAll().stream().filter(j -> tenantId.equals(j.getTenantId())).toList();
    }

    private static List<Integer> ints(JsonNode array) {
        List<Integer> out = new ArrayList<>();
        array.forEach(n -> out.add(n.asInt()));
        return out;
    }

    private ManualNotificationJobRequest allClients(List<Long> excludeIds, boolean marketing) {
        ManualNotificationJobRequest request = sms(ManualNotificationRecipientMode.ALL_CLIENTS);
        request.setExcludeIds(excludeIds);
        request.setMarketing(marketing);
        return request;
    }

    private static ManualNotificationJobRequest sms(ManualNotificationRecipientMode mode) {
        return ManualNotificationJobRequest.builder()
            .channel(TestNotificationChannel.SMS)
            .recipientMode(mode)
            .content("[테스트] 안내")
            .reason("PR AD 통합 테스트")
            .build();
    }

    private User saveClient(String tenant, boolean active, boolean withPhone, boolean marketingConsent) {
        User user = saveUser(tenant, UserRole.CLIENT, active, withPhone ? nextPhone() : null);
        UserPrivacyConsent consent = UserPrivacyConsent.builder()
            .tenantId(tenant)
            .userId(user.getId())
            .privacyConsent(true)
            .termsConsent(true)
            .marketingConsent(marketingConsent)
            .consentDate(LocalDateTime.now())
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        consentRepository.saveAndFlush(consent);
        return user;
    }

    private User saveUser(String tenant, UserRole role, boolean active, String phone) {
        User saved = userRepository.saveAndFlush(newUser(tenant, role, active, phone));
        createdUserIds.add(saved.getId());
        return saved;
    }

    private static User newUser(String tenant, UserRole role, boolean active, String phone) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenant);
        user.setUserId("mnj-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("mnj-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName("수신자" + suffix);
        user.setRole(role);
        user.setIsActive(active);
        user.setIsDeleted(false);
        user.setPhone(phone);
        return user;
    }

    private String nextPhone() {
        String digits = String.valueOf(1_000_000 + phoneSeq.incrementAndGet());
        return PHONE_PREFIX + digits.substring(digits.length() - PHONE_SUFFIX_WIDTH);
    }

    private static User admin(String tenant) {
        return caller(UserRole.ADMIN, tenant);
    }

    private static User caller(UserRole role, String tenant) {
        User user = new User();
        user.setId(CALLER_ID);
        user.setUserId("mnj-caller-" + role);
        user.setRole(role);
        user.setTenantId(tenant);
        return user;
    }

    private void recordBoundary(String call) {
        boundaries.add(new CallBoundary(call,
            TransactionSynchronizationManager.isActualTransactionActive(),
            TransactionSynchronizationManager.isSynchronizationActive(),
            TransactionSynchronizationManager.hasResource(entityManagerFactory),
            activeConnections()));
    }

    private void assertExternalCallsOutsideTransaction(int expectedCalls) {
        assertThat(boundaries).hasSize(expectedCalls);
        assertThat(boundaries).allSatisfy(b -> {
            assertThat(b.actualTransaction()).as(b.call() + " actualTransaction").isFalse();
            assertThat(b.synchronization()).as(b.call() + " synchronization").isFalse();
            assertThat(b.entityManagerBound()).as(b.call() + " entityManagerBound").isFalse();
            assertThat(b.activeConnections()).as(b.call() + " activeConnections").isZero();
        });
    }

    private int activeConnections() {
        try {
            return dataSource.unwrap(HikariDataSource.class).getHikariPoolMXBean().getActiveConnections();
        } catch (SQLException e) {
            throw new IllegalStateException(e);
        }
    }

    private record CallBoundary(String call, boolean actualTransaction, boolean synchronization,
            boolean entityManagerBound, int activeConnections) {
    }

    /** 프로바이더 호출 중 프로세스 중단 흉내(워커가 잡지 않는 Error). */
    private static final class SimulatedCrash extends Error {
        private static final long serialVersionUID = 1L;
    }
}
