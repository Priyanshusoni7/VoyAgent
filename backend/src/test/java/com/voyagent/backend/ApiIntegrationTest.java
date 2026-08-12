package com.voyagent.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voyagent.backend.config.AppProperties;
import com.voyagent.backend.security.JwtService;
import de.flapdoodle.embed.mongo.distribution.Version;
import de.flapdoodle.embed.mongo.transitions.Mongod;
import de.flapdoodle.embed.mongo.transitions.RunningMongodProcess;
import de.flapdoodle.embed.process.io.ProcessOutput;
import de.flapdoodle.reverse.TransitionWalker;
import de.flapdoodle.reverse.transitions.Start;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end check of the endpoints the Next.js frontend calls, against a real
 * mongod and a stubbed AI service.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ApiIntegrationTest {

    private static final String JWT_SECRET = "test-secret-that-is-long-enough-1234";

    /** Produced by Node's bcryptjs for "password123" - proves stored hashes still verify. */
    private static final String NODE_BCRYPT_HASH =
            "$2b$10$7buP9ETNHBrwrSVyGDBqMu05sL4a6VtInKF6niZzb8tH/2PzaIgIW";

    private static final String AI_SERVICE_URL = "http://ai-service.test";

    private static TransitionWalker.ReachedState<RunningMongodProcess> mongod;

    /** Stands in for the FastAPI AI service. */
    private static MockRestServiceServer aiService;

    private static Cookie authCookie;
    private static String tripId;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    /** Replaces the AI service RestClient with one backed by MockRestServiceServer. */
    @TestConfiguration
    static class AiServiceStub {

        @Bean
        @Primary
        RestClient stubbedAiServiceClient() {
            RestClient.Builder builder = RestClient.builder().baseUrl(AI_SERVICE_URL);
            aiService = MockRestServiceServer.bindTo(builder).build();
            return builder.build();
        }
    }

    @BeforeAll
    static void startMongo() {
        mongod = Mongod.builder()
                .processOutput(Start.to(ProcessOutput.class).initializedWith(ProcessOutput.silent()))
                .build()
                .start(Version.Main.V7_0);
    }

    @AfterAll
    static void stopMongo() {
        if (mongod != null) {
            mongod.close();
        }
    }

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri",
                () -> "mongodb://" + mongod.current().getServerAddress() + "/voyagent-test");
        registry.add("app.jwt-secret", () -> JWT_SECRET);
        registry.add("app.ai-service-url", () -> AI_SERVICE_URL);
    }

    /** Queues one AI-service reply and asserts on the request the backend sends. */
    private static void expectAiCall(String expectedPrompt, String expectedThreadId, String responseBody) {
        aiService.reset();
        aiService.expect(requestTo(AI_SERVICE_URL + "/planner/plan-trip"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers
                        .jsonPath("$.prompt").value(expectedPrompt))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers
                        .jsonPath("$.thread_id").value(expectedThreadId))
                .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));
    }

    // ------------------------------------------------------------------
    // Health
    // ------------------------------------------------------------------

    @Test
    @Order(1)
    void healthEndpointsMatchTheExpressContract() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));

        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").exists());
    }

    // ------------------------------------------------------------------
    // Auth
    // ------------------------------------------------------------------

    @Test
    @Order(2)
    void protectedRoutesRejectAnonymousCallers() throws Exception {
        mockMvc.perform(get("/api/trips"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Not authorized. Please login."));

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(3)
    void signupCreatesTheUserAndSetsTheAuthCookie() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Test User\",\"email\":\"Test@Example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("User registered successfully"))
                .andExpect(jsonPath("$.user._id").isNotEmpty())
                .andExpect(jsonPath("$.user.name").value("Test User"))
                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                .andExpect(jsonPath("$.user.password").doesNotExist())
                .andReturn();

        String setCookie = result.getResponse().getHeader("Set-Cookie");
        assertThat(setCookie).contains("token=").contains("HttpOnly").contains("SameSite=Lax");

        authCookie = result.getResponse().getCookie("token");
        assertThat(authCookie).isNotNull();
    }

    @Test
    @Order(4)
    void signupRejectsDuplicatesAndInvalidInput() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("User already exists"));

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"A\",\"email\":\"not-an-email\",\"password\":\"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(5)
    void loginFailsWithTheWrongPasswordAndSucceedsWithTheRightOne() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"test@example.com\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"test@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                .andReturn();

        authCookie = result.getResponse().getCookie("token");
        assertThat(authCookie).isNotNull();
    }

    @Test
    @Order(6)
    void meReturnsTheLoggedInUser() throws Exception {
        mockMvc.perform(get("/api/auth/me").cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.user._id").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                .andExpect(jsonPath("$.message").doesNotExist());
    }

    // ------------------------------------------------------------------
    // Trips
    // ------------------------------------------------------------------

    @Test
    @Order(7)
    void planTripReturnsClarificationAndKeepsTheThread() throws Exception {
        expectAiCall("Trip to Goa", "thread-1", """
                {"status":"clarification_needed","thread_id":"thread-1",
                 "clarification":{"missing_fields":["budget","duration_days"],
                                  "question":"What is your budget?"},
                 "final_plan":null}""");

        mockMvc.perform(post("/api/trips/plan")
                        .cookie(authCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"prompt\":\"Trip to Goa\",\"threadId\":\"thread-1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.status").value("clarification_needed"))
                .andExpect(jsonPath("$.threadId").value("thread-1"))
                .andExpect(jsonPath("$.clarification.missing_fields[0]").value("budget"))
                .andExpect(jsonPath("$.clarification.question").value("What is your budget?"))
                .andExpect(jsonPath("$.trip").doesNotExist());

        aiService.verify();
    }

    @Test
    @Order(8)
    void planTripReturnsTheSavedTripOnceTheAiServiceCompletes() throws Exception {
        // The backend replays the whole thread, joined the way Express joined it.
        expectAiCall("Trip to Goa\nUser: Budget is 30000", "thread-1", """
                {"status":"completed","thread_id":"thread-1","clarification":null,
                 "final_plan":{"hotels":{"hotels":[{"name":"Sea View","price_per_night":"4500"}]},
                               "flights":{"flights":[{"price":"5200"}]},
                               "itinerary":{"itinerary":[{"day":1}]}}}""");

        MvcResult result = mockMvc.perform(post("/api/trips/plan")
                        .cookie(authCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"prompt\":\"Budget is 30000\",\"threadId\":\"thread-1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("completed"))
                .andExpect(jsonPath("$.threadId").value("thread-1"))
                .andExpect(jsonPath("$.clarification").doesNotExist())
                .andExpect(jsonPath("$.trip._id").isNotEmpty())
                .andExpect(jsonPath("$.trip.status").value("completed"))
                // Both turns are kept on the same thread, as the Express backend did.
                .andExpect(jsonPath("$.trip.promptHistory.length()").value(2))
                .andExpect(jsonPath("$.trip.promptHistory[0]").value("Trip to Goa"))
                .andExpect(jsonPath("$.trip.finalPlan.hotels.hotels[0].name").value("Sea View"))
                .andExpect(jsonPath("$.trip.createdAt").isNotEmpty())
                .andReturn();

        aiService.verify();

        tripId = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("trip").path("_id").asText();

        assertThat(tripId).isNotBlank();
    }

    @Test
    @Order(9)
    void planTripRequiresAPrompt() throws Exception {
        mockMvc.perform(post("/api/trips/plan")
                        .cookie(authCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"threadId\":\"thread-1\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Prompt is required"));
    }

    @Test
    @Order(10)
    void listAndFetchTripsForTheOwner() throws Exception {
        mockMvc.perform(get("/api/trips").cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.trips[0]._id").value(tripId));

        mockMvc.perform(get("/api/trips/" + tripId).cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.trip._id").value(tripId))
                .andExpect(jsonPath("$.trip.threadId").value("thread-1"));

        mockMvc.perform(get("/api/trips/000000000000000000000000").cookie(authCookie))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Trip not found"));
    }

    @Test
    @Order(11)
    void anotherUserCannotReadOrDeleteTheTrip() throws Exception {
        MvcResult signup = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Other User\",\"email\":\"other@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isCreated())
                .andReturn();

        Cookie otherCookie = signup.getResponse().getCookie("token");

        mockMvc.perform(get("/api/trips/" + tripId).cookie(otherCookie))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Not authorized to access this trip"));

        mockMvc.perform(delete("/api/trips/" + tripId).cookie(otherCookie))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Not authorized to delete this trip"));

        // The other user's trip list stays empty.
        mockMvc.perform(get("/api/trips").cookie(otherCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
    }

    @Test
    @Order(12)
    void ownerCanDeleteTheTrip() throws Exception {
        mockMvc.perform(delete("/api/trips/" + tripId).cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Trip deleted successfully"));

        mockMvc.perform(get("/api/trips/" + tripId).cookie(authCookie))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(13)
    void logoutExpiresTheCookie() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"))
                .andReturn();

        assertThat(result.getResponse().getHeader("Set-Cookie")).contains("Max-Age=0");
    }

    @Test
    @Order(14)
    void corsAllowsTheFrontendOriginWithCredentials() throws Exception {
        mockMvc.perform(get("/api/trips")
                        .header("Origin", "http://localhost:3000")
                        .cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(result -> assertThat(
                        result.getResponse().getHeader("Access-Control-Allow-Credentials")).isEqualTo("true"))
                .andExpect(result -> assertThat(
                        result.getResponse().getHeader("Access-Control-Allow-Origin"))
                        .isEqualTo("http://localhost:3000"));
    }

    // ------------------------------------------------------------------
    // Compatibility with data written by the previous Node backend
    // ------------------------------------------------------------------

    @Test
    @Order(15)
    void bcryptHashesWrittenByNodeStillVerify() {
        assertThat(new BCryptPasswordEncoder(10).matches("password123", NODE_BCRYPT_HASH)).isTrue();
    }

    @Test
    @Order(16)
    void tokensIssuedByNodeJsonwebtokenStillVerify() {
        // jwt.sign({id: "65a1b2c3d4e5f60718293a4b"}, JWT_SECRET) from the Express backend.
        String nodeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
                + ".eyJpZCI6IjY1YTFiMmMzZDRlNWY2MDcxODI5M2E0YiJ9"
                + ".UiZ1FD7mANSiOG_FoVESJm9w_IEk0XXkyNEPy5zE-rk";

        JwtService jwtService = new JwtService(new AppProperties(
                "development", JWT_SECRET, Duration.ofDays(7), "http://localhost:8000", List.of()));

        assertThat(jwtService.readUserId(nodeToken)).isEqualTo("65a1b2c3d4e5f60718293a4b");
    }
}
