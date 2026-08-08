from typing import Literal

from pydantic import BaseModel, Field


class IntentResult(BaseModel):
    """What the user is actually asking for, decided before any expensive work."""

    intent: Literal[
        "greeting",
        "smalltalk",
        "destination_info",
        "trip_planning",
        "other",
    ] = Field(
        description=(
            "trip_planning ONLY when the user wants an actual trip planned or is "
            "supplying trip details. destination_info when they ask about a place "
            "without asking for a plan. greeting for hello/thanks/bye. "
            "smalltalk for chat unrelated to a specific trip. other otherwise."
        )
    )

    reply: str = Field(
        default="",
        description=(
            "A short, warm, helpful reply IN THE ASSISTANT'S VOICE. Required for "
            "every intent except trip_planning, where it is ignored. Two or three "
            "sentences, and it should nudge the user toward planning a trip."
        )
    )
