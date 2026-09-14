package com.coresolution.consultation.util;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.coresolution.consultation.constant.MappingHistoryEventType;
import com.coresolution.consultation.constant.SessionSuccessionConstants;
import com.coresolution.consultation.constant.SessionTransferHistoryConstants;
import com.coresolution.consultation.dto.SessionTransferHistoryItemResponse;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.ConsultantClientMappingHistory;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 회기 승계·이관 이력을 감사 로그·매핑 이력·notes 에서 읽어 정규화한다.
 *
 * <p>없는 이벤트를 만들지 않는다. sessionCount 또는 양쪽 매핑 ID가 없으면 해당 행을 건너뛴다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
public final class SessionTransferHistoryMapper {

    private static final int PRIORITY_AUDIT = 3;
    private static final int PRIORITY_HISTORY = 2;
    private static final int PRIORITY_NOTE = 1;

    private static final Pattern SOURCE_NOTE_PATTERN = Pattern.compile(
            "\\[회기 승계\\]\\s*(\\d+)회\\s*→\\s*타깃매핑#(\\d+)"
                    + "(?:\\s*\\(\\s*수혜자#(\\d+)\\s*,\\s*상담사#(\\d+)\\s*\\))?"
                    + "(?:\\s*사유:\\s*(.+))?");

    private static final Pattern TARGET_NOTE_PATTERN = Pattern.compile(
            "\\[회기 승계\\]\\s*소스매핑#(\\d+)에서\\s*(\\d+)회\\s*수령(?:\\s*사유:\\s*(.+))?");

    private SessionTransferHistoryMapper() {
    }

    /**
     * 감사 로그 metadataJson 을 이력 초안으로 변환한다.
     *
     * @param log 감사 로그
     * @param objectMapper JSON 파서
     * @return 파싱 성공 시 초안
     */
    public static Optional<SessionTransferHistoryDraft> fromAuditLog(AuditLog log, ObjectMapper objectMapper) {
        if (log == null) {
            return Optional.empty();
        }
        JsonNode meta = readObjectNode(log.getMetadataJson(), objectMapper);
        SessionTransferHistoryDraft draft = fromJsonNode(
                meta,
                log.getId(),
                log.getCreatedAt(),
                SessionTransferHistoryConstants.RECORD_SOURCE_AUDIT_LOG,
                PRIORITY_AUDIT);
        return Optional.ofNullable(draft);
    }

    /**
     * 매핑 이력 JSON·사유에서 승계 기록이 있으면 초안으로 변환한다.
     *
     * @param history 매핑 이력
     * @param objectMapper JSON 파서
     * @return 파싱 성공 시 초안
     */
    public static Optional<SessionTransferHistoryDraft> fromMappingHistory(
            ConsultantClientMappingHistory history,
            ObjectMapper objectMapper) {
        if (history == null) {
            return Optional.empty();
        }
        if (history.getEventType() == MappingHistoryEventType.SESSION_USED) {
            return Optional.empty();
        }
        JsonNode after = readObjectNode(history.getAfterStateJson(), objectMapper);
        SessionTransferHistoryDraft fromJson = fromJsonNode(
                after,
                history.getId(),
                history.getCreatedAt(),
                SessionTransferHistoryConstants.RECORD_SOURCE_MAPPING_HISTORY,
                PRIORITY_HISTORY);
        if (fromJson != null) {
            if (fromJson.getSourceClientId() == null) {
                fromJson.setSourceClientId(history.getClientId());
            }
            if (fromJson.getSourceConsultantId() == null) {
                fromJson.setSourceConsultantId(history.getConsultantId());
            }
            if (fromJson.getReason() == null || fromJson.getReason().isBlank()) {
                fromJson.setReason(trimToNull(history.getReason()));
            }
            return Optional.of(fromJson);
        }
        String reason = history.getReason();
        if (reason == null || !reason.contains(SessionSuccessionConstants.SOURCE_NOTE_MARKER)) {
            return Optional.empty();
        }
        List<SessionTransferHistoryDraft> fromReason = fromMappingNotes(
                history.getMappingId(),
                history.getClientId(),
                history.getConsultantId(),
                reason,
                history.getCreatedAt());
        if (fromReason.isEmpty()) {
            return Optional.empty();
        }
        SessionTransferHistoryDraft draft = fromReason.get(0);
        draft.setId(history.getId());
        draft.setRecordSource(SessionTransferHistoryConstants.RECORD_SOURCE_MAPPING_HISTORY);
        draft.setSourcePriority(PRIORITY_HISTORY);
        return Optional.of(draft);
    }

    /**
     * 매핑 notes 의 승계 마커 줄을 초안으로 변환한다.
     *
     * @param mappingId 노트가 적힌 매핑 ID
     * @param clientId 매핑 내담자 ID
     * @param consultantId 매핑 상담사 ID
     * @param notes 노트 전문
     * @param fallbackAt 노트에 시각이 없을 때 사용
     * @return 파싱된 초안 목록(이벤트 미발명)
     */
    public static List<SessionTransferHistoryDraft> fromMappingNotes(
            Long mappingId,
            Long clientId,
            Long consultantId,
            String notes,
            LocalDateTime fallbackAt) {
        List<SessionTransferHistoryDraft> drafts = new ArrayList<>();
        if (notes == null || notes.isBlank()
                || !notes.contains(SessionSuccessionConstants.SOURCE_NOTE_MARKER)) {
            return drafts;
        }
        String[] lines = notes.split("\\R");
        for (String line : lines) {
            if (line == null || line.isBlank()) {
                continue;
            }
            Matcher sourceMatcher = SOURCE_NOTE_PATTERN.matcher(line.trim());
            if (sourceMatcher.find()) {
                Integer sessionCount = parsePositiveInt(sourceMatcher.group(1));
                Long targetMappingId = parseLong(sourceMatcher.group(2));
                if (sessionCount == null || mappingId == null || targetMappingId == null) {
                    continue;
                }
                drafts.add(SessionTransferHistoryDraft.builder()
                        .occurredAt(fallbackAt)
                        .sessionCount(sessionCount)
                        .sourceMappingId(mappingId)
                        .targetMappingId(targetMappingId)
                        .sourceClientId(clientId)
                        .targetClientId(parseLong(sourceMatcher.group(3)))
                        .sourceConsultantId(consultantId)
                        .targetConsultantId(parseLong(sourceMatcher.group(4)))
                        .reason(trimToNull(sourceMatcher.group(5)))
                        .recordSource(SessionTransferHistoryConstants.RECORD_SOURCE_MAPPING_NOTE)
                        .sourcePriority(PRIORITY_NOTE)
                        .build());
                continue;
            }
            Matcher targetMatcher = TARGET_NOTE_PATTERN.matcher(line.trim());
            if (targetMatcher.find()) {
                Long sourceMappingId = parseLong(targetMatcher.group(1));
                Integer sessionCount = parsePositiveInt(targetMatcher.group(2));
                if (sessionCount == null || mappingId == null || sourceMappingId == null) {
                    continue;
                }
                drafts.add(SessionTransferHistoryDraft.builder()
                        .occurredAt(fallbackAt)
                        .sessionCount(sessionCount)
                        .sourceMappingId(sourceMappingId)
                        .targetMappingId(mappingId)
                        .targetClientId(clientId)
                        .targetConsultantId(consultantId)
                        .reason(trimToNull(targetMatcher.group(3)))
                        .recordSource(SessionTransferHistoryConstants.RECORD_SOURCE_MAPPING_NOTE)
                        .sourcePriority(PRIORITY_NOTE)
                        .build());
            }
        }
        return drafts;
    }

    /**
     * sourceMappingId:targetMappingId:sessionCount 기준으로 중복을 제거한다.
     * 우선순위는 감사 로그 &gt; 매핑 이력 &gt; notes. 같으면 시각이 늦은 쪽.
     *
     * @param drafts 초안 목록
     * @return 중복 제거된 목록
     */
    public static List<SessionTransferHistoryDraft> dedupe(Collection<SessionTransferHistoryDraft> drafts) {
        Map<String, SessionTransferHistoryDraft> byKey = new LinkedHashMap<>();
        if (drafts == null) {
            return new ArrayList<>();
        }
        List<SessionTransferHistoryDraft> sorted = new ArrayList<>(drafts);
        sorted.sort(Comparator
                .comparing(SessionTransferHistoryDraft::getSourcePriority, Comparator.nullsLast(Integer::compareTo))
                .reversed()
                .thenComparing(SessionTransferHistoryDraft::getOccurredAt,
                        Comparator.nullsLast(Comparator.reverseOrder())));
        for (SessionTransferHistoryDraft draft : sorted) {
            if (draft == null || !isUsable(draft)) {
                continue;
            }
            String key = dedupeKey(draft);
            byKey.putIfAbsent(key, draft);
        }
        return new ArrayList<>(byKey.values());
    }

    /**
     * 조회 대상 내담자·매핑과 관련된 이력만 남긴다.
     *
     * @param draft 초안
     * @param viewerClientId 조회 내담자
     * @param viewerMappingId 조회 매핑
     * @param viewerMappingIds 조회 내담자의 매핑 ID 집합
     * @return 관련되면 true
     */
    public static boolean involvesViewer(
            SessionTransferHistoryDraft draft,
            Long viewerClientId,
            Long viewerMappingId,
            Set<Long> viewerMappingIds) {
        if (draft == null) {
            return false;
        }
        if (viewerMappingId != null) {
            return viewerMappingId.equals(draft.getSourceMappingId())
                    || viewerMappingId.equals(draft.getTargetMappingId());
        }
        if (viewerClientId != null) {
            if (viewerClientId.equals(draft.getSourceClientId())
                    || viewerClientId.equals(draft.getTargetClientId())) {
                return true;
            }
        }
        if (viewerMappingIds != null && !viewerMappingIds.isEmpty()) {
            return containsId(viewerMappingIds, draft.getSourceMappingId())
                    || containsId(viewerMappingIds, draft.getTargetMappingId());
        }
        return false;
    }

    /**
     * 조회 기준 상대 방향. 소스이면 승계(OUTGOING), 타깃이면 이관(INCOMING).
     *
     * @param draft 초안
     * @param viewerClientId 조회 내담자
     * @param viewerMappingId 조회 매핑
     * @return 방향 코드, 판별 불가면 empty
     */
    public static Optional<String> resolveDirection(
            SessionTransferHistoryDraft draft,
            Long viewerClientId,
            Long viewerMappingId) {
        if (draft == null) {
            return Optional.empty();
        }
        if (viewerMappingId != null) {
            if (viewerMappingId.equals(draft.getSourceMappingId())) {
                return Optional.of(SessionTransferHistoryConstants.DIRECTION_OUTGOING);
            }
            if (viewerMappingId.equals(draft.getTargetMappingId())) {
                return Optional.of(SessionTransferHistoryConstants.DIRECTION_INCOMING);
            }
        }
        if (viewerClientId != null) {
            if (viewerClientId.equals(draft.getSourceClientId())) {
                return Optional.of(SessionTransferHistoryConstants.DIRECTION_OUTGOING);
            }
            if (viewerClientId.equals(draft.getTargetClientId())) {
                return Optional.of(SessionTransferHistoryConstants.DIRECTION_INCOMING);
            }
        }
        return Optional.empty();
    }

    /**
     * 방향에 따른 동사.
     *
     * @param direction OUTGOING 또는 INCOMING
     * @return 승계 또는 이관
     */
    public static String verbForDirection(String direction) {
        if (SessionTransferHistoryConstants.DIRECTION_INCOMING.equals(direction)) {
            return SessionTransferHistoryConstants.VERB_TRANSFER;
        }
        return SessionTransferHistoryConstants.VERB_SUCCESSION;
    }

    /**
     * {@code 임선희 → 김예린: 6회 승계} 헤드라인.
     *
     * @param fromName 소스 이름
     * @param toName 타깃 이름
     * @param sessionCount 회기 수
     * @param verb 승계 또는 이관
     * @return 표시 문자열
     */
    public static String formatHeadline(String fromName, String toName, Integer sessionCount, String verb) {
        String from = (fromName == null || fromName.isBlank())
                ? SessionTransferHistoryConstants.UNKNOWN_NAME : fromName.trim();
        String to = (toName == null || toName.isBlank())
                ? SessionTransferHistoryConstants.UNKNOWN_NAME : toName.trim();
        int count = sessionCount != null ? sessionCount : 0;
        String resolvedVerb = (verb == null || verb.isBlank())
                ? SessionTransferHistoryConstants.VERB_SUCCESSION : verb.trim();
        return String.format(SessionTransferHistoryConstants.HEADLINE_FMT, from, to, count, resolvedVerb);
    }

    /**
     * 초안 + 표시명을 응답 DTO 로 변환한다.
     *
     * @param draft 초안
     * @param direction 방향
     * @param fromClientName 소스 내담자명
     * @param toClientName 타깃 내담자명
     * @param fromConsultantName 소스 상담사명
     * @param toConsultantName 타깃 상담사명
     * @return 응답 항목
     */
    public static SessionTransferHistoryItemResponse toItemResponse(
            SessionTransferHistoryDraft draft,
            String direction,
            String fromClientName,
            String toClientName,
            String fromConsultantName,
            String toConsultantName) {
        String verb = verbForDirection(direction);
        return SessionTransferHistoryItemResponse.builder()
                .id(draft.getId())
                .occurredAt(draft.getOccurredAt())
                .sessionCount(draft.getSessionCount())
                .fromClientId(draft.getSourceClientId())
                .fromClientName(fromClientName)
                .toClientId(draft.getTargetClientId())
                .toClientName(toClientName)
                .fromMappingId(draft.getSourceMappingId())
                .toMappingId(draft.getTargetMappingId())
                .fromConsultantId(draft.getSourceConsultantId())
                .fromConsultantName(fromConsultantName)
                .toConsultantId(draft.getTargetConsultantId())
                .toConsultantName(toConsultantName)
                .reason(trimToNull(draft.getReason()))
                .direction(direction)
                .verb(verb)
                .headline(formatHeadline(fromClientName, toClientName, draft.getSessionCount(), verb))
                .recordSource(draft.getRecordSource())
                .build();
    }

    private static SessionTransferHistoryDraft fromJsonNode(
            JsonNode meta,
            Long id,
            LocalDateTime occurredAt,
            String recordSource,
            int priority) {
        if (meta == null || !meta.isObject()) {
            return null;
        }
        Long sourceMappingId = longField(meta, SessionTransferHistoryConstants.META_SOURCE_MAPPING_ID);
        Long targetMappingId = longField(meta, SessionTransferHistoryConstants.META_TARGET_MAPPING_ID);
        Integer sessionCount = intField(meta, SessionTransferHistoryConstants.META_SESSION_COUNT);
        if (sessionCount == null || sessionCount < 1 || sourceMappingId == null || targetMappingId == null) {
            return null;
        }
        return SessionTransferHistoryDraft.builder()
                .id(id)
                .occurredAt(occurredAt)
                .sessionCount(sessionCount)
                .sourceMappingId(sourceMappingId)
                .targetMappingId(targetMappingId)
                .sourceClientId(longField(meta, SessionTransferHistoryConstants.META_SOURCE_CLIENT_ID))
                .targetClientId(longField(meta, SessionTransferHistoryConstants.META_TARGET_CLIENT_ID))
                .sourceConsultantId(longField(meta, SessionTransferHistoryConstants.META_SOURCE_CONSULTANT_ID))
                .targetConsultantId(longField(meta, SessionTransferHistoryConstants.META_TARGET_CONSULTANT_ID))
                .reason(textField(meta, SessionTransferHistoryConstants.META_REASON))
                .recordSource(recordSource)
                .sourcePriority(priority)
                .build();
    }

    private static boolean isUsable(SessionTransferHistoryDraft draft) {
        return draft.getSessionCount() != null
                && draft.getSessionCount() >= 1
                && draft.getSourceMappingId() != null
                && draft.getTargetMappingId() != null;
    }

    private static String dedupeKey(SessionTransferHistoryDraft draft) {
        return draft.getSourceMappingId() + ":" + draft.getTargetMappingId() + ":" + draft.getSessionCount();
    }

    private static boolean containsId(Set<Long> ids, Long value) {
        return value != null && ids.contains(value);
    }

    private static JsonNode readObjectNode(String json, ObjectMapper objectMapper) {
        if (json == null || json.isBlank() || objectMapper == null) {
            return null;
        }
        try {
            JsonNode node = objectMapper.readTree(json);
            return node != null && node.isObject() ? node : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static Long longField(JsonNode node, String field) {
        if (node == null || field == null || !node.has(field) || node.get(field).isNull()) {
            return null;
        }
        JsonNode value = node.get(field);
        if (value.isNumber()) {
            return value.longValue();
        }
        if (value.isTextual()) {
            return parseLong(value.asText());
        }
        return null;
    }

    private static Integer intField(JsonNode node, String field) {
        Long value = longField(node, field);
        if (value == null) {
            return null;
        }
        return value.intValue();
    }

    private static String textField(JsonNode node, String field) {
        if (node == null || field == null || !node.has(field) || node.get(field).isNull()) {
            return null;
        }
        JsonNode value = node.get(field);
        if (value.isTextual()) {
            return trimToNull(value.asText());
        }
        return trimToNull(value.asText());
    }

    private static Long parseLong(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(raw.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Integer parsePositiveInt(String raw) {
        Long value = parseLong(raw);
        if (value == null || value < 1) {
            return null;
        }
        return value.intValue();
    }

    private static String trimToNull(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
