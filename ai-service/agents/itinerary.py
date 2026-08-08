import logging

from langchain_core.prompts import ChatPromptTemplate

from graph.state import TravelState
from llm.gemini import llm
from schemas.itinerary import DetailedItinerary

logger = logging.getLogger(__name__)


# 1.2 Itinerary Prompt
itinerary_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are the Itinerary Agent of VoyAgent.

Your ONLY responsibility is creating a day-wise travel itinerary.

You will receive TripRequirements.

Generate a detailed itinerary.

Each day should include:

- Morning
- Afternoon
- Evening

Recommend attractions that match:

- destination
- duration
- travel style
- interests

Keep the itinerary practical.

Do NOT recommend hotels.

Do NOT recommend flights.

Return ONLY the DetailedItinerary schema.
"""
        ),

        (
            "human",
            "{planner_output}"
        ),
    ]
)


# 2.2 Itinerary LLM
itinerary_llm = llm.with_structured_output(
    DetailedItinerary
)


# 3.2 Itinerary Chain
itinerary_chain = itinerary_prompt | itinerary_llm


# 4.2 Itinerary Node
def itinerary_node(state: TravelState):
    planner = state["planner_output"]

    try:
        itinerary_output = itinerary_chain.invoke(
            {
                "planner_output":
                planner.model_dump_json(indent=2)
            }
        )

    except Exception:
        # Degrade to an empty itinerary rather than failing the whole plan.
        logger.exception(
            "Itinerary generation failed for destination=%s",
            planner.destination,
        )
        itinerary_output = DetailedItinerary(itinerary=[])

    return {
        "itinerary_output": itinerary_output,
    }
