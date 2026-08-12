package com.voyagent.backend.dto;

import com.voyagent.backend.model.Trip;

public record TripResponse(boolean success, Trip trip) {
}
