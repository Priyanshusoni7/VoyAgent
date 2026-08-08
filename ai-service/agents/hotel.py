import logging

from graph.state import TravelState
from schemas.hotel import HotelRecommendations
from tools.hotel_search import search_hotels

logger = logging.getLogger(__name__)


# ============================================================
# HOTEL NODE
# ============================================================

def hotel_node(state: TravelState):
    planner = state["planner_output"]

    try:
        hotel_output = search_hotels(planner)

    except Exception:
        # A search outage must never break the conversation. The plan is still
        # delivered, just without hotel options.
        logger.exception("Hotel search failed for destination=%s", planner.destination)
        hotel_output = HotelRecommendations(hotels=[])

    return {
        "hotel_output": hotel_output,
    }
