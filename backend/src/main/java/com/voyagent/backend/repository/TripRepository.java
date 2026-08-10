package com.voyagent.backend.repository;

import com.voyagent.backend.model.Trip;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface TripRepository extends MongoRepository<Trip, String> {

    Optional<Trip> findByUserIdAndThreadId(ObjectId userId, String threadId);

    List<Trip> findByUserIdOrderByCreatedAtDesc(ObjectId userId);
}
