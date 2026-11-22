import os
import sys
import socket
import subprocess
import uvicorn

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def ensure_frontend_build():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(base_dir, "frontend", "dist")
    if not os.path.exists(dist_dir) or not os.path.exists(os.path.join(dist_dir, "index.html")):
        print("[Nimbus] Building frontend for production...")
        frontend_dir = os.path.join(base_dir, "frontend")
        npm_bin = "npm.cmd" if sys.platform == "win32" else "npm"
        subprocess.run([npm_bin, "run", "build"], cwd=frontend_dir, check=True)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "3000"))
    host = os.environ.get("HOST", "0.0.0.0")

    ensure_frontend_build()

    local_ip = get_local_ip()
    print("=" * 60)
    print("  🎵 Nimbus — Minimalist Audio Player & Recommender")
    print("=" * 60)
    print(f"  💻 Local (Laptop/PC):  http://localhost:{port}")
    print(f"  📱 Mobile (Same Wi-Fi): http://{local_ip}:{port}")
    print("=" * 60)

    uvicorn.run("backend.main:app", host=host, port=port)
