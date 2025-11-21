package com.coresolution.core.service.ops;

import com.coresolution.core.domain.ops.FeatureFlag;
import com.coresolution.core.domain.ops.FeatureFlagState;
import com.coresolution.core.repository.ops.FeatureFlagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Feature Flag 관리 서비스 (Ops 포털용)
 * Feature Flag CRUD 및 상태 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FeatureFlagService {
    
    private final FeatureFlagRepository featureFlagRepository;
    
    /**
     * 모든 Feature Flag 목록 조회
     */
    public List<FeatureFlag> findAll() {
        log.debug("모든 Feature Flag 목록 조회");
        return featureFlagRepository.findAll();
    }
    
    /**
     * 활성화된 Feature Flag 목록 조회
     */
    public List<FeatureFlag> findAllEnabled() {
        log.debug("활성화된 Feature Flag 목록 조회");
        return featureFlagRepository.findAllEnabled();
    }
    
    /**
     * flag_key로 Feature Flag 조회
     */
    public Optional<FeatureFlag> findByFlagKey(String flagKey) {
        log.debug("Feature Flag 조회: flagKey={}", flagKey);
        return featureFlagRepository.findByFlagKey(flagKey);
    }
    
    /**
     * 상태별 Feature Flag 개수 조회
     */
    @Transactional(readOnly = true)
    public long countByState(FeatureFlagState state) {
        log.debug("상태별 Feature Flag 개수 조회: state={}", state);
        return featureFlagRepository.countByState(state);
    }
    
    /**
     * Feature Flag 생성
     * 
     * @param flagKey Feature Flag 키 (고유 식별자)
     * @param description 설명
     * @param targetScope 대상 범위 (선택적)
     * @param expiresAt 만료 시간 (선택적)
     * @return 생성된 Feature Flag
     */
    @Transactional
    public FeatureFlag create(String flagKey, String description, String targetScope, Instant expiresAt) {
        log.info("Feature Flag 생성: flagKey={}, description={}, targetScope={}, expiresAt={}", 
            flagKey, description, targetScope, expiresAt);
        
        // 중복 확인
        if (featureFlagRepository.findByFlagKey(flagKey).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 Feature Flag 키입니다: " + flagKey);
        }
        
        // Feature Flag 생성
        FeatureFlag featureFlag = FeatureFlag.builder()
            .flagKey(flagKey)
            .description(description)
            .targetScope(targetScope)
            .expiresAt(expiresAt)
            .state(FeatureFlagState.DISABLED) // 기본값: 비활성화
            .isDeleted(false)
            .version(0L)
            .build();
        
        FeatureFlag saved = featureFlagRepository.save(featureFlag);
        
        log.info("Feature Flag 생성 완료: id={}, flagKey={}", saved.getId(), flagKey);
        
        return saved;
    }
    
    /**
     * Feature Flag 상태 변경 (토글)
     * 
     * @param flagId Feature Flag ID
     * @param newState 새로운 상태
     * @return 업데이트된 Feature Flag
     */
    @Transactional
    public FeatureFlag toggle(Long flagId, FeatureFlagState newState) {
        log.info("Feature Flag 상태 변경: flagId={}, newState={}", flagId, newState);
        
        FeatureFlag featureFlag = featureFlagRepository.findById(flagId)
            .orElseThrow(() -> new IllegalArgumentException("Feature Flag를 찾을 수 없습니다: " + flagId));
        
        // 상태 변경
        FeatureFlagState oldState = featureFlag.getState();
        featureFlag.setState(newState);
        
        FeatureFlag saved = featureFlagRepository.save(featureFlag);
        
        log.info("Feature Flag 상태 변경 완료: flagId={}, oldState={}, newState={}", 
            flagId, oldState, newState);
        
        return saved;
    }
    
    // Note: AuditService 통합은 추후 구현 예정 (backend-ops 모듈 통합 시)
}

