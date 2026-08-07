from datetime import datetime, timedelta


# ============================================================
# Calculate Trip Dates
# ============================================================

def calculate_trip_dates(
    start_date: str | None,
    end_date: str | None,
    duration_days: int | None,
):
    """
    Returns:
        (check_in_date, check_out_date)

    Format:
        YYYY-MM-DD
    """

    # --------------------------------------------------------
    # Case 1
    # User already provided both dates
    # --------------------------------------------------------

    if start_date and end_date:
        return start_date, end_date

    # --------------------------------------------------------
    # Case 2
    # User provided only start date
    # --------------------------------------------------------

    if start_date and duration_days:

        check_in = datetime.strptime(
            start_date,
            "%Y-%m-%d",
        )

        check_out = check_in + timedelta(
            days=duration_days
        )

        return (
            check_in.strftime("%Y-%m-%d"),
            check_out.strftime("%Y-%m-%d"),
        )

    # --------------------------------------------------------
    # Case 3
    # User didn't provide dates
    # Default:
    # Check-in after 30 days
    # --------------------------------------------------------

    check_in = datetime.today() + timedelta(days=30)

    duration = duration_days or 3

    check_out = check_in + timedelta(days=duration)

    return (
        check_in.strftime("%Y-%m-%d"),
        check_out.strftime("%Y-%m-%d"),
    )