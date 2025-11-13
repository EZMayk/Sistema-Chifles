"""App factory and wiring for GraphQL layer.

This module is intentionally small: it exposes `settings`, `schema` and `app`.
Resolvers, types and helpers live in separate modules under `app/`.
"""

import os
from typing import Any

import strawberry
from strawberry.fastapi import GraphQLRouter
from fastapi import FastAPI
from dotenv import load_dotenv

from .clients import RESTClient
from .resolvers import Query as ResolversQuery


load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))


class Settings:
    def __init__(self):
        self.API_URL: str = os.getenv('API_URL', 'http://127.0.0.1:3000/chifles')
        self.PORT: int = int(os.getenv('PORT', '8000'))
        self.DEBUG: bool = os.getenv('DEBUG', 'True').lower() in ('1', 'true', 'yes')


settings = Settings()


# Create Strawberry schema from extracted resolvers
schema = strawberry.Schema(query=ResolversQuery)


def create_app() -> FastAPI:
    app = FastAPI(title="Sistema-Chifles Reports (GraphQL)")

    # Lifecycle: create a single RESTClient instance and store it on app.state
    @app.on_event("startup")
    async def startup_event() -> None:
        print("GraphQL report service starting. API_URL=", settings.API_URL)
        app.state.rest_client = RESTClient(settings.API_URL)

    @app.on_event("shutdown")
    async def shutdown_event() -> None:
        client = getattr(app.state, 'rest_client', None)
        if client is not None:
            await client.close()

    async def get_context(request) -> dict[str, Any]:
        return {"rest": request.app.state.rest_client}

    graphql_app = GraphQLRouter(schema, context_getter=get_context)
    app.include_router(graphql_app, prefix='/graphql')

    @app.get('/health')
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
