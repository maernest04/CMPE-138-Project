"""
Advisors CRUD and list with capacity (current teams / max_teams).
Example router for teammates to copy pattern.
"""
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates

from app.db import execute_query

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


@router.get("")
async def list_advisors(request: Request):
    """List all advisors with current team count and remaining capacity."""
    rows = execute_query("""
        SELECT a.advisor_id, a.name, a.email, a.department, a.max_teams,
               COUNT(aa.advisor_assignment_id) AS current_teams
        FROM advisor a
        LEFT JOIN advisor_assignment aa ON a.advisor_id = aa.advisor_id
        GROUP BY a.advisor_id, a.name, a.email, a.department, a.max_teams
        ORDER BY a.name
    """)
    for r in rows:
        r["remaining"] = max(0, r["max_teams"] - (r["current_teams"] or 0))
    return templates.TemplateResponse(
        request=request,
        name="advisors/list.html",
        context={"request": request, "advisors": rows},
    )
