from pydantic import BaseModel


class Activity(BaseModel):

    time: str

    title: str

    description: str

    location: str

    estimated_cost: float

    notes: str | None = None


class DayPlan(BaseModel):

    day: int

    title: str

    activities: list[Activity]


class DetailedItinerary(BaseModel):

    itinerary: list[DayPlan]
