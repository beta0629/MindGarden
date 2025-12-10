package com.mindgarden.ops.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.util.TimeZone;

/**
 * 시간대 설정
 * 한국 표준시(KST, UTC+9)를 기본 시간대로 설정
 */
@Configuration
public class TimeZoneConfig {

    @PostConstruct
    public void init() {
        // 애플리케이션 전체의 기본 시간대를 한국 표준시로 설정
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
        System.setProperty("user.timezone", "Asia/Seoul");
    }
}

