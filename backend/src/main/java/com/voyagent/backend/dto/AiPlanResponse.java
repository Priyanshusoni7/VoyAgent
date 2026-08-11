package com.voyagent.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.voyagent.backend.model.Clarification;

import java.util.Map;

/** Response body of the FastAPI AI service: POST /planner/plan-trip. */
public record AiPlanResponse(

        String status,

        @JsonProperty("thread_id")
        String threadId,

        Clarification clarification,

        @JsonProperty("final_plan")
        Map<String, Object> finalPlan
) {
}
