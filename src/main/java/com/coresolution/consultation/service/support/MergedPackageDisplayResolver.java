package com.coresolution.consultation.service.support;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;

import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;

/**
 * 추가 패키지 병합({@code AdminServiceImpl#mergeAdditionalPackageIntoActiveAndTerminate}) 이후
 * 원 매핑의 {@code packageName} / {@code packagePrice}를 변경하지 않고,
 * 읽기 시점에 병합된 추가 패키지명을 조합해 UI 표시용 {@code displayPackageName}을 산출한다.
 *
 * <p>기존 운영 데이터 backfill 없이 TERMINATED 병합 이력 행을 읽어 과거·신규 건 모두 동일하게 표시한다.
 * {@code tenantId} 격리를 강제한다.</p>
 *
 * @author CoreSolution
 * @since 2026-11-21
 */
public final class MergedPackageDisplayResolver {

    /** FE {@code packagePricing.buildCombinedPackageName} 규약과 동일한 구분자. */
    public static final String PACKAGE_DISPLAY_JOINER = " + ";

    private static final Comparator<ConsultantClientMapping> MERGE_ORDER_COMPARATOR = Comparator
            .comparing(ConsultantClientMapping::getTerminatedAt, Comparator.nullsLast(LocalDateTime::compareTo))
            .thenComparing(ConsultantClientMapping::getCreatedAt, Comparator.nullsLast(LocalDateTime::compareTo))
            .thenComparing(ConsultantClientMapping::getId, Comparator.nullsLast(Long::compareTo));

    private MergedPackageDisplayResolver() {
    }

    /**
     * 원 상품명과 병합된 추가 상품명 목록으로부터 파생 표시 정보.
     *
     * @param rawPackageName 원 매핑의 {@code packageName} (로직 입력·불변)
     * @param displayPackageName UI 표시용 조합명 (합산 없으면 {@code rawPackageName})
     * @param mergedPackageNames 병합된 추가 패키지명 목록 (병합 순, 없으면 빈 리스트)
     */
    public record MergedPackageDisplay(
            String rawPackageName,
            String displayPackageName,
            List<String> mergedPackageNames) {

        public static MergedPackageDisplay plain(String rawPackageName) {
            return new MergedPackageDisplay(rawPackageName, rawPackageName, Collections.emptyList());
        }

        public static MergedPackageDisplay of(String rawPackageName, List<String> mergedPackageNames) {
            if (mergedPackageNames == null || mergedPackageNames.isEmpty()) {
                return plain(rawPackageName);
            }
            List<String> cleanMerged = new ArrayList<>(mergedPackageNames.size());
            for (String item : mergedPackageNames) {
                if (item != null && !item.isBlank()) {
                    cleanMerged.add(item.trim());
                }
            }
            if (cleanMerged.isEmpty()) {
                return plain(rawPackageName);
            }
            List<String> displayParts = new ArrayList<>(1 + cleanMerged.size());
            if (rawPackageName != null && !rawPackageName.isBlank()) {
                displayParts.add(rawPackageName.trim());
            }
            displayParts.addAll(cleanMerged);
            String joined = String.join(PACKAGE_DISPLAY_JOINER, displayParts);
            return new MergedPackageDisplay(
                    rawPackageName,
                    joined,
                    Collections.unmodifiableList(cleanMerged));
        }
    }

    /**
     * 단건 매핑의 표시명 산출 (clientId fallback 허용).
     *
     * @param tenantId 테넌트 ID
     * @param targetMapping 대상 매핑
     * @param fallbackClientId {@code targetMapping.getClient()}가 null일 때 사용할 내담자 ID
     * @param mappingRepository 매핑 저장소
     * @return 파생 표시 정보
     */
    public static MergedPackageDisplay resolveSingle(
            String tenantId,
            ConsultantClientMapping targetMapping,
            Long fallbackClientId,
            ConsultantClientMappingRepository mappingRepository) {
        if (targetMapping == null) {
            return MergedPackageDisplay.plain(null);
        }
        Set<Long> extraClientIds = fallbackClientId != null ? Set.of(fallbackClientId) : Collections.emptySet();
        Map<Long, MergedPackageDisplay> map = resolveBatch(
                tenantId,
                Collections.singletonList(targetMapping),
                extraClientIds,
                mappingRepository);
        if (targetMapping.getId() != null && map.containsKey(targetMapping.getId())) {
            return map.get(targetMapping.getId());
        }
        return MergedPackageDisplay.plain(targetMapping.getPackageName());
    }

    /**
     * 매핑 목록에 대한 배치 표시명 산출 (최대 1회 DB 조회).
     *
     * @param tenantId 테넌트 ID
     * @param targetMappings 대상 매핑 컬렉션
     * @param mappingRepository 매핑 저장소
     * @return {@code mappingId -> MergedPackageDisplay}
     */
    public static Map<Long, MergedPackageDisplay> resolveBatch(
            String tenantId,
            Collection<ConsultantClientMapping> targetMappings,
            ConsultantClientMappingRepository mappingRepository) {
        return resolveBatch(tenantId, targetMappings, Collections.emptySet(), mappingRepository);
    }

    /**
     * 매핑 목록과 추가 내담자 ID 집합을 이용한 배치 표시명 산출 (최대 1회 DB 조회).
     *
     * @param tenantId 테넌트 ID
     * @param targetMappings 대상 매핑 컬렉션
     * @param extraClientIds 추가 내담자 ID (예: {@code Schedule.getClientId()})
     * @param mappingRepository 매핑 저장소
     * @return {@code mappingId -> MergedPackageDisplay}
     */
    public static Map<Long, MergedPackageDisplay> resolveBatch(
            String tenantId,
            Collection<ConsultantClientMapping> targetMappings,
            Collection<Long> extraClientIds,
            ConsultantClientMappingRepository mappingRepository) {
        if (targetMappings == null || targetMappings.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<Long> clientIds = new LinkedHashSet<>();
        if (extraClientIds != null) {
            for (Long cid : extraClientIds) {
                if (cid != null) {
                    clientIds.add(cid);
                }
            }
        }
        for (ConsultantClientMapping mapping : targetMappings) {
            if (mapping != null && mapping.getClient() != null && mapping.getClient().getId() != null) {
                clientIds.add(mapping.getClient().getId());
            }
        }

        List<ConsultantClientMapping> dbMergedCandidates = Collections.emptyList();
        if (mappingRepository != null && !isBlank(tenantId) && !clientIds.isEmpty()) {
            List<ConsultantClientMapping> fetched =
                    mappingRepository.findMergedAdditionalMappingsByTenantIdAndClientIdIn(
                            tenantId,
                            clientIds,
                            AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_MARKER);
            if (fetched != null) {
                dbMergedCandidates = fetched;
            }
        }

        Map<Long, ConsultantClientMapping> combinedCandidatesById = new LinkedHashMap<>();
        for (ConsultantClientMapping candidate : dbMergedCandidates) {
            if (candidate != null && candidate.getId() != null) {
                combinedCandidatesById.put(candidate.getId(), candidate);
            }
        }
        for (ConsultantClientMapping candidate : targetMappings) {
            if (candidate != null && candidate.getId() != null) {
                combinedCandidatesById.putIfAbsent(candidate.getId(), candidate);
            }
        }

        return resolveFromCandidates(tenantId, targetMappings, combinedCandidatesById.values());
    }

    /**
     * 동일 내담자의 전체 매핑이 이미 메모리에 있을 때 DB 추가 조회 없이 표시명을 산출한다.
     *
     * @param tenantId 테넌트 ID
     * @param allClientMappings 내담자 매핑 목록
     * @return {@code mappingId -> MergedPackageDisplay}
     */
    public static Map<Long, MergedPackageDisplay> resolveFromMappings(
            String tenantId,
            Collection<ConsultantClientMapping> allClientMappings) {
        if (allClientMappings == null || allClientMappings.isEmpty()) {
            return Collections.emptyMap();
        }
        return resolveFromCandidates(tenantId, allClientMappings, allClientMappings);
    }

    private static Map<Long, MergedPackageDisplay> resolveFromCandidates(
            String tenantId,
            Collection<ConsultantClientMapping> targetMappings,
            Collection<ConsultantClientMapping> candidates) {
        if (targetMappings == null || targetMappings.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, ConsultantClientMapping> targetById = new HashMap<>();
        for (ConsultantClientMapping target : targetMappings) {
            if (target != null && target.getId() != null) {
                targetById.put(target.getId(), target);
            }
        }

        Map<Long, List<ConsultantClientMapping>> mergedSourcesByTargetId = new HashMap<>();
        if (!isBlank(tenantId) && candidates != null) {
            Set<Long> seenSourceIds = new LinkedHashSet<>();
            for (ConsultantClientMapping source : candidates) {
                if (source == null || source.getId() == null || !seenSourceIds.add(source.getId())) {
                    continue;
                }
                if (!isMergedCandidateForTenant(tenantId, source)) {
                    continue;
                }
                Long targetId = parseMergedTargetMappingId(source.getNotes());
                if (targetId == null || targetId.equals(source.getId())) {
                    continue;
                }
                ConsultantClientMapping target = targetById.get(targetId);
                if (target == null) {
                    continue;
                }
                if (!tenantId.equals(target.getTenantId())) {
                    continue;
                }
                if (target.getClient() != null && target.getClient().getId() != null
                        && source.getClient() != null && source.getClient().getId() != null
                        && !target.getClient().getId().equals(source.getClient().getId())) {
                    continue;
                }
                mergedSourcesByTargetId.computeIfAbsent(targetId, ignored -> new ArrayList<>()).add(source);
            }
        }

        Map<Long, MergedPackageDisplay> out = new HashMap<>();
        for (ConsultantClientMapping target : targetMappings) {
            if (target == null || target.getId() == null) {
                continue;
            }
            List<ConsultantClientMapping> sources = mergedSourcesByTargetId.get(target.getId());
            if (sources == null || sources.isEmpty()) {
                out.put(target.getId(), MergedPackageDisplay.plain(target.getPackageName()));
                continue;
            }
            sources.sort(MERGE_ORDER_COMPARATOR);
            List<String> mergedNames = new ArrayList<>(sources.size());
            for (ConsultantClientMapping source : sources) {
                if (source.getPackageName() != null && !source.getPackageName().isBlank()) {
                    mergedNames.add(source.getPackageName().trim());
                }
            }
            out.put(target.getId(), MergedPackageDisplay.of(target.getPackageName(), mergedNames));
        }
        return out;
    }

    private static boolean isMergedCandidateForTenant(String tenantId, ConsultantClientMapping source) {
        if (Boolean.TRUE.equals(source.getIsDeleted())) {
            return false;
        }
        if (source.getStatus() != ConsultantClientMapping.MappingStatus.TERMINATED) {
            return false;
        }
        if (!tenantId.equals(source.getTenantId())) {
            return false;
        }
        String notes = source.getNotes();
        return notes != null
                && notes.contains(AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_MARKER);
    }

    public static Long parseMergedTargetMappingId(String notes) {
        if (notes == null || notes.isBlank()) {
            return null;
        }
        Matcher matcher = ConsultationDepositIncomeLedger.MERGED_TARGET_MAPPING_ID.matcher(notes);
        if (!matcher.find()) {
            return null;
        }
        try {
            return Long.parseLong(matcher.group(1));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
