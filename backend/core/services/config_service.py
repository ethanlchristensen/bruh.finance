import json
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic import BaseModel


class Config(BaseModel):

    allowed_hosts: List[str]
    media_root: str


class ConfigService:
    _config: Optional[Config] = None

    @classmethod
    @lru_cache(maxsize=1)
    def load_config(cls, config_path: str = "config.json") -> Config:
        """Load and validate configuration from JSON file"""
        path = Path(config_path)

        if not path.is_absolute():
            path = Path(__file__).parent.parent.parent / config_path

        if not path.exists():
            raise FileNotFoundError(f"Config file not found at: {path}")

        with open(path, "r") as f:
            config_data = json.load(f)

        cls._config = Config(**config_data)
        return cls._config

    @classmethod
    def get_config(cls) -> Optional[Config]:
        if cls._config is None:
            cls.load_config()

        return cls._config

    @classmethod
    def reload_config(cls, config_path: str = "config.json") -> Config:
        cls._config = None
        cls.load_config.cache_clear()
        return cls.load_config(config_path)


def get_config() -> Optional[Config]:
    return ConfigService.get_config()
