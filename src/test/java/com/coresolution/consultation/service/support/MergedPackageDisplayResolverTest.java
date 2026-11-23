package com.coresolution.consultation.service.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.ScheduleMappingContextResolver;
import com.coresolution.consultation.service.ScheduleMappingContextResolver.ScheduleMappingResponseContext;
import com.coresolution.consultation.service.support.MergedPackageDisplayResolver.MergedPackageDisplay;
import com.coresolution.consultation.entity.Schedule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("MergedPackageDisplayResolver — 병합 패키지 파생 표시명·금액/원명 불변·테넌트 격리")
class MergedPackageDisplayResolverTest {

    private static final String TENANT_A = "tenant-a";
    private static final String TENANT_B = "tenant-b";

    @Test
    @DisplayName("기존/신규 병합 이력이 있으면 displayPackageName 은 '원상품 + 병합상품', 원 packageName·packagePrice 불변")
    void resolveBatch_combinesMergedPackageNamesInOrder() {
        User client = new User();
        client.setId(21L);
        client.setTenantId(TENANT_A);
        ConsultantClientMapping target = ConsultantClientMapping.builder()
                .client(client)
                .packageName("단회기 90,000원")
                .packagePrice(90_000L)
                .status(MappingStatus.ACTIVE)
                .totalSessions(11)
                .remainingSessions(10)
                .build();
        target.setId(404L);
        target.setTenantId(TENANT_A);

        ConsultantClientMapping mergedFirst = ConsultantClientMapping.builder()
                .client(client)
                .packageName("기본10회기")
                .packagePrice(800_000L)
                .status(MappingStatus.TERMINATED)
                .terminatedAt(LocalDateTime.of(2026, 11, 10, 10, 0))
                .notes(String.format(
                        AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_FMT, 404L, 10))
                .build();
        mergedFirst.setId(418L);
        mergedFirst.setTenantId(TENANT_A);

        ConsultantClientMapping mergedSecond = ConsultantClientMapping.builder()
                .client(client)
                .packageName("추가5회기")
                .packagePrice(420_000L)
                .status(MappingStatus.TERMINATED)
                .terminatedAt(LocalDateTime.of(2026, 11, 15, 11, 0))
                .notes(String.format(
                        AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_FMT, 404L, 5))
                .build();
        mergedSecond.setId(425L);
        mergedSecond.setTenantId(TENANT_A);

        ConsultantClientMappingRepository repo = mock(ConsultantClientMappingRepository.class);
        when(repo.findMergedAdditionalMappingsByTenantIdAndClientIdIn(
                eq(TENANT_A),
                anyCollection(),
                eq(AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_MARKER)))
                .thenReturn(List.of(mergedSecond, mergedFirst)); // 역순 반환되어도 terminatedAt 오름차순 정렬

        Map<Long, MergedPackageDisplay> result = MergedPackageDisplayResolver.resolveBatch(
                TENANT_A, List.of(target, mergedFirst), repo);

        MergedPackageDisplay targetDisplay = result.get(404L);
        assertThat(targetDisplay).isNotNull();
        assertThat(targetDisplay.rawPackageName()).isEqualTo("단회기 90,000원");
        assertThat(targetDisplay.displayPackageName()).isEqualTo("단회기 90,000원 + 기본10회기 + 추가5회기");
        assertThat(targetDisplay.mergedPackageNames()).containsExactly("기본10회기", "추가5회기");

        // 원 엔티티의 packageName·packagePrice 는 불변
        assertThat(target.getPackageName()).isEqualTo("단회기 90,000원");
        assertThat(target.getPackagePrice()).isEqualTo(90_000L);

        // 병합 자식 행 자체는 자기 packageName 유지
        MergedPackageDisplay childDisplay = result.get(418L);
        assertThat(childDisplay.displayPackageName()).isEqualTo("기본10회기");
        assertThat(childDisplay.mergedPackageNames()).isEmpty();
    }

    @Test
    @DisplayName("테넌트 격리: 타 테넌트 병합 매핑 및 삭제/미종료 매핑은 합산 표시에 포함하지 않음")
    void resolveBatch_enforcesTenantIsolationAndStatus() {
        User client = new User();
        client.setId(21L);
        client.setTenantId(TENANT_A);
        ConsultantClientMapping target = ConsultantClientMapping.builder()
                .client(client)
                .packageName("단회기 90,000원")
                .packagePrice(90_000L)
                .status(MappingStatus.ACTIVE)
                .build();
        target.setId(404L);
        target.setTenantId(TENANT_A);

        ConsultantClientMapping otherTenantMerged = ConsultantClientMapping.builder()
                .client(client)
                .packageName("타테넌트패키지")
                .status(MappingStatus.TERMINATED)
                .notes(String.format(
                        AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_FMT, 404L, 10))
                .build();
        otherTenantMerged.setId(501L);
        otherTenantMerged.setTenantId(TENANT_B);

        ConsultantClientMapping deletedMerged = ConsultantClientMapping.builder()
                .client(client)
                .packageName("삭제된패키지")
                .status(MappingStatus.TERMINATED)
                .notes(String.format(
                        AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_FMT, 404L, 10))
                .build();
        deletedMerged.setId(502L);
        deletedMerged.setTenantId(TENANT_A);
        deletedMerged.setIsDeleted(true);

        ConsultantClientMapping pendingMerged = ConsultantClientMapping.builder()
                .client(client)
                .packageName("미병합입금대기")
                .status(MappingStatus.DEPOSIT_PENDING)
                .notes(String.format(
                        AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_LINE_FMT, 404L, 10))
                .build();
        pendingMerged.setId(503L);
        pendingMerged.setTenantId(TENANT_A);

        ConsultantClientMappingRepository repo = mock(ConsultantClientMappingRepository.class);
        when(repo.findMergedAdditionalMappingsByTenantIdAndClientIdIn(
                eq(TENANT_A),
                anyCollection(),
                eq(AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_MARKER)))
                .thenReturn(List.of(otherTenantMerged, deletedMerged, pendingMerged));

        Map<Long, MergedPackageDisplay> result = MergedPackageDisplayResolver.resolveBatch(
                TENANT_A, List.of(target), repo);

        MergedPackageDisplay targetDisplay = result.get(404L);
        assertThat(targetDisplay.displayPackageName()).isEqualTo("단회기 90,000원");
        assertThat(targetDisplay.mergedPackageNames()).isEmpty();
    }

    @Test
    @DisplayName("스케줄 컨텍스트(일정 상세)에서도 displayPackageName 과 mergedPackageNames 가 노출된다")
    void scheduleContext_includesMergedDisplayPackageName() {
        User client = new User();
        client.setId(21L);
        client.setTenantId(TENANT_A);
        ConsultantClientMapping target = ConsultantClientMapping.builder()
                .client(client)
                .packageName("단회기 90,000원")
                .packagePrice(90_000L)
                .totalSessions(11)
                .remainingSessions(10)
                .status(MappingStatus.ACTIVE)
                .build();
        target.setId(404L);
        target.setTenantId(TENANT_A);

        ConsultantClientMapping merged = ConsultantClientMapping.builder()
                .client(client)
                .packageName("기본10회기")
                .status(MappingStatus.TERMINATED)
                .notes(String.format(
                        AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_FMT, 404L, 10))
                .build();
        merged.setId(418L);
        merged.setTenantId(TENANT_A);

        Schedule schedule = new Schedule();
        schedule.setId(900L);
        schedule.setTenantId(TENANT_A);
        schedule.setClientId(21L);
        schedule.setConsultantId(11L);
        schedule.setMappingId(404L);

        ConsultantClientMappingRepository repo = mock(ConsultantClientMappingRepository.class);
        when(repo.findByTenantIdAndId(TENANT_A, 404L)).thenReturn(java.util.Optional.of(target));
        when(repo.findMergedAdditionalMappingsByTenantIdAndClientIdIn(
                eq(TENANT_A),
                anyCollection(),
                eq(AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_MARKER)))
                .thenReturn(List.of(merged));

        ScheduleMappingResponseContext ctx = ScheduleMappingContextResolver.resolveForScheduleResponse(
                schedule, TENANT_A, repo, Map.of(), null);

        assertThat(ctx.getPackageName()).isEqualTo("단회기 90,000원");
        assertThat(ctx.getDisplayPackageName()).isEqualTo("단회기 90,000원 + 기본10회기");
        assertThat(ctx.getMergedPackageNames()).containsExactly("기본10회기");
    }
}
