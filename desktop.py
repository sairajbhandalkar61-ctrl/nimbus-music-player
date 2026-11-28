import os
import socket
import sys
import threading
import time
import urllib.request

# Guard stdio in PyInstaller --windowed builds where stdout/stderr may be None
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w", encoding="utf-8")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w", encoding="utf-8")

BASE_DIR = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import uvicorn
import webview

from backend.main import app as fastapi_app


def find_free_port() -> int:
    """Bind an ephemeral localhost port and return its port number."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def wait_for_server(port: int, server_thread: threading.Thread, timeout: float = 120.0) -> bool:
    """Poll /api/health until the local FastAPI backend is ready or exits."""
    url = f"http://127.0.0.1:{port}/api/health"
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if not server_thread.is_alive():
            return False
        try:
            with urllib.request.urlopen(url, timeout=1.5) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            time.sleep(0.25)
    return False


def main() -> None:
    port = find_free_port()
    config = uvicorn.Config(
        fastapi_app,
        host="127.0.0.1",
        port=port,
        log_level="warning",
        log_config=None,
    )
    server = uvicorn.Server(config)

    server_thread = threading.Thread(target=server.run, daemon=True)
    server_thread.start()

    if not wait_for_server(port, server_thread):
        server.should_exit = True
        server_thread.join(timeout=3)
        raise RuntimeError("Nimbus backend failed to start in time.")

    webview.create_window(
        title="Nimbus",
        url=f"http://127.0.0.1:{port}",
        width=1280,
        height=820,
        min_size=(380, 640),
        background_color="#08080a",
    )

    try:
        webview.start()
    finally:
        server.should_exit = True
        server_thread.join(timeout=5)


if __name__ == "__main__":
    main()
