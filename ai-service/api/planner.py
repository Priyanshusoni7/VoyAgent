import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from graph.builder import voyagent

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================
# REQUEST SCHEMA
# ============================================================

class PlannerRequest(BaseModel):

    prompt: str
    thread_id: str = "user-1"


class ClarificationPayload(BaseModel):
    missing_fields: list[str]
    question: str


class PlanTripResponse(BaseModel):
    status: str
    thread_id: str
    clarification: Optional[ClarificationPayload] = None
    final_plan: Optional[Dict[str, Any]] = None


# Shown when something genuinely broke. Conversational, never technical.
FALLBACK_MESSAGE = (
    "Sorry — I had trouble working on that just now. 😕\n\n"
    "Could you try sending it once more? If it keeps happening, try rephrasing "
    "your trip request, for example: \"4 days in Jaipur for 2 people, "
    "budget ₹30,000\"."
)


# ============================================================
# RUN GRAPH
# ============================================================

def run_graph(
    prompt: str,
    thread_id: str = "user-1",
):

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    result = voyagent.invoke(

        {
            "messages": [
                HumanMessage(content=prompt)
            ]
        },

        config=config,
    )

    return result


# ============================================================
# HELPERS
# ============================================================

def _conversational_response(thread_id: str, message: str, missing=None) -> PlanTripResponse:
    """
    Any reply that is not a finished plan travels on the existing
    `clarification_needed` contract, so the frontend needs no changes.
    """
    return PlanTripResponse(
        status="clarification_needed",
        thread_id=thread_id,
        clarification=ClarificationPayload(
            missing_fields=missing or [],
            question=message,
        ),
        final_plan=None,
    )


def _dump(value):
    return value.model_dump() if value else None


# ============================================================
# API
# ============================================================

@router.post("/plan-trip", response_model=PlanTripResponse)
def plan_trip(request: PlannerRequest):

    try:
        result = run_graph(
            request.prompt,
            request.thread_id,
        )

    except Exception:
        # Log the real cause, hand the user something they can act on.
        logger.exception("Graph execution failed for thread_id=%s", request.thread_id)
        return _conversational_response(request.thread_id, FALLBACK_MESSAGE)

    # ---- Cheap path: greeting / destination question / small talk ----------
    assistant_reply = result.get("assistant_reply")

    if assistant_reply and result.get("intent") != "trip_planning":
        return _conversational_response(request.thread_id, assistant_reply)

    # ---- Clarification, or planning that did not reach a final plan --------
    clarification_out = result.get("clarification_output")
    final_out = result.get("final_output")

    if clarification_out or not final_out:
        planner_output = result.get("planner_output")
        missing = planner_output.missing_fields if planner_output else []

        if clarification_out:
            question = clarification_out.message
        elif result.get("messages"):
            question = result["messages"][-1].content
        else:
            question = "Could you tell me a bit more about your trip?"

        return _conversational_response(request.thread_id, question, missing)

    # ---- Completed plan ----------------------------------------------------
    return PlanTripResponse(
        status="completed",
        thread_id=request.thread_id,
        clarification=None,
        final_plan={
            "planner_output": _dump(result.get("planner_output")),
            "hotels": _dump(result.get("hotel_output")),
            "flights": _dump(result.get("flight_output")),
            "itinerary": _dump(result.get("itinerary_output")),
            "final_output": _dump(final_out),
        }
    )
