import os
import sys
import subprocess
import time

port = os.environ.get("PORT", "3000")
print(f"[SOUNDWAVE] Starting production full-stack services. External PORT={port}")

# 1. Start FastAPI backend on 127.0.0.1:8000
backend_cmd = [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8000"]
backend_proc = subprocess.Popen(backend_cmd)
print("[SOUNDWAVE] FastAPI backend starting on 127.0.0.1:8000...")

# 2. Wait a brief moment for backend to initialize
time.sleep(4)

# 3. Start Next.js frontend on 0.0.0.0:$PORT
frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
# On Linux / Railway npm is 'npm', on Windows 'npm.cmd'
npm_bin = "npm.cmd" if sys.platform == "win32" else "npm"
frontend_cmd = [npm_bin, "start", "--", "-p", str(port)]
frontend_proc = subprocess.Popen(frontend_cmd, cwd=frontend_dir)
print(f"[SOUNDWAVE] Next.js frontend starting on 0.0.0.0:{port}...")

# 4. Monitor both processes
try:
    while True:
        b_code = backend_proc.poll()
        if b_code is not None:
            print(f"[SOUNDWAVE] Backend process exited with code {b_code}")
            frontend_proc.terminate()
            sys.exit(b_code)
            
        f_code = frontend_proc.poll()
        if f_code is not None:
            print(f"[SOUNDWAVE] Frontend process exited with code {f_code}")
            backend_proc.terminate()
            sys.exit(f_code)
            
        time.sleep(2)
except KeyboardInterrupt:
    print("[SOUNDWAVE] Shutting down...")
    backend_proc.terminate()
    frontend_proc.terminate()
