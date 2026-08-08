from graph.state import TravelState


# ============================================================
# ROUTER NODE
# ============================================================

def router_node(state: TravelState):
    planner = state["planner_output"]

    if planner.missing_fields:
        return {
            "current_agent": "clarification"
        }

    return {
        "current_agent": "planning",
        "clarification_output": None
    }


# ============================================================
# ROUTING FUNCTION
# ============================================================

def route_after_router(state: TravelState):

    return state["current_agent"]