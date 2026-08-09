from api.planner import run_graph
from utils.display import (
    display_trip_requirements,
    display_clarification,
    display_hotel_recommendations,
    display_flight_recommendations,
    display_itinerary,
    display_final_travel_plan,
)


# ============================================================
# MAIN
# ============================================================



if __name__ == "__main__":

    print("\n========================================")
    print("        Welcome to VoyAgent")
    print("========================================\n")

    thread_id = "user-1"

    # The planner reads the newest user message as the whole thread, so the CLI
    # accumulates history the same way the backend does.
    history = []

    while True:

        user_input = input("You : ")

        if user_input.lower() == "exit":
            break

        history.append(user_input)

        result = run_graph(
            "\nUser: ".join(history),
            thread_id,
        )

        # Greeting / destination question: nothing was planned this turn.
        if result.get("assistant_reply") and result.get("intent") != "trip_planning":
            print(f"\nVoyAgent : {result['assistant_reply']}\n")
            continue

        planner = result.get("planner_output")

        if planner:
            display_trip_requirements(planner)

        if result.get("current_agent") in ("clarification", "critic") or not result.get("final_output"):

            display_clarification(result["messages"][-1].content)

        else:

            if result.get("hotel_output"):

                display_hotel_recommendations(result["hotel_output"].hotels)

            if result.get("flight_output"):

                display_flight_recommendations(result["flight_output"].flights)

            if result.get("itinerary_output"):

                display_itinerary(result["itinerary_output"].itinerary)

            if result.get("final_output"):

                display_final_travel_plan(result["final_output"])