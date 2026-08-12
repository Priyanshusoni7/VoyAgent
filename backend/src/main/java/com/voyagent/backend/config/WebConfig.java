package com.voyagent.backend.config;

import com.voyagent.backend.security.AuthInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final List<String> DEFAULT_ORIGINS =
            List.of("http://localhost:3000", "http://127.0.0.1:3000");

    private final AppProperties properties;
    private final AuthInterceptor authInterceptor;

    public WebConfig(AppProperties properties, AuthInterceptor authInterceptor) {
        this.properties = properties;
        this.authInterceptor = authInterceptor;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        Set<String> origins = new LinkedHashSet<>(DEFAULT_ORIGINS);
        if (properties.allowedOrigins() != null) {
            properties.allowedOrigins().stream()
                    .filter(origin -> origin != null && !origin.isBlank())
                    .map(String::trim)
                    .forEach(origins::add);
        }

        registry.addMapping("/**")
                .allowedOrigins(origins.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    /** Routes the previous Express app guarded with its `protect` middleware. */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/auth/me", "/api/trips/**", "/api/trips");
    }

    @Bean
    public RestClient aiServiceClient(RestClient.Builder builder) {
        return builder.baseUrl(properties.aiServiceUrl()).build();
    }
}
