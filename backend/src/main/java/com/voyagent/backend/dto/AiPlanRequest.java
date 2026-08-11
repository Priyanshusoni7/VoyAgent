package com.voyagent.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/** Request body of the FastAPI AI service: POST /planner/plan-trip. */
public record AiPlanRequest(

        String prompt,

        @JsonProperty("thread_id")
        String threadId
) {
}
