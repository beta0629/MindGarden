package com.coresolution.consultation.dto.admin.client;

/**
 * 관리자 내담자 검색 결과 한 건. 전체 연락처는 담지 않는다.
 *
 * @param id users.id
 * @param name 이름
 * @param phoneLast4 연락처 뒷자리 4자리 (없으면 null)
 * @param maskedPhone 마스킹된 연락처 (없으면 null)
 * @author CoreSolution
 * @since 2026-10-12
 */
public record AdminClientSearchItem(Long id, String name, String phoneLast4, String maskedPhone) {
}
