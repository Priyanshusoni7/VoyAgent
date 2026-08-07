from pydantic import BaseModel, Field

class ValidationResult(BaseModel):
    is_valid: bool = Field(description="True if the plan meets user constraints, False if the constraints (like budget) are impossible.")
    critique: str = Field(description="If impossible, write a polite message to the user explaining why (e.g. 'The cheapest flights are ₹8,000, which exceeds your budget') and ask them how they want to proceed.")
