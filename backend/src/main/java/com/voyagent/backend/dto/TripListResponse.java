package com.voyagent.backend.dto;

import com.voyagent.backend.model.Trip;

import java.util.List;

public record TripListResponse(boolean success, int count, List<Trip> trips) {
}
