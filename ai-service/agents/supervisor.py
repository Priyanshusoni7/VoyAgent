from graph.state import TravelState


# ============================================================
# SUPERVISOR NODE
# ============================================================

def supervisor_node(state: TravelState):
    return {
        "current_agent": "planner"
    }
