package com.coresolution.core.krpublic;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

/**
 * 개발 스텁용 과세유형·주소 샘플. 본문은 {@code content/kr-public-data-stub.properties}.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
final class KrPublicDataStubSamples {

    private static final String RESOURCE = "content/kr-public-data-stub.properties";
    private static final String TAX_TYPE = "tax.type";
    private static final String SAMPLE_PREFIX = "sample.";
    private static final String ROAD_SUFFIX = ".road-address";
    private static final String ZIP_SUFFIX = ".zip-code";
    private static final Properties PROPS = load();

    private KrPublicDataStubSamples() {
    }

    /**
     * @return 스텁 과세유형. 없으면 빈 문자열
     */
    static String taxType() {
        String value = PROPS.getProperty(TAX_TYPE);
        if (value == null) {
            return "";
        }
        return value.trim();
    }

    /**
     * @return 고정 샘플 주소. 도로명이 빈 항목에서 멈춘다
     */
    static List<AddressSearchResult.AddressItem> addresses() {
        List<AddressSearchResult.AddressItem> items = new ArrayList<>();
        int index = 1;
        while (true) {
            String road = PROPS.getProperty(SAMPLE_PREFIX + index + ROAD_SUFFIX);
            if (road == null || road.isBlank()) {
                break;
            }
            String zip = PROPS.getProperty(SAMPLE_PREFIX + index + ZIP_SUFFIX, "");
            items.add(AddressSearchResult.AddressItem.builder()
                    .roadAddress(road.trim())
                    .zipCode(zip == null ? "" : zip.trim())
                    .build());
            index++;
        }
        return List.copyOf(items);
    }

    private static Properties load() {
        Properties properties = new Properties();
        try (InputStream in = KrPublicDataStubSamples.class.getClassLoader().getResourceAsStream(RESOURCE)) {
            if (in == null) {
                throw new IllegalStateException("kr public data stub resource missing");
            }
            try (Reader reader = new InputStreamReader(in, StandardCharsets.UTF_8)) {
                properties.load(reader);
            }
        } catch (IOException ex) {
            throw new IllegalStateException("kr public data stub resource unreadable");
        }
        return properties;
    }
}
