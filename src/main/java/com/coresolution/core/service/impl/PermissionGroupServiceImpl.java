package com.coresolution.core.service.impl;

import com.coresolution.core.dto.PermissionGroupDTO;
import com.coresolution.core.entity.PermissionGroup;
import com.coresolution.core.entity.RolePermissionGroup;
import com.coresolution.core.repository.PermissionGroupRepository;
import com.coresolution.core.repository.RolePermissionGroupRepository;
import com.coresolution.core.service.PermissionGroupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * 권한 그룹 서비스 구현체
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PermissionGroupServiceImpl implements PermissionGroupService {

    private final PermissionGroupRepository permissionGroupRepository;
    private final RolePermissionGroupRepository rolePermissionGroupRepository;

    @Override
    public List<String> getUserPermissionGroupCodes(String tenantId, String tenantRoleId) {
        log.debug("사용자 권한 그룹 코드 조회: tenantId={}, tenantRoleId={}", tenantId, tenantRoleId);
        
        return rolePermissionGroupRepository.findPermissionGroupCodesByTenantIdAndTenantRoleId(tenantId, tenantRoleId);
    }

    @Override
    public boolean hasPermissionGroup(String tenantId, String tenantRoleId, String groupCode) {
        log.debug("권한 그룹 체크: tenantId={}, tenantRoleId={}, groupCode={}", tenantId, tenantRoleId, groupCode);
        
        return rolePermissionGroupRepository.existsByTenantIdAndTenantRoleIdAndPermissionGroupCodeAndIsActiveTrue(
            tenantId, tenantRoleId, groupCode
        );
    }

    @Override
    public String getPermissionGroupLevel(String tenantId, String tenantRoleId, String groupCode) {
        log.debug("권한 그룹 레벨 조회: tenantId={}, tenantRoleId={}, groupCode={}", tenantId, tenantRoleId, groupCode);
        
        return rolePermissionGroupRepository
            .findByTenantIdAndTenantRoleIdAndPermissionGroupCode(tenantId, tenantRoleId, groupCode)
            .map(RolePermissionGroup::getAccessLevel)
            .orElse("NONE");
    }

    @Override
    public List<PermissionGroupDTO> getAllPermissionGroups(String tenantId) {
        log.debug("모든 권한 그룹 조회: tenantId={}", tenantId);
        
        List<PermissionGroup> groups = permissionGroupRepository.findAllActiveGroups(tenantId);
        return buildGroupTree(groups);
    }

    @Override
    @Transactional
    public void grantPermissionGroup(String tenantId, String tenantRoleId, String groupCode, String accessLevel) {
        log.info("권한 그룹 부여: tenantId={}, tenantRoleId={}, groupCode={}, accessLevel={}", 
            tenantId, tenantRoleId, groupCode, accessLevel);

        // 1. 그룹 존재 확인
        PermissionGroup group = permissionGroupRepository.findByGroupCode(groupCode)
            .orElseThrow(() -> new IllegalArgumentException("권한 그룹을 찾을 수 없습니다: " + groupCode));
        
        log.debug("그룹 확인: groupCode={}, groupName={}", group.getGroupCode(), group.getGroupName());

        // 2. 기존 권한 확인
        Optional<RolePermissionGroup> existing = rolePermissionGroupRepository
            .findByTenantIdAndTenantRoleIdAndPermissionGroupCode(tenantId, tenantRoleId, groupCode);

        if (existing.isPresent()) {
            // 수정
            RolePermissionGroup permission = existing.get();
            permission.setAccessLevel(accessLevel);
            permission.setIsActive(true);
            permission.setGrantedBy("SYSTEM"); // TODO: 실제 사용자명으로 변경
            
            rolePermissionGroupRepository.save(permission);
        } else {
            // 신규 생성
            RolePermissionGroup permission = RolePermissionGroup.builder()
                .tenantId(tenantId)
                .tenantRoleId(tenantRoleId)
                .permissionGroupCode(groupCode)
                .accessLevel(accessLevel)
                .isActive(true)
                .grantedBy("SYSTEM") // TODO: 실제 사용자명으로 변경
                .build();

            rolePermissionGroupRepository.save(permission);
        }

        log.info("권한 그룹 부여 완료");
    }

    @Override
    @Transactional
    public void revokePermissionGroup(String tenantId, String tenantRoleId, String groupCode) {
        log.info("권한 그룹 회수: tenantId={}, tenantRoleId={}, groupCode={}", tenantId, tenantRoleId, groupCode);

        RolePermissionGroup permission = rolePermissionGroupRepository
            .findByTenantIdAndTenantRoleIdAndPermissionGroupCode(tenantId, tenantRoleId, groupCode)
            .orElseThrow(() -> new IllegalArgumentException("권한을 찾을 수 없습니다"));

        permission.setIsActive(false);
        rolePermissionGroupRepository.save(permission);

        log.info("권한 그룹 회수 완료");
    }

    @Override
    @Transactional
    public void batchGrantPermissionGroups(String tenantId, String tenantRoleId, List<String> groupCodes, String accessLevel) {
        log.info("권한 그룹 일괄 부여: tenantId={}, tenantRoleId={}, count={}, accessLevel={}", 
            tenantId, tenantRoleId, groupCodes.size(), accessLevel);

        for (String groupCode : groupCodes) {
            try {
                grantPermissionGroup(tenantId, tenantRoleId, groupCode, accessLevel);
            } catch (Exception e) {
                log.error("권한 그룹 부여 실패: groupCode={}", groupCode, e);
            }
        }

        log.info("권한 그룹 일괄 부여 완료");
    }

    /**
     * 권한 그룹 트리 구조 생성
     */
    private List<PermissionGroupDTO> buildGroupTree(List<PermissionGroup> groups) {
        if (groups == null || groups.isEmpty()) {
            return new ArrayList<>();
        }

        // 1. 모든 그룹을 DTO로 변환하고 Map에 저장
        Map<String, PermissionGroupDTO> groupMap = new HashMap<>();
        for (PermissionGroup group : groups) {
            PermissionGroupDTO dto = toDTO(group);
            groupMap.put(group.getGroupCode(), dto);
        }

        // 2. 부모-자식 관계 설정
        List<PermissionGroupDTO> rootGroups = new ArrayList<>();
        for (PermissionGroup group : groups) {
            PermissionGroupDTO dto = groupMap.get(group.getGroupCode());

            if (group.getParentGroupCode() == null || group.getParentGroupCode().isEmpty()) {
                // 최상위 그룹
                rootGroups.add(dto);
            } else {
                // 하위 그룹
                PermissionGroupDTO parent = groupMap.get(group.getParentGroupCode());
                if (parent != null) {
                    parent.addChild(dto);
                } else {
                    // 부모가 없으면 최상위로 추가
                    log.warn("부모 그룹을 찾을 수 없습니다: groupCode={}, parentCode={}", 
                        group.getGroupCode(), group.getParentGroupCode());
                    rootGroups.add(dto);
                }
            }
        }

        // 3. 정렬 순서대로 정렬
        sortGroupTree(rootGroups);

        return rootGroups;
    }

    /**
     * 권한 그룹 트리 정렬 (재귀)
     */
    private void sortGroupTree(List<PermissionGroupDTO> groups) {
        if (groups == null || groups.isEmpty()) {
            return;
        }

        // 현재 레벨 정렬
        groups.sort(Comparator.comparing(PermissionGroupDTO::getSortOrder, Comparator.nullsLast(Integer::compareTo)));

        // 하위 그룹 정렬 (재귀)
        for (PermissionGroupDTO group : groups) {
            if (group.hasChildren()) {
                sortGroupTree(group.getChildren());
            }
        }
    }

    /**
     * Entity → DTO 변환
     */
    private PermissionGroupDTO toDTO(PermissionGroup group) {
        return PermissionGroupDTO.builder()
            .id(group.getId())
            .tenantId(group.getTenantId())
            .groupCode(group.getGroupCode())
            .groupName(group.getGroupName())
            .groupNameEn(group.getGroupNameEn())
            .description(group.getDescription())
            .groupType(group.getGroupType())
            .parentGroupCode(group.getParentGroupCode())
            .sortOrder(group.getSortOrder())
            .icon(group.getIcon())
            .colorCode(group.getColorCode())
            .isActive(group.getIsActive())
            .children(new ArrayList<>())
            .build();
    }
}

