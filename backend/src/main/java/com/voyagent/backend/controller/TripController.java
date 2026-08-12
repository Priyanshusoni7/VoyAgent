package com.voyagent.backend.controller;

import com.voyagent.backend.dto.MessageResponse;
import com.voyagent.backend.dto.PlanTripRequest;
import com.voyagent.backend.dto.PlanTripResponse;
import com.voyagent.backend.dto.TripListResponse;
import com.voyagent.backend.dto.TripResponse;
import com.voyagent.backend.model.Trip;
import com.voyagent.backend.model.User;
import com.voyagent.backend.security.AuthInterceptor;
import com.voyagent.backend.service.TripService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @PostMapping("/plan")
    public PlanTripResponse planTrip(@RequestAttribute(AuthInterceptor.CURRENT_USER) User user,
                                     @RequestBody PlanTripRequest request) {
        return tripService.planTrip(user, request.prompt(), request.threadId());
    }

    @GetMapping
    public TripListResponse getUserTrips(@RequestAttribute(AuthInterceptor.CURRENT_USER) User user) {
        List<Trip> trips = tripService.getUserTrips(user);
        return new TripListResponse(true, trips.size(), trips);
    }

    @GetMapping("/{id}")
    public TripResponse getTripById(@RequestAttribute(AuthInterceptor.CURRENT_USER) User user,
                                    @PathVariable String id) {
        return new TripResponse(true, tripService.getTripById(user, id));
    }

    @DeleteMapping("/{id}")
    public MessageResponse deleteTrip(@RequestAttribute(AuthInterceptor.CURRENT_USER) User user,
                                      @PathVariable String id) {
        tripService.deleteTrip(user, id);
        return new MessageResponse(true, "Trip deleted successfully");
    }
}
