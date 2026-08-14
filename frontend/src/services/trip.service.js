import api from "../lib/axios";

// Plan or continue a trip conversation with VoyAgent AI
export const planTrip = async (data) => {
  const response = await api.post("/trips/plan", data);
  return response.data;
};

// Fetch all saved itineraries for the logged-in user
export const getUserTrips = async () => {
  const response = await api.get("/trips");
  return response.data;
};

// Fetch a single complete itinerary by ID
export const getTripById = async (id) => {
  const response = await api.get(`/trips/${id}`);
  return response.data;
};

// Delete a saved itinerary session
export const deleteTrip = async (id) => {
  const response = await api.delete(`/trips/${id}`);
  return response.data;
};
