from langchain_core.messages import AIMessage

from graph.state import TravelState
from schemas.planner import ClarificationResponse


# ============================================================
# CLARIFICATION AGENT
# ============================================================

# Asked in this order. Destination first because everything else depends on it.
FIELD_PRIORITY = [
    "destination",
    "duration_days",
    "budget",
    "travelers",
    "departure",
    "travel_style",
]

QUESTION_MAP = {
    "departure": "Which city are you flying out from?",
    "destination": "Where would you like to go?",
    "duration_days": "How many days do you have?",
    "budget": "Roughly what's your total budget?",
    "travelers": "How many people are travelling?",
    "travel_style": "What kind of trip is this — budget, comfort, luxury or adventure?",
}

# Never interrogate. Two questions at a time keeps the chat feeling human.
MAX_QUESTIONS_PER_TURN = 2


def _ordered_missing(missing_fields: list[str]) -> list[str]:
    known = [field for field in FIELD_PRIORITY if field in missing_fields]
    extra = [field for field in missing_fields if field not in FIELD_PRIORITY]

    return known + extra


def _opening_line(planner, asked: list[str], remaining: int) -> str:
    destination = getattr(planner, "destination", None)

    if "destination" in asked:
        return "I'd love to help you plan this! 🌍"

    if destination:
        if remaining:
            return f"{destination} is a great choice! Just a couple more things:"

        return f"{destination} is a great choice! One more thing:"

    return "Great — let's get this planned."


def clarification_node(state: TravelState):
    planner = state["planner_output"]

    missing = _ordered_missing(list(planner.missing_fields or []))
    asked = missing[:MAX_QUESTIONS_PER_TURN]
    remaining = len(missing) - len(asked)

    questions = [
        QUESTION_MAP.get(field, f"Could you tell me your {field.replace('_', ' ')}?")
        for field in asked
    ]

    lines = [_opening_line(planner, asked, remaining), ""]

    if len(questions) == 1:
        lines.append(questions[0])
    else:
        lines.extend(f"• {question}" for question in questions)

    if remaining > 0:
        lines.append("")
        lines.append(
            f"_(I'll ask about {remaining} more detail"
            f"{'s' if remaining > 1 else ''} after this.)_"
        )

    message = "\n".join(lines)

    clarification = ClarificationResponse(
        questions=questions,
        message=message,
    )

    return {
        "clarification_output": clarification,
        "messages": [AIMessage(content=message)],
        "current_agent": "clarification",
    }
