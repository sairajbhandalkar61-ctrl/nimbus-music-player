import os
import sys


def get_resource_path(*parts: str) -> str:
    """Resolve a bundled (PyInstaller _MEIPASS) or repository resource path."""
    base = getattr(sys, "_MEIPASS", None)
    if not base:
        base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return os.path.join(base, *parts)


def get_cache_dir() -> str:
    """Return a writable cache directory in both normal and frozen desktop mode."""
    if getattr(sys, "frozen", False):
        local_app_data = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
        return os.path.join(local_app_data, "Nimbus", "cache")
    return os.path.join(get_resource_path("backend"), ".cache")
