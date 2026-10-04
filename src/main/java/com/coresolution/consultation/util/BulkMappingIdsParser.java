package com.coresolution.consultation.util;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;

/**
 * 일괄 매칭 API 요청 본문의 {@code mappingIds} 값을 안전하게 {@code List<Long>} 으로 바꾼다.
 *
 * <p>JSON 숫자는 Jackson 이 크기에 따라 Integer·Long·BigInteger 로 주므로 캐스팅하지 않고 변환한다.
 * 허용: 정수형 숫자, 숫자만으로 된 문자열. 거부(IllegalArgumentException → 400): 목록 아님·빈 목록·최대 개수 초과,
 * 소수·불리언·null 원소, 0 이하, long 범위 초과. 중복 id 는 처음 순서대로 한 번만 남긴다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
public final class BulkMappingIdsParser {

    private static final Pattern DIGITS = Pattern.compile("\\d{1,18}");

    private BulkMappingIdsParser() {
    }

    /**
     * mappingIds 원본 값을 중복 제거된 id 목록으로 변환한다.
     *
     * @param raw     요청 본문의 mappingIds 값
     * @param maxSize 원본 목록 최대 개수
     * @return 중복 제거된 양수 id 목록 (요청 순서 유지)
     * @throws IllegalArgumentException 형식이 잘못되었거나 비었거나 최대 개수를 넘을 때
     */
    public static List<Long> parse(Object raw, int maxSize) {
        if (!(raw instanceof Collection<?> values) || values.isEmpty()) {
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_BULK_MAPPING_IDS_REQUIRED);
        }
        if (values.size() > maxSize) {
            throw new IllegalArgumentException(
                    String.format(AdminServiceUserFacingMessages.MSG_BULK_MAPPING_IDS_TOO_MANY_FMT, maxSize));
        }
        Set<Long> ids = new LinkedHashSet<>();
        for (Object value : values) {
            ids.add(toPositiveId(value));
        }
        return new ArrayList<>(ids);
    }

    private static long toPositiveId(Object value) {
        long id;
        if (value instanceof Integer || value instanceof Long || value instanceof Short || value instanceof Byte) {
            id = ((Number) value).longValue();
        } else if (value instanceof BigInteger big && big.bitLength() < Long.SIZE) {
            id = big.longValue();
        } else if (value instanceof String text && DIGITS.matcher(text.trim()).matches()) {
            id = Long.parseLong(text.trim());
        } else {
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_BULK_MAPPING_IDS_INVALID);
        }
        if (id <= 0) {
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_BULK_MAPPING_IDS_INVALID);
        }
        return id;
    }
}
