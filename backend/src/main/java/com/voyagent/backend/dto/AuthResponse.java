package com.voyagent.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Also serves /api/auth/me, where the Express response carried no message. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(boolean success, String message, UserDto user) {
}
