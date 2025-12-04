package com.coresolution.core.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import lombok.extern.slf4j.Slf4j;

/**
 * 페이징 유틸리티 클래스
 * 
 * 표준화 원칙: 목록 조회 시 최대 20개로 제한
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-04
 */
@Slf4j
public class PaginationUtils {
    
    /**
     * 최대 페이지 크기 (표준화 원칙)
     */
    public static final int MAX_PAGE_SIZE = 20;
    
    /**
     * 기본 페이지 크기
     */
    public static final int DEFAULT_PAGE_SIZE = 20;
    
    /**
     * 페이징 파라미터를 검증하고 최대값으로 제한
     * 
     * @param page 페이지 번호 (0부터 시작)
     * @param size 페이지 크기
     * @return 검증된 Pageable 객체
     */
    public static Pageable createPageable(int page, int size) {
        // 페이지 번호 검증 (음수 방지)
        int validPage = Math.max(0, page);
        
        // 페이지 크기 검증 및 제한 (최대 20개)
        int validSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        
        if (size > MAX_PAGE_SIZE) {
            log.warn("⚠️ 페이지 크기가 최대값({})을 초과했습니다. 요청값: {}, 제한값: {}로 조정됨", 
                MAX_PAGE_SIZE, size, validSize);
        }
        
        return PageRequest.of(validPage, validSize);
    }
    
    /**
     * 기본 페이지 크기로 Pageable 생성
     * 
     * @param page 페이지 번호 (0부터 시작)
     * @return 검증된 Pageable 객체
     */
    public static Pageable createPageable(int page) {
        return createPageable(page, DEFAULT_PAGE_SIZE);
    }
    
    /**
     * Pageable 객체의 페이지 크기를 검증하고 최대값으로 제한
     * 
     * @param pageable 원본 Pageable 객체
     * @return 검증된 Pageable 객체
     */
    public static Pageable validatePageable(Pageable pageable) {
        if (pageable == null) {
            return PageRequest.of(0, DEFAULT_PAGE_SIZE);
        }
        
        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();
        
        return createPageable(page, size);
    }
    
    /**
     * 페이지 크기가 최대값을 초과하는지 확인
     * 
     * @param size 페이지 크기
     * @return 초과 여부
     */
    public static boolean exceedsMaxPageSize(int size) {
        return size > MAX_PAGE_SIZE;
    }
}

