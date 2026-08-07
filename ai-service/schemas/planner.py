from pydantic import BaseModel, Field


class UserPreferences(BaseModel):

    food_preferences: list[str] = Field(default_factory=list)

    accommodation_type: str | None = None

    transport_preference: str | None = None

    accessibility_needs: list[str] = Field(default_factory=list)


class ClarificationResponse(BaseModel):

    questions: list[str] = Field(default_factory=list)

    message: str


class TripRequirements(BaseModel):

    departure: str | None = None
    destination: str | None = None
    duration_days: int | None = None

    budget: int | None = None
    travelers: int | None = None

    travel_style: str | None = None

    interests: list[str] = Field(default_factory=list)

    preferences: UserPreferences = Field(
        default_factory=UserPreferences
    )

    start_date: str | None = None
    end_date: str | None = None          # NEW

    special_requests: list[str] = Field(default_factory=list)

    missing_fields: list[str] = Field(default_factory=list)