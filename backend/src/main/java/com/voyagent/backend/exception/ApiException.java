package com.voyagent.backend.exception;

import org.springframework.http.HttpStatus;

/** Failure that maps straight onto the {success:false, message} JSON the frontend expects. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
