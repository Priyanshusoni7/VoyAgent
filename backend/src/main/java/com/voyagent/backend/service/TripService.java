package com.voyagent.backend.service;

import com.voyagent.backend.dto.AiPlanResponse;
import com.voyagent.backend.dto.PlanTripResponse;
import com.voyagent.backend.exception.ApiException;
import com.voyagent.backend.model.Clarification;
import com.voyagent.backend.model.Trip;
import com.voyagent.backend.model.TripStatus;
import com.voyagent.backend.model.User;
import com.voyagent.backend.repository.TripRepository;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TripService {

    private static final Logger log = LoggerFactory.getLogger(TripService.class);

    private static final String TRIP_NOT_FOUND = "Trip not found";

    private final TripRepository tripRepository;
    private final AiPlannerClient aiPlannerClient;

    public TripService(TripRepository tripRepository, AiPlannerClient aiPlannerClient) {
        this.tripRepository = tripRepository;
        this.aiPlannerClient = aiPlannerClient;
    }

    public PlanTripResponse planTrip(User user, String prompt, String providedThreadId) {
        if (prompt == null || prompt.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Prompt is required");
        }

        ObjectId userId = new ObjectId(user.getId());
        String threadId = (providedThreadId == null || providedThreadId.isBlank())
                ? "%s_trip_%d".formatted(user.getId(), System.currentTimeMillis())
                : providedThreadId;

        // Persist the turn first so the whole multi-turn context survives, exactly
        // as the previous backend did.
        Trip trip = tripRepository.findByUserIdAndThreadId(userId, threadId)
                .orElseGet(() -> newTrip(userId, threadId));

        if (trip.getPromptHistory() == null) {
            trip.setPromptHistory(new ArrayList<>());
        }
        trip.getPromptHistory().add(prompt);

        String fullPromptContext = String.join("\nUser: ", trip.getPromptHistory());
        log.info("Forwarding full prompt history ({} turns) to AI Service [threadId: {}]",
                trip.getPromptHistory().size(), threadId);

        AiPlanResponse aiResponse = aiPlannerClient.planTrip(fullPromptContext, threadId);
        String status = aiResponse == null ? null : aiResponse.status();

        if ("clarification_needed".equals(status)) {
            Clarification clarification = aiResponse.clarification();

            trip.setStatus(TripStatus.CLARIFICATION_NEEDED);
            trip.setClarification(new Clarification(
                    clarification == null ? List.of() : clarification.getMissingFields(),
                    clarification == null || clarification.getQuestion() == null
                            ? "Please provide more details."
                            : clarification.getQuestion()));
            trip.setFinalPlan(null);
            tripRepository.save(trip);

            return PlanTripResponse.clarificationNeeded(threadId, trip.getClarification());
        }

        if ("completed".equals(status)) {
            trip.setStatus(TripStatus.COMPLETED);
            trip.setClarification(new Clarification(List.of(), null));
            trip.setFinalPlan(aiResponse.finalPlan());
            tripRepository.save(trip);

            return PlanTripResponse.completed(threadId, trip);
        }

        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unknown status returned from AI Service");
    }

    public List<Trip> getUserTrips(User user) {
        return tripRepository.findByUserIdOrderByCreatedAtDesc(new ObjectId(user.getId()));
    }

    public Trip getTripById(User user, String tripId) {
        return requireOwnedTrip(user, tripId, "Not authorized to access this trip");
    }

    public void deleteTrip(User user, String tripId) {
        Trip trip = requireOwnedTrip(user, tripId, "Not authorized to delete this trip");
        tripRepository.delete(trip);
    }

    private Trip requireOwnedTrip(User user, String tripId, String forbiddenMessage) {
        if (!ObjectId.isValid(tripId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, TRIP_NOT_FOUND);
        }

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, TRIP_NOT_FOUND));

        if (trip.getUserId() == null || !trip.getUserId().toHexString().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, forbiddenMessage);
        }

        return trip;
    }

    private Trip newTrip(ObjectId userId, String threadId) {
        Trip trip = new Trip();
        trip.setUserId(userId);
        trip.setThreadId(threadId);
        trip.setPromptHistory(new ArrayList<>());
        return trip;
    }
}
