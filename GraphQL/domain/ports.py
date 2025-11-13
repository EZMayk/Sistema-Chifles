from typing import Any, List, Optional, Type


class RestPort:
    """Port interface for REST access used by usecases."""

    async def get_json(self, path: str, params: dict | None = None) -> Any:  # pragma: no cover
        raise NotImplementedError()

    async def get_parsed_list(self, path: str, model: Type, params: dict | None = None) -> List:
        raise NotImplementedError()

    async def get_parsed(self, path: str, model: Type):
        raise NotImplementedError()
