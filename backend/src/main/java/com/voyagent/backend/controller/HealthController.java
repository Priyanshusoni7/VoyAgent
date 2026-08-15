package com.voyagent.backend.controller;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    private final MongoTemplate mongoTemplate;

    public HealthController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping("/")
    public Map<String, Object> home() {
        return Map.of(
                "success", true,
                "message", "VoyAgent Backend is running 🚀");
    }

    /**
     * Health probe, safe to poll from an external uptime service.
     *
     * <p>Runs MongoDB's {@code ping} command - the cheapest call the driver
     * offers - so the check proves the database connection is actually alive
     * rather than only that the JVM is up. It performs no AI, Gemini or SerpAPI
     * work, so it costs nothing against those free tiers.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        try {
            mongoTemplate.getDb().runCommand(new Document("ping", 1));

            return ResponseEntity.ok(Map.of(
                    "status", "ok",
                    "database", "up"));

        } catch (Exception e) {
            log.error("Health check failed: MongoDB unreachable", e);

            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "status", "degraded",
                    "database", "down"));
        }
    }
}
