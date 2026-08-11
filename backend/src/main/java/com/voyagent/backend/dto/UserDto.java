package com.voyagent.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.voyagent.backend.model.User;

public record UserDto(

        @JsonProperty("_id")
        String id,

        String name,

        String email
) {

    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getName(), user.getEmail());
    }
}
