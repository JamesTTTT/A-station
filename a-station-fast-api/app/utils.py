import os

def get_default_api_key_pattern() -> str:
    return "API_KEY_"

def get_api_keys_in_env(key_pattern: str) -> list[str]:
    keys = []
    for env_key in os.environ.keys():
        if env_key.startswith(key_pattern):
            value = os.getenv(env_key)
            if value:
                keys.append(value)
    return keys
