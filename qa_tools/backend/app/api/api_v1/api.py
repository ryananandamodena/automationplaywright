from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, projects, environments, explorations, pages, test_cases

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(environments.router, prefix="", tags=["environments"])
api_router.include_router(explorations.router, prefix="", tags=["explorations"])
api_router.include_router(pages.router, prefix="", tags=["pages"])
api_router.include_router(test_cases.router, prefix="", tags=["test-cases"])
