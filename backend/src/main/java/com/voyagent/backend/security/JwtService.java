package com.voyagent.backend.security;

import com.voyagent.backend.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;

/**
 * Issues and reads the same HS256 token/cookie pair the Express backend used,
 * so sessions created before the migration remain valid.
 */
@Service
public class JwtService {

    public static final String COOKIE_NAME = "token";

    private static final int MIN_SECRET_BYTES = 32;

    private final SecretKey key;
    private final Duration expiration;
    private final boolean production;

    public JwtService(AppProperties properties) {
        byte[] secret = properties.jwtSecret() == null
                ? new byte[0]
                : properties.jwtSecret().getBytes(StandardCharsets.UTF_8);

        if (secret.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET must be at least " + MIN_SECRET_BYTES + " characters long for HS256.");
        }

        this.key = new SecretKeySpec(secret, "HmacSHA256");
        this.expiration = properties.jwtExpiration();
        this.production = properties.isProduction();
    }

    public String createToken(String userId) {
        Date now = new Date();

        return Jwts.builder()
                .claim("id", userId)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiration.toMillis()))
                .signWith(key)
                .compact();
    }

    /** @return the user id carried by the token, or null when it is invalid or expired. */
    public String readUserId(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return claims.get("id", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public ResponseCookie authCookie(String token) {
        return baseCookie(token).maxAge(expiration).build();
    }

    public ResponseCookie expiredCookie() {
        return baseCookie("").maxAge(0).build();
    }

    private ResponseCookie.ResponseCookieBuilder baseCookie(String value) {
        return ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)
                .secure(production)
                .sameSite(production ? "None" : "Lax")
                .path("/");
    }
}
