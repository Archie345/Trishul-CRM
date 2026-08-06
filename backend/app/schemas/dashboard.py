from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_leads: int
    new_leads: int
    contacted_leads: int
    qualified_leads: int
    lost_leads: int