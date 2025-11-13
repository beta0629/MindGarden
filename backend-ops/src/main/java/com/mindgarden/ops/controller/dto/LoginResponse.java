package com.mindgarden.ops.controller.dto;

import java.time.Instant;

public record LoginResponse(
    String token,
    String actorId,
    String actorRole,
    Instant expiresAt
) {
}

