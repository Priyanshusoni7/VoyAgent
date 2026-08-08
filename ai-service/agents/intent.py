import logging
import re

from langchain_core.prompts import ChatPromptTemplate

from graph.state import TravelState
from llm.gemini import llm
from schemas.intent import IntentResult

logger = logging.getLogger(__name__)


# ============================================================
# INTENT PROMPT
# ============================================================

intent_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are the Intent Agent of VoyAgent, an AI travel planner.

Read the conversation and decide what the user wants RIGHT NOW.

Choose exactly one intent:

- trip_planning: the user wants a trip planned, OR is answering questions about
  a trip (giving a destination, dates, budget, number of travellers, etc).
  Examples: "Plan 3 days in Goa for 2 under 25000", "Budget is 30000",
  "We're going from Mumbai", "4 days please".

- destination_info: the user is asking ABOUT a place, not asking for a plan.
  Examples: "Tell me about Goa", "Is Manali good in December?",
  "What's the food like in Kerala?"

- greeting: hello, hi, thanks, bye, and similar.

- smalltalk: chat that is not about a specific trip.

- other: anything that does not fit above.

IMPORTANT
- "I want to travel" or "help me plan a trip" with NO destination is
  trip_planning: the user does want a trip, they just have not given details yet.
- If the conversation already contains trip details, treat follow-up answers as
  trip_planning even if the latest message is short (like "2" or "Goa").

For every intent EXCEPT trip_planning, also write `reply`:
- Warm, natural, 2-3 sentences, in the assistant's own voice.
- For destination_info, genuinely answer the question with real, useful detail
  first, then offer to build a full plan.
- Always end by inviting the user toward planning a trip.
- Never invent hotel prices, flight prices or booking links.
"""
        ),
        (
            "human",
            "{conversation}"
        ),
    ]
)


intent_llm = llm.with_structured_output(IntentResult)

intent_chain = intent_prompt | intent_llm


# ============================================================
# FAST PATH
# ============================================================

# Pure greetings resolve without an LLM call at all.
_GREETING_RE = re.compile(
    r"^\s*(hi|hii+|hey+|hello+|yo|namaste|good\s*(morning|afternoon|evening))"
    r"[\s!.,]*$",
    re.IGNORECASE,
)

_THANKS_RE = re.compile(
    r"^\s*(thanks|thank\s*you|thx|ty|ok|okay|cool|nice|great|bye|goodbye)"
    r"[\s!.,]*$",
    re.IGNORECASE,
)

_GREETING_REPLY = (
    "Hey! I'm VoyAgent, your AI travel planner. 👋\n\n"
    "Tell me where you'd like to go and roughly how long you have, and I'll put "
    "together hotels, flights and a day-by-day itinerary for you.\n\n"
    "For example: \"3-day trip to Goa for 2 people under ₹25,000\"."
)

_THANKS_REPLY = (
    "Happy to help! 🙌\n\n"
    "Whenever you're ready for another trip, just tell me the destination and "
    "how many days you have."
)


def _latest_user_text(state: TravelState) -> str:
    """The newest user turn. The backend sends the full thread in this field."""
    messages = state.get("messages") or []

    for message in reversed(messages):
        if getattr(message, "type", None) == "human":
            return str(message.content)

    return ""


def _last_line(text: str) -> str:
    """The backend joins history with '\\nUser: ', so the last line is this turn."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    if not lines:
        return ""

    return re.sub(r"^User:\s*", "", lines[-1], flags=re.IGNORECASE)


# ============================================================
# INTENT NODE
# ============================================================

def intent_node(state: TravelState):
    conversation = _latest_user_text(state)
    latest_turn = _last_line(conversation)
    is_first_turn = "\n" not in conversation.strip()

    # Only treat a greeting as a greeting on the opening turn. Mid-conversation
    # an "ok" is usually the user agreeing, not restarting.
    if is_first_turn and _GREETING_RE.match(latest_turn):
        return {
            "intent": "greeting",
            "assistant_reply": _GREETING_REPLY,
        }

    if _THANKS_RE.match(latest_turn) and not is_first_turn:
        return {
            "intent": "greeting",
            "assistant_reply": _THANKS_REPLY,
        }

    try:
        result = intent_chain.invoke({"conversation": conversation})
    except Exception:
        # If intent detection fails, fall through to planning rather than
        # breaking the conversation - planning degrades gracefully on its own.
        logger.exception("Intent detection failed; defaulting to trip_planning")
        return {"intent": "trip_planning", "assistant_reply": None}

    if result.intent == "trip_planning":
        return {"intent": "trip_planning", "assistant_reply": None}

    reply = (result.reply or "").strip() or _GREETING_REPLY

    return {
        "intent": result.intent,
        "assistant_reply": reply,
    }


# ============================================================
# ROUTING
# ============================================================

def route_after_intent(state: TravelState):
    """Only trip planning is allowed to reach the expensive pipeline."""
    if state.get("intent") == "trip_planning":
        return "supervisor"

    return "respond"
