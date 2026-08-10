package com.voyagent.backend.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Document(collection = "trips")
public class Trip {

    @Id
    @JsonProperty("_id")
    private String id;

    /**
     * Stored as an ObjectId so documents stay compatible with the ones the
     * previous backend wrote (and with the existing index).
     */
    @Indexed
    private ObjectId userId;

    @Indexed
    private String threadId;

    private List<String> promptHistory = new ArrayList<>();

    private TripStatus status = TripStatus.CLARIFICATION_NEEDED;

    private Clarification clarification = new Clarification();

    /** Free-form plan document produced by the AI service. */
    private Map<String, Object> finalPlan;

    @CreatedDate
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", timezone = "UTC")
    private Instant createdAt;

    @LastModifiedDate
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", timezone = "UTC")
    private Instant updatedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public ObjectId getUserId() {
        return userId;
    }

    public void setUserId(ObjectId userId) {
        this.userId = userId;
    }

    public String getThreadId() {
        return threadId;
    }

    public void setThreadId(String threadId) {
        this.threadId = threadId;
    }

    public List<String> getPromptHistory() {
        return promptHistory;
    }

    public void setPromptHistory(List<String> promptHistory) {
        this.promptHistory = promptHistory;
    }

    public TripStatus getStatus() {
        return status;
    }

    public void setStatus(TripStatus status) {
        this.status = status;
    }

    public Clarification getClarification() {
        return clarification;
    }

    public void setClarification(Clarification clarification) {
        this.clarification = clarification;
    }

    public Map<String, Object> getFinalPlan() {
        return finalPlan;
    }

    public void setFinalPlan(Map<String, Object> finalPlan) {
        this.finalPlan = finalPlan;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
