"""App factory and wiring for GraphQL layer.

This module is intentionally small: it exposes `settings`, `schema` and `app`.
Resolvers, types and helpers live in separate modules under `app/`.
"""

import os
from typing import Any

import strawberry
from strawberry.fastapi import GraphQLRouter
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
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

    # Montar el router GraphQL (Strawberry). `graphiql=True` suele servir
    # la UI interactiva automáticamente, pero añadimos una página estática
    # como fallback por compatibilidad con entornos donde la UI no arranca.
    graphql_app = GraphQLRouter(schema, graphiql=True, context_getter=get_context)
    app.include_router(graphql_app, prefix='/graphql')

        # Página GraphiQL estática (fallback). Usamos el snippet clásico
        # compatible con la versión 1.x de GraphiQL para evitar problemas
        # de incompatibilidad de API con versiones más nuevas.
        GRAPHIQL_HTML = '''<!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>GraphiQL</title>
            <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
        </head>
        <body style="margin:0; height:100vh;">
            <div id="graphiql" style="height:100vh"></div>
            <script crossorigin src="https://unpkg.com/react/umd/react.production.min.js"></script>
            <script crossorigin src="https://unpkg.com/react-dom/umd/react-dom.production.min.js"></script>
            <script src="https://unpkg.com/graphiql/graphiql.min.js"></script>
            <script>
                // fetcher clásico compatible con GraphiQL 1.x
                function graphQLFetcher(graphQLParams) {
                    return fetch('/graphql', {
                        method: 'post',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(graphQLParams),
                    }).then(function (response) {
                        return response.text().then(function (text) {
                            try {
                                return JSON.parse(text);
                            } catch (e) {
                                return text;
                            }
                        });
                    });
                }

                ReactDOM.render(
                    React.createElement(GraphiQL, { fetcher: graphQLFetcher }),
                    document.getElementById('graphiql')
                );
            </script>
        </body>
    </html>'''

    @app.get('/graphql', include_in_schema=False, response_class=HTMLResponse)
    async def graphiql_playground():
        return HTMLResponse(content=GRAPHIQL_HTML, status_code=200)

    # Alias seguro para la UI: servir la misma página en /graphiql
    @app.get('/graphiql', include_in_schema=False, response_class=HTMLResponse)
    async def graphiql_playground_alias():
        return HTMLResponse(content=GRAPHIQL_HTML, status_code=200)

    @app.get('/health')
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
