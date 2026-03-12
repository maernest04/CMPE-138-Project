"""
Senior Capstone Viewer - FastAPI application.
Single-user (course professor) DBMS for CMPE 195 project tracking.
"""
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.routers import advisors

app = FastAPI(
    title="Senior Capstone Viewer",
    description="CMPE 195 project management for course professors",
)

# Templates and static files (run from project root: uvicorn app.main:app --reload)
BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

# Routers
app.include_router(advisors.router, prefix="/advisors", tags=["advisors"])


@app.get("/")
async def home(request: Request):
    """Dashboard / home page."""
    return templates.TemplateResponse(
        request=request, name="home.html", context={"request": request}
    )
