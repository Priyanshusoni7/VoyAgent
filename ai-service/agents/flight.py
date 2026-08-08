import logging

from graph.state import TravelState
from schemas.flight import FlightRecommendations
from tools.flight_search import search_flights

logger = logging.getLogger(__name__)


# ============================================================
# FLIGHT NODE
# ============================================================

def flight_node(state: TravelState):
    planner = state["planner_output"]

    try:
        flight_output = search_flights(planner)

    except Exception:
        # Same policy as hotels: degrade to "no options found", never crash.
        logger.exception(
            "Flight search failed for %s -> %s",
            planner.departure,
            planner.destination,
        )
        flight_output = FlightRecommendations(flights=[])

    return {
        "flight_output": flight_output,
    }
