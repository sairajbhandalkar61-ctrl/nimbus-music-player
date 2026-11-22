import os
import sys
import re
import socket
import time
import subprocess
import threading
import urllib.request

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def update_readme_link(base_dir: str, live_url: str):
    readme_path = os.path.join(base_dir, "README.md")
    if os.path.exists(readme_path):
        try:
            with open(readme_path, "r", encoding="utf-8") as f:
                content = f.read()
            # Replace old trycloudflare link with new active link
            updated = re.sub(
                r"https://[a-zA-Z0-9-]+\.trycloudflare\.com",
                live_url,
                content
            )
            with open(readme_path, "w", encoding="utf-8") as f:
                f.write(updated)
            print(f"[Nimbus] Updated README.md with active live link: {live_url}")
        except Exception as e:
            print(f"[Nimbus] Notice: Could not update README.md: {e}")

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # Handle if running from parent directory
    if not os.path.exists(os.path.join(base_dir, "backend")) and os.path.exists(os.path.join(base_dir, "nimbus-music-player-main", "backend")):
        base_dir = os.path.join(base_dir, "nimbus-music-player-main")

    os.chdir(base_dir)
    port = int(os.environ.get("PORT", "3000"))
    local_ip = get_local_ip()

    # 1. Ensure frontend is built
    dist_index = os.path.join(base_dir, "frontend", "dist", "index.html")
    if not os.path.exists(dist_index):
        print("[Nimbus] Building React frontend...")
        npm_bin = "npm.cmd" if sys.platform == "win32" else "npm"
        subprocess.run([npm_bin, "run", "build"], cwd=os.path.join(base_dir, "frontend"), check=True)

    # 2. Start unified FastAPI backend + SPA server
    print(f"[Nimbus] Starting unified production server on 0.0.0.0:{port}...")
    server_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "backend.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        str(port),
    ]
    server_proc = subprocess.Popen(server_cmd)

    # Wait for server to become healthy
    print("[Nimbus] Waiting for server initialization...")
    health_url = f"http://127.0.0.1:{port}/api/health"
    ready = False
    for _ in range(60):
        try:
            with urllib.request.urlopen(health_url, timeout=2) as resp:
                if resp.status == 200:
                    ready = True
                    break
        except Exception:
            time.sleep(1)

    if not ready:
        print("[Nimbus] Warning: Server took longer than expected to initialize.")

    # 3. Start Cloudflare Tunnel
    print("[Nimbus] Creating secure live public tunnel (trycloudflare)...")
    npx_bin = "npx.cmd" if sys.platform == "win32" else "npx"
    tunnel_cmd = [
        npx_bin,
        "--yes",
        "cloudflared",
        "tunnel",
        "--url",
        f"http://127.0.0.1:{port}"
    ]
    tunnel_proc = subprocess.Popen(
        tunnel_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        encoding="utf-8",
        errors="replace"
    )

    live_url_holder = []

    def monitor_tunnel():
        url_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")
        for line in tunnel_proc.stdout:
            match = url_pattern.search(line)
            if match and not live_url_holder:
                live_url = match.group(0)
                live_url_holder.append(live_url)
                update_readme_link(base_dir, live_url)

                print("\n" + "=" * 76)
                print("  🎵  NIMBUS MUSIC PLAYER — LIVE & READY FOR MOBILE & PC!")
                print("=" * 76)
                print(f"  🌐  PUBLIC LIVE LINK (Any Mobile Phone / Laptop / Tablet anywhere):")
                print(f"      👉  {live_url}")
                print()
                print(f"  📱  MOBILE (On same Wi-Fi):")
                print(f"      👉  http://{local_ip}:{port}")
                print()
                print(f"  💻  LOCAL LAPTOP / PC:")
                print(f"      👉  http://localhost:{port}")
                print("=" * 76)
                print("  Press Ctrl+C to stop the player and tunnel.\n")

    t = threading.Thread(target=monitor_tunnel, daemon=True)
    t.start()

    # Wait for Ctrl+C or process exit
    try:
        while True:
            if server_proc.poll() is not None:
                print(f"[Nimbus] Server stopped (code {server_proc.returncode}).")
                break
            if tunnel_proc.poll() is not None:
                print(f"[Nimbus] Tunnel stopped (code {tunnel_proc.returncode}).")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[Nimbus] Gracefully shutting down server and tunnel...")
    finally:
        if server_proc.poll() is None:
            server_proc.terminate()
        if tunnel_proc.poll() is None:
            tunnel_proc.terminate()
        print("[Nimbus] Done. Goodbye!")

if __name__ == "__main__":
    main()
