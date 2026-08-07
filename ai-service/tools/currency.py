# ============================================================
# Destination -> Currency Mapping
# ============================================================

DESTINATION_CURRENCY = {

    # UAE
    "dubai": "AED",
    "abu dhabi": "AED",

    # India
    "mumbai": "INR",
    "delhi": "INR",
    "dwarka": "INR",
    "goa": "INR",
    "jaipur": "INR",

    # Japan
    "tokyo": "JPY",
    "osaka": "JPY",

    # France
    "paris": "EUR",

    # Italy
    "rome": "EUR",
    "venice": "EUR",

    # Germany
    "berlin": "EUR",

    # UK
    "london": "GBP",

    # USA
    "new york": "USD",
    "los angeles": "USD",
    "las vegas": "USD",

    # Singapore
    "singapore": "SGD",

    # Thailand
    "bangkok": "THB",

    # Indonesia
    "bali": "IDR",

    # Turkey
    "istanbul": "TRY",

    # Russia
    "moscow": "RUB",

    # Switzerland
    "zurich": "CHF",

    # Australia
    "sydney": "AUD",

    # Canada
    "toronto": "CAD",
}


# ============================================================
# Helper Function
# ============================================================

def get_currency(destination: str | None) -> str:
    """
    Returns the currency code for a destination.
    Defaults to INR since primary departures are from India.
    """

    if not destination:
        return "INR"

    # We always prioritize INR for API calls when departing from India
    return DESTINATION_CURRENCY.get(
        destination.lower(),
        "INR",
    )


def convert_to_inr(price: float, from_currency: str) -> float:
    """
    Converts a price from any currency to standard INR.
    """
    if not price or price <= 0:
        return 0.0

    curr = (from_currency or "INR").strip().upper().replace("$", "USD").replace("€", "EUR").replace("£", "GBP")
    if curr in ["INR", "RS", "₹"]:
        return round(price, 1)

    rates_to_inr = {
        "USD": 86.0,
        "EUR": 92.0,
        "GBP": 110.0,
        "AED": 23.4,
        "SGD": 64.0,
        "THB": 2.5,
        "IDR": 0.0053,
        "JPY": 0.55,
        "AUD": 54.0,
        "CAD": 60.0,
        "CHF": 96.0,
    }

    rate = rates_to_inr.get(curr, 86.0)
    return round(price * rate, 1)