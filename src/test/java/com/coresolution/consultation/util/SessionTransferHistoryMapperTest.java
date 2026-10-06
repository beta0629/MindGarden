package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.MappingHistoryEventType;
import com.coresolution.consultation.constant.SessionSuccessionConstants;
import com.coresolution.consultation.constant.SessionTransferHistoryConstants;
import com.coresolution.consultation.dto.SessionTransferHistoryItemResponse;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.ConsultantClientMappingHistory;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 회기 승계·이관 이력 매퍼 — 감사 JSON·notes·헤드라인.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@DisplayName("SessionTransferHistoryMapper")
class SessionTransferHistoryMapperTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Long CLIENT_SUNHEE = 1001L;
    private static final Long CLIENT_YERIN = 1002L;
    private static final Long MAPPING_SUNHEE = 5001L;
    private static final Long MAPPING_YERIN = 5002L;
    private static final String TENANT = "tenant-transfer-hist-" + UUID.randomUUID();

    @Test
    @DisplayName("감사 로그 metadata → 소스/타깃 매핑·회기·사유를 매핑한다")
    void fromAuditLog_mapsMetadata() {
        String json = """
                {"sourceMappingId":5001,"targetMappingId":5002,"sessionCount":6,\
                "sourceClientId":1001,"targetClientId":1002,"reason":"가족 승계"}
                """;
        AuditLog log = AuditLog.builder()
                .id(11L)
                .tenantId(TENANT)
                .action(AuditAction.MAPPING_SESSION_SUCCESSION)
                .entityType(SessionSuccessionConstants.ENTITY_TYPE_MAPPING)
                .entityId(MAPPING_SUNHEE)
                .metadataJson(json)
                .createdAt(LocalDateTime.of(2026, 3, 1, 10, 0))
                .build();

        SessionTransferHistoryDraft draft = SessionTransferHistoryMapper.fromAuditLog(log, OBJECT_MAPPER)
                .orElseThrow();

        assertThat(draft.getSessionCount()).isEqualTo(6);
        assertThat(draft.getSourceMappingId()).isEqualTo(MAPPING_SUNHEE);
        assertThat(draft.getTargetMappingId()).isEqualTo(MAPPING_YERIN);
        assertThat(draft.getSourceClientId()).isEqualTo(CLIENT_SUNHEE);
        assertThat(draft.getTargetClientId()).isEqualTo(CLIENT_YERIN);
        assertThat(draft.getReason()).isEqualTo("가족 승계");
        assertThat(draft.getRecordSource()).isEqualTo(SessionTransferHistoryConstants.RECORD_SOURCE_AUDIT_LOG);
    }

    @Test
    @DisplayName("sessionCount 없는 감사 JSON은 이벤트를 발명하지 않고 empty")
    void fromAuditLog_missingSessionCount_empty() {
        AuditLog log = AuditLog.builder()
                .metadataJson("{\"sourceMappingId\":1,\"targetMappingId\":2}")
                .build();
        assertThat(SessionTransferHistoryMapper.fromAuditLog(log, OBJECT_MAPPER)).isEmpty();
    }

    @Test
    @DisplayName("소스 notes 「N회 → 타깃매핑#」와 타깃 notes 「소스매핑#에서 N회 수령」을 파싱한다")
    void fromMappingNotes_parsesBothDirections() {
        String sourceNotes = "[회기 승계] 6회 → 타깃매핑#5002 (수혜자#1002, 상담사#9) 사유: 가족";
        List<SessionTransferHistoryDraft> outgoing = SessionTransferHistoryMapper.fromMappingNotes(
                MAPPING_SUNHEE, CLIENT_SUNHEE, 9L, sourceNotes, LocalDateTime.of(2026, 3, 1, 10, 0));
        assertThat(outgoing).hasSize(1);
        assertThat(outgoing.get(0).getSessionCount()).isEqualTo(6);
        assertThat(outgoing.get(0).getTargetMappingId()).isEqualTo(MAPPING_YERIN);
        assertThat(outgoing.get(0).getTargetClientId()).isEqualTo(CLIENT_YERIN);
        assertThat(outgoing.get(0).getReason()).isEqualTo("가족");

        String targetNotes = "[회기 승계] 소스매핑#5002에서 5회 수령 사유: 반환";
        List<SessionTransferHistoryDraft> incoming = SessionTransferHistoryMapper.fromMappingNotes(
                MAPPING_SUNHEE, CLIENT_SUNHEE, 9L, targetNotes, LocalDateTime.of(2026, 4, 1, 10, 0));
        assertThat(incoming).hasSize(1);
        assertThat(incoming.get(0).getSourceMappingId()).isEqualTo(MAPPING_YERIN);
        assertThat(incoming.get(0).getSessionCount()).isEqualTo(5);
        assertThat(incoming.get(0).getTargetMappingId()).isEqualTo(MAPPING_SUNHEE);
        assertThat(incoming.get(0).getReason()).isEqualTo("반환");
    }

    @Test
    @DisplayName("매핑 이력 after_state_json 의 승계 메타를 매핑한다")
    void fromMappingHistory_readsAfterStateJson() {
        ConsultantClientMappingHistory history = ConsultantClientMappingHistory.builder()
                .id(21L)
                .tenantId(TENANT)
                .mappingId(MAPPING_YERIN)
                .clientId(CLIENT_YERIN)
                .eventType(MappingHistoryEventType.SESSION_ADDED)
                .afterStateJson("""
                        {"sourceMappingId":5002,"targetMappingId":5001,"sessionCount":5,\
                        "sourceClientId":1002,"targetClientId":1001}
                        """)
                .createdAt(LocalDateTime.of(2026, 4, 1, 11, 0))
                .build();

        SessionTransferHistoryDraft draft = SessionTransferHistoryMapper.fromMappingHistory(history, OBJECT_MAPPER)
                .orElseThrow();
        assertThat(draft.getSessionCount()).isEqualTo(5);
        assertThat(draft.getSourceMappingId()).isEqualTo(MAPPING_YERIN);
        assertThat(draft.getTargetMappingId()).isEqualTo(MAPPING_SUNHEE);
        assertThat(draft.getRecordSource()).isEqualTo(SessionTransferHistoryConstants.RECORD_SOURCE_MAPPING_HISTORY);
    }

    @Test
    @DisplayName("SESSION_USED 이력은 승계 이벤트로 쓰지 않는다")
    void fromMappingHistory_ignoresSessionUsed() {
        ConsultantClientMappingHistory history = ConsultantClientMappingHistory.builder()
                .eventType(MappingHistoryEventType.SESSION_USED)
                .afterStateJson("{\"sourceMappingId\":1,\"targetMappingId\":2,\"sessionCount\":1}")
                .build();
        assertThat(SessionTransferHistoryMapper.fromMappingHistory(history, OBJECT_MAPPER)).isEmpty();
    }

    @Test
    @DisplayName("동일 키는 감사 로그를 notes 보다 우선하고 중복을 제거한다")
    void dedupe_prefersAuditOverNotes() {
        SessionTransferHistoryDraft audit = SessionTransferHistoryDraft.builder()
                .id(1L)
                .sessionCount(6)
                .sourceMappingId(MAPPING_SUNHEE)
                .targetMappingId(MAPPING_YERIN)
                .recordSource(SessionTransferHistoryConstants.RECORD_SOURCE_AUDIT_LOG)
                .sourcePriority(3)
                .occurredAt(LocalDateTime.of(2026, 3, 1, 10, 0))
                .build();
        SessionTransferHistoryDraft note = SessionTransferHistoryDraft.builder()
                .sessionCount(6)
                .sourceMappingId(MAPPING_SUNHEE)
                .targetMappingId(MAPPING_YERIN)
                .recordSource(SessionTransferHistoryConstants.RECORD_SOURCE_MAPPING_NOTE)
                .sourcePriority(1)
                .occurredAt(LocalDateTime.of(2026, 3, 1, 10, 1))
                .build();

        List<SessionTransferHistoryDraft> unique = SessionTransferHistoryMapper.dedupe(List.of(note, audit));
        assertThat(unique).hasSize(1);
        assertThat(unique.get(0).getRecordSource())
                .isEqualTo(SessionTransferHistoryConstants.RECORD_SOURCE_AUDIT_LOG);
    }

    @Test
    @DisplayName("조회 내담자가 소스이면 승계, 타깃이면 이관 헤드라인")
    void headline_outgoingSuccession_incomingTransfer() {
        SessionTransferHistoryDraft outgoing = SessionTransferHistoryDraft.builder()
                .sessionCount(6)
                .sourceMappingId(MAPPING_SUNHEE)
                .targetMappingId(MAPPING_YERIN)
                .sourceClientId(CLIENT_SUNHEE)
                .targetClientId(CLIENT_YERIN)
                .build();
        SessionTransferHistoryDraft incoming = SessionTransferHistoryDraft.builder()
                .sessionCount(5)
                .sourceMappingId(MAPPING_YERIN)
                .targetMappingId(MAPPING_SUNHEE)
                .sourceClientId(CLIENT_YERIN)
                .targetClientId(CLIENT_SUNHEE)
                .build();

        String outDir = SessionTransferHistoryMapper.resolveDirection(outgoing, CLIENT_SUNHEE, null).orElseThrow();
        String inDir = SessionTransferHistoryMapper.resolveDirection(incoming, CLIENT_SUNHEE, null).orElseThrow();
        assertThat(outDir).isEqualTo(SessionTransferHistoryConstants.DIRECTION_OUTGOING);
        assertThat(inDir).isEqualTo(SessionTransferHistoryConstants.DIRECTION_INCOMING);

        SessionTransferHistoryItemResponse outItem = SessionTransferHistoryMapper.toItemResponse(
                outgoing, outDir, "임선희", "김예린", "상담A", "상담B");
        SessionTransferHistoryItemResponse inItem = SessionTransferHistoryMapper.toItemResponse(
                incoming, inDir, "김예린", "임선희", "상담B", "상담A");

        assertThat(outItem.getHeadline()).isEqualTo("임선희 → 김예린: 6회 승계");
        assertThat(inItem.getHeadline()).isEqualTo("김예린 → 임선희: 5회 이관");
        assertThat(outItem.getFromMappingId()).isEqualTo(MAPPING_SUNHEE);
        assertThat(inItem.getToMappingId()).isEqualTo(MAPPING_SUNHEE);
    }

    @Test
    @DisplayName("formatHeadline 은 빈 이름을 알 수 없음으로 대체한다")
    void formatHeadline_unknownFallback() {
        assertThat(SessionTransferHistoryMapper.formatHeadline(null, "김예린", 6, "승계"))
                .isEqualTo("알 수 없음 → 김예린: 6회 승계");
    }

    @Test
    @DisplayName("조회 매핑과 무관한 초안은 involvesViewer false")
    void involvesViewer_rejectsUnrelated() {
        SessionTransferHistoryDraft draft = SessionTransferHistoryDraft.builder()
                .sessionCount(2)
                .sourceMappingId(9L)
                .targetMappingId(8L)
                .sourceClientId(3L)
                .targetClientId(4L)
                .build();
        assertThat(SessionTransferHistoryMapper.involvesViewer(
                draft, CLIENT_SUNHEE, MAPPING_SUNHEE, Set.of(MAPPING_SUNHEE))).isFalse();
        assertThat(SessionTransferHistoryMapper.resolveDirection(draft, CLIENT_SUNHEE, MAPPING_SUNHEE))
                .isEqualTo(Optional.empty());
    }
}
