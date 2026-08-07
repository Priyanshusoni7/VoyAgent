from pydantic import BaseModel


class HotelRecommendation(BaseModel):

    name: str
    location: str
    price_per_night: float
    currency: str
    booking_url: str | None = None
    rating: float
    hotel_class: str | None = None      
    image_url: str | None = None        
    amenities: list[str]


class HotelRecommendations(BaseModel):

    hotels: list[HotelRecommendation]
