package com.voyagent.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.voyagent.backend.dto.AiPlanRequest;
import com.voyagent.backend.dto.AiPlanResponse;
import com.voyagent.backend.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Service
public class AiPlannerClient {

    private static final Logger log = LoggerFactory.getLogger(AiPlannerClient.class);

    private static final String FAILURE_MESSAGE =
            "Failed to process travel planning request with AI Service.";

    private final RestClient client;
    private final ObjectMapper objectMapper;

    public AiPlannerClient(RestClient aiServiceClient, ObjectMapper objectMapper) {
        this.client = aiServiceClient;
        this.objectMapper = objectMapper;
    }

    public AiPlanResponse planTrip(String prompt, String threadId) {
        try {
            return client.post()
                    .uri("/planner/plan-trip")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new AiPlanRequest(prompt, threadId))
                    .retrieve()
                    .body(AiPlanResponse.class);

        } catch (RestClientResponseException e) {
            log.error("AI Service responded with {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, detailOrDefault(e));

        } catch (RestClientException e) {
            log.error("Could not reach AI Service", e);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, FAILURE_MESSAGE);
        }
    }

    /** FastAPI reports errors as {"detail": "..."}; the frontend already surfaces that text. */
    private String detailOrDefault(RestClientResponseException e) {
        try {
            JsonNode detail = objectMapper.readTree(e.getResponseBodyAsString()).path("detail");
            if (detail.isTextual() && !detail.asText().isBlank()) {
                return detail.asText();
            }
        } catch (Exception ignored) {
            // Body was not JSON — fall through to the generic message.
        }
        return FAILURE_MESSAGE;
    }
}
