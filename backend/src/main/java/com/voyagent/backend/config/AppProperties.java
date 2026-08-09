package com.voyagent.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

/**
 * Application settings, all fed from environment variables
 * (see application.properties) so nothing sensitive is hardcoded.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(

        /** "production" enables Secure/SameSite=None auth cookies. */
        String environment,

        String jwtSecret,

        Duration jwtExpiration,

        String aiServiceUrl,

        /** Extra CORS origins, on top of the localhost defaults. */
        List<String> allowedOrigins
) {

    public boolean isProduction() {
        return "production".equalsIgnoreCase(environment);
    }
}
