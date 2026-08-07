import json
import os
import requests

from dotenv import load_dotenv

from schemas.hotel import (
    HotelRecommendation,
    HotelRecommendations,
)

from schemas.planner import TripRequirements
from .currency import get_currency, convert_to_inr
from .date_utils import calculate_trip_dates
load_dotenv()

SERP_API_KEY = os.getenv("SERPAPI_KEY")

BASE_URL = "https://serpapi.com/search"

def convert_property(property_data: dict, default_currency: str = "INR") -> HotelRecommendation:

    nearby_places = property_data.get("nearby_places", [])

    if nearby_places:
        location = nearby_places[0].get("name", "Unknown")
    else:
        location = "Unknown"

    rate = property_data.get("rate_per_night", {})

    price = rate.get(
        "extracted_lowest",
        0,
    )
    if not price and rate.get("extracted_before_taxes_fees"):
        price = rate.get("extracted_before_taxes_fees", 0)

    price_text = rate.get(
        "lowest",
        "",
    )

    # ------------------------------------
    # Detect Currency Symbol
    # ------------------------------------

    if price_text.startswith("$"):
        detected_currency = "USD"
    elif price_text.startswith("₹") or "\u20b9" in price_text:
        detected_currency = "INR"
    elif price_text.startswith("€"):
        detected_currency = "EUR"
    elif price_text.startswith("£"):
        detected_currency = "GBP"
    elif price_text.startswith("AED"):
        detected_currency = "AED"
    else:
        detected_currency = default_currency

    # Standardize all output prices to INR
    if detected_currency != "INR":
        price = convert_to_inr(float(price), detected_currency)
        currency = "INR"
    else:
        price = float(price)
        currency = "INR"

    return HotelRecommendation(

        name=property_data.get(
            "name",
            "Unknown",
        ),

        location=location,

        price_per_night=float(price),

        currency=currency,

        booking_url=property_data.get(
            "link",
        ),

        rating=float(
            property_data.get(
                "overall_rating",
                0,
            )
        ),

        hotel_class=property_data.get(
            "hotel_class",
        ),

        image_url=property_data.get(
            "images",
            [{}],
        )[0].get(
            "thumbnail"
        )
        if property_data.get("images")
        else None,

        amenities=property_data.get(
            "amenities",
            [],
        ),
    )

def parse_hotels(raw_response: dict, trip_requirements: TripRequirements = None, default_currency: str = "INR", max_price_per_night: int = None) -> HotelRecommendations:

    properties = raw_response.get("properties", [])

    # Determine if user is explicitly asking for budget/backpacking accommodations or has a low budget limit
    is_budget = False
    if trip_requirements:
        if trip_requirements.travel_style and any(k in trip_requirements.travel_style.lower() for k in ["budget", "backpack", "hostel"]):
            is_budget = True
        if trip_requirements.preferences and trip_requirements.preferences.accommodation_type and any(k in trip_requirements.preferences.accommodation_type.lower() for k in ["hostel", "dorm"]):
            is_budget = True

    if max_price_per_night:
        if (default_currency == "INR" and max_price_per_night <= 2500) or (default_currency == "USD" and max_price_per_night <= 35):
            is_budget = True
        else:
            # If the daily hotel budget is generous (> 2500 INR/night), do not treat as a low-tier/hostel search
            is_budget = False

    filtered_properties = []
    for property_data in properties:
        rate = property_data.get("rate_per_night", {})
        price = rate.get("extracted_lowest", 0)
        if not price:
            price = rate.get("extracted_before_taxes_fees", 0)

        # Skip items with no valid price
        if price <= 0:
            continue

        # If a max budget per night is defined, enforce it with a 15% grace margin for taxes/fees
        if max_price_per_night and max_price_per_night > 0 and price > max_price_per_night * 1.15:
            continue

        name = property_data.get("name", "").lower()
        prop_type = property_data.get("type", "").lower()

        # If not budget requested, filter out dorm beds, hostels, apartments, rented rooms, and homestays
        if not is_budget:
            non_hotel_keywords = [
                "hostel", "zostel", "backpack", "apartment", "homestay", "home stay",
                "guest house", "guesthouse", "villa", "cottage", "rented", "rental",
                "residence", "service apartment", "room stay"
            ]
            if any(kw in name for kw in non_hotel_keywords) or any(kw in prop_type for kw in non_hotel_keywords):
                continue
            # Also filter out abnormally low dorm rates (< 1500 INR or < 25 USD) when standard hotels/resorts are expected
            if default_currency == "INR" and price < 1500:
                continue
            if default_currency == "USD" and price < 25:
                continue

        filtered_properties.append(property_data)

    # Fallback if strict budget/filtering excluded everything
    if not filtered_properties and max_price_per_night:
        filtered_properties = [p for p in properties if p.get("rate_per_night", {}).get("extracted_lowest", 0) > 0]
    if not filtered_properties:
        filtered_properties = [p for p in properties if p.get("rate_per_night", {}).get("extracted_lowest", 0) > 0]
        if not filtered_properties:
            filtered_properties = properties

    # Sort properties so that highest-rated hotels closest to the user's budget capacity come first
    if max_price_per_night and max_price_per_night > 0:
        def score_property(p):
            rate = p.get("rate_per_night", {})
            price = rate.get("extracted_lowest") or rate.get("extracted_before_taxes_fees") or 0
            rating = float(p.get("overall_rating", 0))
            
            # Score based on how well the hotel utilizes the available budget combined with overall rating
            budget_ratio = min(price / max_price_per_night, 1.0)
            if not is_budget and budget_ratio < 0.4:
                # Penalize bottom-tier cheap hotels when budget can afford nicer 3-star/4-star properties
                price_score = budget_ratio * 0.5
            else:
                price_score = budget_ratio
            return (rating * 2.0) + (price_score * 5.0)

        filtered_properties.sort(key=score_property, reverse=True)
    else:
        filtered_properties.sort(key=lambda p: float(p.get("overall_rating", 0)), reverse=True)

    hotels = []

    for property_data in filtered_properties[:3]:

        hotels.append(
            convert_property(property_data, default_currency=default_currency)
        )

    return HotelRecommendations(
        hotels=hotels
    )

def search_hotels(
    trip_requirements: TripRequirements,
):

    check_in, check_out = calculate_trip_dates(
        trip_requirements.start_date,
        trip_requirements.end_date,
        trip_requirements.duration_days,
    )

    # Standardize all requests to INR as primary departure/user base is India
    currency = "INR"

    # Calculate duration days accurately
    duration_days = trip_requirements.duration_days
    if not duration_days or duration_days <= 0:
        from datetime import datetime
        try:
            if check_in and check_out:
                d1 = datetime.strptime(check_in, "%Y-%m-%d")
                d2 = datetime.strptime(check_out, "%Y-%m-%d")
                duration_days = (d2 - d1).days
        except Exception:
            pass
    if not duration_days or duration_days <= 0:
        duration_days = 3

    # Calculate 50% hotel budget rule: (total_budget * 0.5) / duration_days
    max_price_per_night = None
    if trip_requirements.budget and trip_requirements.budget > 0:
        max_price_per_night = int((trip_requirements.budget * 0.5) / duration_days)

    # Build intelligent search query so Google Hotels returns actual hotels & resorts tailored to preferences & budget
    search_query_parts = [trip_requirements.destination or ""]

    if trip_requirements.preferences and trip_requirements.preferences.accommodation_type:
        search_query_parts.append(trip_requirements.preferences.accommodation_type)
    elif max_price_per_night and max_price_per_night > 2500:
        # When budget allows > 2500/night, query standard/nice 3-star and 4-star hotels even if general style says 'budget travel'
        if trip_requirements.travel_style and "luxury" in trip_requirements.travel_style.lower():
            search_query_parts.append("luxury hotels resorts")
        elif trip_requirements.travel_style and "resort" in trip_requirements.travel_style.lower():
            search_query_parts.append("resorts")
        else:
            search_query_parts.append("hotels")
    elif trip_requirements.travel_style:
        style = trip_requirements.travel_style.lower()
        if "luxury" in style:
            search_query_parts.append("luxury hotels resorts")
        elif "budget" in style or "backpack" in style:
            search_query_parts.append("budget hotels hostels")
        elif "resort" in style or "family" in style:
            search_query_parts.append("resorts")
        else:
            search_query_parts.append("hotels")
    else:
        search_query_parts.append("hotels resorts")

    search_query = " ".join(part for part in search_query_parts if part).strip()

    params = {

        "engine": "google_hotels",

        "q": search_query,

        "check_in_date": check_in,

        "check_out_date": check_out,

        "adults": trip_requirements.travelers or 1,

        "currency": currency,

        "hl": "en",

        "gl": "in",

        "api_key": SERP_API_KEY,
    }

    if max_price_per_night and max_price_per_night > 0:
        params["max_price"] = max_price_per_night

    response = requests.get(
        BASE_URL,
        params=params,
        timeout=30,
    )

    response.raise_for_status()

    raw_response = response.json()

    return parse_hotels(raw_response, trip_requirements=trip_requirements, default_currency=currency, max_price_per_night=max_price_per_night)
