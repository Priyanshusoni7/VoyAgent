import json
import os
import requests
from dotenv import load_dotenv

from schemas.flight import (
    FlightRecommendation,
    FlightRecommendations,
)
from schemas.planner import TripRequirements
from .currency import get_currency, convert_to_inr
from .date_utils import calculate_trip_dates

load_dotenv()

SERP_API_KEY = os.getenv("SERPAPI_KEY")
BASE_URL = "https://serpapi.com/search"


# ============================================================
# Simple City to Airport Code Mapping (Student-Friendly Helper)
# ============================================================

CITY_AIRPORT_CODES = {
    # India
    "mumbai": "BOM",
    "delhi": "DEL",
    "goa": "GOI",
    "bangalore": "BLR",
    "bengaluru": "BLR",
    "hyderabad": "HYD",
    "chennai": "MAA",
    "kolkata": "CCU",
    "pune": "PNQ",
    "ahmedabad": "AMD",
    "jaipur": "JAI",
    "kochi": "COK",
    "cochin": "COK",

    # International
    "dubai": "DXB",
    "abu dhabi": "AUH",
    "london": "LHR",
    "new york": "JFK",
    "tokyo": "HND",
    "paris": "CDG",
    "rome": "FCO",
    "singapore": "SIN",
    "bangkok": "BKK",
    "bali": "DPS",
    "zurich": "ZRH",
    "sydney": "SYD",
}


def get_airport_code(city_or_code: str | None, fallback: str = "DEL") -> str:
    """
    Converts a city name like 'Mumbai' to its IATA airport code 'BOM'.
    If already a 3-letter code, returns uppercase code directly.
    """
    if not city_or_code:
        return fallback

    clean = city_or_code.strip().lower()

    if clean in CITY_AIRPORT_CODES:
        return CITY_AIRPORT_CODES[clean]

    # If it is already a 3-letter code like 'BOM' or 'GOI'
    if len(clean) == 3 and clean.isalpha():
        return clean.upper()

    return fallback


def convert_flight(flight_data: dict, default_currency: str = "INR") -> FlightRecommendation:
    """
    Converts raw SerpAPI google_flights dictionary to FlightRecommendation model.
    Guarantees INR output.
    """
    flights_list = flight_data.get("flights", [])
    first_segment = flights_list[0] if flights_list else {}
    last_segment = flights_list[-1] if flights_list else {}

    airline = first_segment.get("airline", "Unknown Airline")
    flight_number = first_segment.get("flight_number", "N/A")

    dep_info = first_segment.get("departure_airport", {})
    arr_info = last_segment.get("arrival_airport", {})

    departure_airport = dep_info.get("name") or dep_info.get("id") or "Origin"
    arrival_airport = arr_info.get("name") or arr_info.get("id") or "Destination"

    departure_time = dep_info.get("time", "N/A")
    arrival_time = arr_info.get("time", "N/A")

    duration_min = flight_data.get("total_duration", 0)
    if duration_min:
        duration_str = f"{duration_min // 60}h {duration_min % 60}m"
    else:
        duration_str = "N/A"

    raw_price = float(flight_data.get("price", 0))
    if default_currency != "INR":
        price = convert_to_inr(raw_price, default_currency)
    else:
        price = raw_price

    stops = max(0, len(flights_list) - 1)

    return FlightRecommendation(
        airline=airline,
        flight_number=flight_number,
        departure_airport=departure_airport,
        arrival_airport=arrival_airport,
        departure_time=departure_time,
        arrival_time=arrival_time,
        duration=duration_str,
        price=price,
        currency="INR",
        stops=stops,
    )


def parse_flights(raw_response: dict, trip_requirements: TripRequirements = None, default_currency: str = "INR", max_flight_price: int = None) -> FlightRecommendations:
    """
    Parses best_flights and other_flights, enforcing budget and returning top 3 recommendations.
    """
    all_flights = raw_response.get("best_flights", []) + raw_response.get("other_flights", [])

    valid_flights = [f for f in all_flights if float(f.get("price") or 0) > 0]
    valid_flights.sort(key=lambda x: float(x.get("price") or 0))

    filtered_flights = []
    if max_flight_price and max_flight_price > 0:
        for flight_data in valid_flights:
            price = float(flight_data.get("price") or 0)
            # If max flight budget per traveler is specified, enforce it with a 15% margin
            if price <= max_flight_price * 1.15:
                filtered_flights.append(flight_data)

    # Fallback to cheapest available valid flights if filtering excluded everything
    if not filtered_flights:
        filtered_flights = valid_flights

    recommendations = []
    for flight_data in filtered_flights[:3]:
        recommendations.append(convert_flight(flight_data, default_currency="INR"))

    return FlightRecommendations(flights=recommendations)


def search_flights(trip_requirements: TripRequirements) -> FlightRecommendations:
    """
    Searches live flights using SerpAPI Google Flights engine based on TripRequirements.
    Enforces the 35% flight budget allocation rule across travelers and guarantees INR currency.
    """
    check_in, check_out = calculate_trip_dates(
        trip_requirements.start_date,
        trip_requirements.end_date,
        trip_requirements.duration_days,
    )

    currency = "INR"

    departure_id = get_airport_code(trip_requirements.departure, fallback="DEL")
    arrival_id = get_airport_code(trip_requirements.destination, fallback="GOI")

    travelers = trip_requirements.travelers or 1

    # Calculate 35% flight budget rule: (total_budget * 0.35) / travelers
    max_flight_price = None
    if trip_requirements.budget and trip_requirements.budget > 0:
        max_flight_price = int((trip_requirements.budget * 0.35) / travelers)

    params = {
        "engine": "google_flights",
        "departure_id": departure_id,
        "arrival_id": arrival_id,
        "outbound_date": check_in,
        "return_date": check_out,
        "type": "1",  # 1 = Round Trip
        "adults": travelers,
        "currency": currency,
        "hl": "en",
        "gl": "in",
        "api_key": SERP_API_KEY,
    }

    response = requests.get(BASE_URL, params=params, timeout=30)
    response.raise_for_status()

    raw_response = response.json()

    return parse_flights(raw_response, trip_requirements=trip_requirements, default_currency=currency, max_flight_price=max_flight_price)
