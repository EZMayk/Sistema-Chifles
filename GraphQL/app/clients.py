import httpx
from typing import Any, List, Type, Optional


class RESTClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self._client = httpx.AsyncClient(base_url=self.base_url, timeout=10.0)

    async def get_json(self, path: str, params: dict = None) -> Any:
        # path can be '/pedidos' or '/pedidos/1'
        url = path if path.startswith('/') else f'/{path}'
        resp = await self._client.get(url, params=params)
        resp.raise_for_status()
        return resp.json()

    async def get_parsed_list(self, path: str, model: Type, params: dict = None) -> List:
        data = await self.get_json(path, params=params)
        if not isinstance(data, list):
            # Some endpoints may return object; handle gracefully
            return [model.parse_obj(data)] if data else []
        return [model.parse_obj(item) for item in data]

    async def get_parsed(self, path: str, model: Type[Any]) -> Optional[Any]:
        data = await self.get_json(path)
        if not data:
            return None
        return model.parse_obj(data)

    async def close(self):
        await self._client.aclose()
