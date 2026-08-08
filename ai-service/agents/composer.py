import logging

from langchain_core.prompts import ChatPromptTemplate
from llm.gemini import llm
from schemas.final import FinalTravelPlan
from graph.state import TravelState

logger = logging.getLogger(__name__)


#composer prompt
composer_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are the Response Composer Agent of VoyAgent.

Your ONLY responsibility is combining the outputs
of all specialist agents.

You will receive:

1. Planner Output
2. Hotel Recommendations
3. Flight Recommendations
4. Detailed Itinerary

Generate:

- A short trip summary.
- Important travel tips.

Do NOT modify:

- Hotels
- Flights
- Itinerary

Simply combine them into one FinalTravelPlan.

Return ONLY the FinalTravelPlan schema.
"""
        ),

        (
            "human",
            """
Planner Output:

{planner_output}


Hotel Recommendations:

{hotel_output}


Flight Recommendations:

{flight_output}


Itinerary:

{itinerary_output}
"""
        ),
    ]
)


#composer llm
composer_llm = llm.with_structured_output(
    FinalTravelPlan
)


composer_chain = composer_prompt | composer_llm


def _fallback_plan(planner, hotels, flights, itinerary) -> FinalTravelPlan:
    """Assemble the plan without the LLM so finished search work is never lost."""
    nights = planner.duration_days or 0

    return FinalTravelPlan(
        summary=(
            f"Here's your {nights}-day trip to {planner.destination}."
            if planner.destination
            else "Here's your trip plan."
        ),
        destination=planner.destination or "Your destination",
        duration_days=planner.duration_days or 0,
        budget=planner.budget or 0,
        travelers=planner.travelers or 1,
        travel_style=planner.travel_style or "Comfort",
        hotels=hotels.hotels if hotels else [],
        flights=flights.flights if flights else [],
        itinerary=itinerary.itinerary if itinerary else [],
        important_tips=[
            "Double-check hotel and flight prices before booking.",
            "Carry a valid photo ID for check-in.",
        ],
    )


def response_composer_node(state: TravelState):
    planner = state["planner_output"]
    hotels = state.get("hotel_output")
    flights = state.get("flight_output")
    itinerary = state.get("itinerary_output")

    try:
        final_output = composer_chain.invoke(
            {
                "planner_output":
                planner.model_dump_json(indent=2),

                "hotel_output":
                hotels.model_dump_json(indent=2) if hotels else "[]",

                "flight_output":
                flights.model_dump_json(indent=2) if flights else "[]",

                "itinerary_output":
                itinerary.model_dump_json(indent=2) if itinerary else "[]",
            }
        )

    except Exception:
        logger.exception("Plan composition failed; assembling the plan directly")
        final_output = _fallback_plan(planner, hotels, flights, itinerary)

    return {
        "final_output": final_output,
        "current_agent": "composer"
    }
