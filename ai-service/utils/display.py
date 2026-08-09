import json

from schemas.planner import TripRequirements
from schemas.hotel import HotelRecommendation
from schemas.flight import FlightRecommendation
from schemas.itinerary import DayPlan
from schemas.final import FinalTravelPlan


# ============================================================
# DISPLAY
# ============================================================

def display_trip_requirements(
    requirements: TripRequirements,
):

    print("\n========================================")
    print("        TRIP REQUIREMENTS")
    print("========================================")

    print(f"Departure       : {requirements.departure or 'Not Provided'}")
    print(f"Destination     : {requirements.destination or 'Not Provided'}")
    print(f"Duration        : {requirements.duration_days or 'Not Provided'}")
    print(f"Budget          : {requirements.budget or 'Not Provided'}")
    print(f"Travelers       : {requirements.travelers or 'Not Provided'}")
    print(f"Travel Style    : {requirements.travel_style or 'Not Provided'}")
    print(f"Start Date      : {requirements.start_date or 'Not Provided'}")

    # ---------------- Interests ----------------

    print("\nInterests")
    print("----------------------------------------")

    if requirements.interests:
        for interest in requirements.interests:
            print(f"• {interest}")
    else:
        print("None")

    # ---------------- Preferences ----------------

    print("\nUser Preferences")
    print("----------------------------------------")

    prefs = requirements.preferences

    print(
        f"Accommodation : {prefs.accommodation_type or 'Not Provided'}"
    )

    print(
        f"Transport     : {prefs.transport_preference or 'Not Provided'}"
    )

    print("Food Preferences")

    if prefs.food_preferences:
        for food in prefs.food_preferences:
            print(f"• {food}")
    else:
        print("None")

    print("\nAccessibility Needs")

    if prefs.accessibility_needs:
        for need in prefs.accessibility_needs:
            print(f"• {need}")
    else:
        print("None")

    # ---------------- Special Requests ----------------

    print("\nSpecial Requests")
    print("----------------------------------------")

    if requirements.special_requests:
        for request in requirements.special_requests:
            print(f"• {request}")
    else:
        print("None")

    # ---------------- Missing Fields ----------------

    print("\nMissing Fields")
    print("----------------------------------------")

    if requirements.missing_fields:
        for field in requirements.missing_fields:
            print(f"• {field}")
    else:
        print("None")

    print("\n========================================\n")


def display_clarification(message_content: str):

    print("\nVoyAgent\n")

    print(message_content)


def display_hotel_recommendations(hotels: list[HotelRecommendation]):

    print("\n==============================")
    print("HOTEL RECOMMENDATIONS")
    print("==============================")

    for i, hotel in enumerate(hotels, start=1):

        print(f"\nHotel {i}")

        print(f"Name       : {hotel.name}")
        print(f"Location   : {hotel.location}")
        print(f"Price      : {hotel.currency} {hotel.price_per_night}")
        print(f"Rating     : {hotel.rating}")       
        print(f"Hotel Class: {hotel.hotel_class or 'N/A'}")
        if hotel.booking_url:
            print(f"Booking URL: {hotel.booking_url}")
        print(f"Image URL  : {hotel.image_url}")

        print("Amenities")

        for amenity in hotel.amenities:
            print(f"• {amenity}")


def display_flight_recommendations(flights: list[FlightRecommendation]):

    print("\n==============================")
    print("FLIGHT RECOMMENDATIONS")
    print("==============================")

    for flight in flights:

        print(f"\n✈ Airline      : {flight.airline}")
        print(f"Flight No.     : {flight.flight_number}")
        print(f"From           : {flight.departure_airport}")
        print(f"To             : {flight.arrival_airport}")
        print(f"Departure      : {flight.departure_time}")
        print(f"Arrival        : {flight.arrival_time}")
        print(f"Duration       : {flight.duration}")
        print(f"Stops          : {flight.stops}")
        print(f"Price          : {flight.currency} {flight.price}")


def display_itinerary(itinerary: list[DayPlan]):

    print("\n==============================")
    print("ITINERARY")
    print("==============================")

    for day in itinerary:

        print(f"\n📅 Day {day.day}: {day.title}")

        for activity in day.activities:

            print(f"\n🕒 {activity.time}")
            print(f"Activity : {activity.title}")
            print(f"Location : {activity.location}")
            print(f"Description : {activity.description}")
            print(f"Estimated Cost : {activity.estimated_cost}")

            if activity.notes:
                print(f"Notes : {activity.notes}")


def display_final_travel_plan(final: FinalTravelPlan):

    print("\n========================================")
    print("FINAL TRAVEL PLAN")
    print("========================================")

    print(final.summary)

    print("\nTravel Tips")

    for tip in final.important_tips:

        print(f"• {tip}")
