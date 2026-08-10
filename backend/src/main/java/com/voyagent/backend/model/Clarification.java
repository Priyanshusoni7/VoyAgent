package com.voyagent.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.ArrayList;
import java.util.List;

/** Embedded document; field names match the JSON the frontend already reads. */
public class Clarification {

    @Field("missing_fields")
    @JsonProperty("missing_fields")
    private List<String> missingFields = new ArrayList<>();

    private String question;

    public Clarification() {
    }

    public Clarification(List<String> missingFields, String question) {
        this.missingFields = missingFields == null ? new ArrayList<>() : missingFields;
        this.question = question;
    }

    public List<String> getMissingFields() {
        return missingFields;
    }

    public void setMissingFields(List<String> missingFields) {
        this.missingFields = missingFields;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }
}
