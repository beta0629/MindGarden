package com.mindgarden.ops.service.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

@Service
public class JwtTokenService {

    private final JwtEncoder jwtEncoder;
    private final String issuer;
    private final long expirySeconds;

    public JwtTokenService(
        JwtEncoder jwtEncoder,
        @Value("${security.jwt.issuer:mindgarden-ops}") String issuer,
        @Value("${security.jwt.expires-in-seconds:3600}") long expirySeconds
    ) {
        this.jwtEncoder = jwtEncoder;
        this.issuer = issuer;
        this.expirySeconds = expirySeconds;
    }

    public String generateToken(String subject, Map<String, Object> claims) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(expirySeconds, ChronoUnit.SECONDS);

        JwtClaimsSet.Builder builder = JwtClaimsSet.builder()
            .subject(subject)
            .issuer(issuer)
            .issuedAt(now)
            .expiresAt(expiresAt);

        claims.forEach(builder::claim);

        JwtEncoderParameters parameters = JwtEncoderParameters.from(
            JwsHeader.with(MacAlgorithm.HS256).build(),
            builder.build()
        );

        return jwtEncoder.encode(parameters).getTokenValue();
    }
}

