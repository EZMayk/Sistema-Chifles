from typing import Any, List, Type, Optional

from ...domain.ports import RestPort
from ..clients import RESTClient


class RestAdapter(RestPort):
    def __init__(self, client: RESTClient):
        self._client = client

    async def get_json(self, path: str, params: dict | None = None) -> Any:  # pragma: no cover
        return await self._client.get_json(path, params=params)

    async def get_parsed_list(self, path: str, model: Type, params: dict | None = None) -> List:
        return await self._client.get_parsed_list(path, model, params=params)

    async def get_parsed(self, path: str, model: Type):
        return await self._client.get_parsed(path, model)
