from pydantic import BaseModel


class FlightRecommendation(BaseModel):

    airline: str

    flight_number: str

    departure_airport: str

    arrival_airport: str

    departure_time: str | None

    arrival_time: str | None

    duration: str

    price: float

    currency: str

    stops: int


class FlightRecommendations(BaseModel):

    flights: list[FlightRecommendation]
