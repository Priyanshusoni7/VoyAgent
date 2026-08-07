from pydantic import BaseModel
from schemas.hotel import HotelRecommendation
from schemas.flight import FlightRecommendation
from schemas.itinerary import DayPlan


class FinalTravelPlan(BaseModel):

    summary: str

    destination: str

    duration_days: int

    budget: int

    travelers: int

    travel_style: str

    hotels: list[HotelRecommendation]

    flights: list[FlightRecommendation]

    itinerary: list[DayPlan]

    important_tips: list[str]
