import logging

from langchain_core.messages import AIMessage
from langchain_core.prompts import ChatPromptTemplate

from graph.state import TravelState
from llm.gemini import llm
from schemas.critic import ValidationResult
from schemas.planner import ClarificationResponse

logger = logging.getLogger(__name__)

critic_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """
        You are the Critic Agent for VoyAgent. Review the total price of the Proposed Hotels and Flights against the User's Total Budget.

        If the sum of the cheapest flight and cheapest hotel exceeds the total budget, the trip is impossible.
        Set is_valid to False, and in 'critique', write a polite message asking the user if they want to increase their budget or change their dates.
        If the budget is fine, set is_valid to True.
        """
    ),
    (
        "human",
        """
        User Budget: {budget}

        Proposed Hotel: {hotel_output}
        Proposed Flight: {flight_output}
        """
    )
])

critic_llm = llm.with_structured_output(ValidationResult)
critic_chain = critic_prompt | critic_llm


def _has_results(recommendations, attribute: str) -> bool:
    return bool(recommendations and getattr(recommendations, attribute, None))


def critic_node(state: TravelState):
    planner = state.get("planner_output")
    hotels = state.get("hotel_output")
    flights = state.get("flight_output")

    has_hotels = _has_results(hotels, "hotels")
    has_flights = _has_results(flights, "flights")
    budget = getattr(planner, "budget", None) if planner else None

    # Nothing priced to check, or no budget to check it against: skip the LLM
    # call entirely and let the plan through.
    if not budget or not (has_hotels or has_flights):
        logger.info(
            "Skipping budget validation (budget=%s, hotels=%s, flights=%s)",
            bool(budget), has_hotels, has_flights,
        )
        return {
            "critic_output": ValidationResult(
                is_valid=True,
                critique="Budget validation skipped: nothing to compare.",
            ),
            "current_agent": "critic",
        }

    try:
        validation = critic_chain.invoke({
            "budget": budget,
            "hotel_output": hotels.model_dump_json() if hotels else "",
            "flight_output": flights.model_dump_json() if flights else "",
        })

    except Exception:
        # Never block a finished plan because validation failed.
        logger.exception("Budget validation failed; passing the plan through")
        return {
            "critic_output": ValidationResult(
                is_valid=True,
                critique="Budget validation unavailable.",
            ),
            "current_agent": "critic",
        }

    if not validation.is_valid:
        # Trigger Human-in-the-Loop!
        clarification = ClarificationResponse(
            questions=["Budget constraint violated"],
            message=validation.critique,
        )
        return {
            "critic_output": validation,
            "clarification_output": clarification,
            "messages": [AIMessage(content=validation.critique)],
            "current_agent": "critic"
        }

    return {
        "critic_output": validation,
        "current_agent": "critic"
    }
