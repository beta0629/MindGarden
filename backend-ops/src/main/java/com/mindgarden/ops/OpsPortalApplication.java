package com.mindgarden.ops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.mindgarden.ops.repository")
@EntityScan(basePackages = "com.mindgarden.ops.domain")
public class OpsPortalApplication {

    public static void main(String[] args) {
        SpringApplication.run(OpsPortalApplication.class, args);
    }
}
