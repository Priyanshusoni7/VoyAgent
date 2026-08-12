package com.voyagent.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.voyagent.backend.model.Clarification;
import com.voyagent.backend.model.Trip;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PlanTripResponse(

        boolean success,

        String status,

        String threadId,

        Clarification clarification,

        Trip trip
) {

    public static PlanTripResponse clarificationNeeded(String threadId, Clarification clarification) {
        return new PlanTripResponse(true, "clarification_needed", threadId, clarification, null);
    }

    public static PlanTripResponse completed(String threadId, Trip trip) {
        return new PlanTripResponse(true, "completed", threadId, null, trip);
    }
}
