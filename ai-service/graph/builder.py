from langgraph.graph import (
    StateGraph,
    START,
    END,
)

from graph.state import TravelState
from graph.memory import memory

from agents.intent import intent_node, route_after_intent
from agents.responder import responder_node
from agents.supervisor import supervisor_node
from agents.planning import planning_node
from agents.planner import planner_node
from agents.router import (
    router_node,
    route_after_router,
)
from agents.critic import critic_node
from agents.clarification import clarification_node
from agents.hotel import hotel_node
from agents.flight import flight_node
from agents.itinerary import itinerary_node
from agents.composer import response_composer_node


# ============================================================
# GRAPH
# ============================================================

graph = StateGraph(TravelState)

# ============================================================
# NODES
# ============================================================

graph.add_node(
    "intent",
    intent_node,
)

graph.add_node(
    "respond",
    responder_node,
)

graph.add_node(
    "supervisor",
    supervisor_node,
)

graph.add_node(
    "planner",
    planner_node,
)

graph.add_node(
    "router",
    router_node,
)

graph.add_node(
    "clarification",
    clarification_node,
)

graph.add_node(
    "planning",
    planning_node,
)

graph.add_node(
    "hotel",
    hotel_node,
)

graph.add_node(
    "flight",
    flight_node,
)

graph.add_node(
    "itinerary",
    itinerary_node,
)

graph.add_node(
    "composer",
    response_composer_node,
)

graph.add_node(
    "critic",
    critic_node
)

# ============================================================
# EDGES
# ============================================================

# Intent first: greetings, questions about a place and small talk are answered
# directly, without touching the planner, the search APIs or the itinerary LLM.
graph.add_edge(
    START,
    "intent",
)

graph.add_conditional_edges(
    "intent",
    route_after_intent,
    {
        "supervisor": "supervisor",
        "respond": "respond",
    },
)

graph.add_edge(
    "respond",
    END,
)

graph.add_edge(
    "supervisor",
    "planner",
)

graph.add_edge(
    "planner",
    "router",
)

graph.add_conditional_edges(
    "router",
    route_after_router,
    {
        "clarification": "clarification",
        "planning": "planning",
    },
)

graph.add_edge(
    "clarification",
    END,
)

# ---------------- 3-Way Parallel Planning Pipeline ----------------

# Fan-out: Planning Coordinator dispatches Hotel, Flight, and Itinerary agents simultaneously
graph.add_edge(
    "planning",
    "hotel",
)

graph.add_edge(
    "planning",
    "flight",
)

graph.add_edge(
    "planning",
    "itinerary",
)

# Fan-in: Response Composer Agent waits until all 3 parallel branches complete

graph.add_edge("hotel", "critic")

graph.add_edge("flight", "critic")

graph.add_edge("itinerary", "critic")


# 3. Add routing logic after the critic
def route_after_critic(state: TravelState):
    validation = state.get("critic_output")
    if validation and not validation.is_valid:
        # Stop planning and ask the user for help!
        return END
    
    # If valid, proceed to the composer
    return "composer"

# 4. Add the conditional edges
graph.add_conditional_edges(
    "critic",
    route_after_critic,
    {
        "composer": "composer",
        END: END
    }
)

graph.add_edge("composer", END)

# ============================================================
# COMPILE
# ============================================================

voyagent = graph.compile(
    checkpointer=memory
)