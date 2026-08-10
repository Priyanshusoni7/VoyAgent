package com.voyagent.backend.model;

import com.fasterxml.jackson.annotation.JsonValue;

/** Mirrors the status enum the previous Express/Mongoose model persisted. */
public enum TripStatus {

    CLARIFICATION_NEEDED("clarification_needed"),
    COMPLETED("completed"),
    ERROR("error");

    private final String value;

    TripStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}
