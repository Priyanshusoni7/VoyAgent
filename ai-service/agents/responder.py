from langchain_core.messages import AIMessage

from graph.state import TravelState


# ============================================================
# RESPONDER NODE
# ============================================================

def responder_node(state: TravelState):
    """
    Emits a plain conversational reply for non-planning intents.

    This is the cheap path: no planner, no search, no itinerary generation.
    """
    reply = state.get("assistant_reply") or (
        "I'm here to help you plan a trip. Where would you like to go?"
    )

    return {
        "messages": [AIMessage(content=reply)],
        "current_agent": "responder",
    }
