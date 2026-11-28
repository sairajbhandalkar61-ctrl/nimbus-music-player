import os
import subprocess
import sys


ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
DIST_FRONTEND_DIR = os.path.join(FRONTEND_DIR, "dist")
ICON_PATH = os.path.join(FRONTEND_DIR, "public", "icon.ico")


def build_frontend() -> None:
    """Install dependencies if missing and build the Vite React PWA bundle."""
    npm_bin = "npm.cmd" if sys.platform == "win32" else "npm"
    if not os.path.exists(os.path.join(FRONTEND_DIR, "node_modules")):
        print("[Build] Installing frontend dependencies...")
        subprocess.run([npm_bin, "install"], cwd=FRONTEND_DIR, check=True)

    print("[Build] Building frontend production bundle...")
    subprocess.run([npm_bin, "run", "build"], cwd=FRONTEND_DIR, check=True)

    if not os.path.exists(os.path.join(DIST_FRONTEND_DIR, "index.html")):
        raise FileNotFoundError("Frontend build did not produce frontend/dist/index.html")


def build_executable() -> None:
    """Package desktop.py, backend, ML engine, dataset, and frontend into dist/Nimbus/Nimbus.exe."""
    sep = os.pathsep

    data_entries = [
        (os.path.join(ROOT_DIR, "backend"), "backend"),
        (os.path.join(ROOT_DIR, "src"), "src"),
        (os.path.join(ROOT_DIR, "data", "spotify_dataset.csv"), "data"),
        (DIST_FRONTEND_DIR, os.path.join("frontend", "dist")),
    ]

    hidden_imports = [
        "backend.main",
        "backend.paths",
        "backend.services.catalog",
        "backend.services.itunes",
        "backend.services.proxy",
        "backend.services.artwork",
        "src.data_preprocessing",
        "src.recommender",
        "uvicorn",
        "uvicorn.logging",
        "uvicorn.loops",
        "uvicorn.loops.auto",
        "uvicorn.protocols",
        "uvicorn.protocols.http",
        "uvicorn.protocols.http.auto",
        "uvicorn.protocols.http.h11_impl",
        "uvicorn.protocols.websockets",
        "uvicorn.protocols.websockets.auto",
        "uvicorn.lifespan",
        "uvicorn.lifespan.on",
        "fastapi",
        "starlette",
        "pydantic",
        "anyio",
        "httpx",
        "httpcore",
        "h11",
        "sklearn",
        "sklearn.neighbors",
        "sklearn.neighbors._typedefs",
        "sklearn.neighbors._partition_nodes",
        "sklearn.preprocessing",
        "sklearn.utils._cython_blas",
        "sklearn.utils._weight_vector",
        "scipy.special.cython_special",
        "pandas",
        "numpy",
        "webview",
    ]

    excluded_modules = [
        "torch",
        "torchaudio",
        "torchvision",
        "tensorflow",
        "keras",
        "tensorboard",
        "onnxruntime",
        "openvino",
        "jax",
        "matplotlib",
        "IPython",
        "ipykernel",
        "jupyter",
        "nbformat",
        "notebook",
        "jedi",
        "parso",
        "pytest",
        "_pytest",
        "pyarrow",
        "dask",
        "numba",
        "llvmlite",
        "tkinter",
        "_tkinter",
        "PyQt5",
        "PyQt6",
        "PySide2",
        "PySide6",
        "wx",
    ]

    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--clean",
        "--onedir",
        "--windowed",
        "--name",
        "Nimbus",
        "--collect-all",
        "webview",
        "--collect-submodules",
        "uvicorn",
        "--collect-submodules",
        "sklearn",
    ]

    for mod in excluded_modules:
        cmd.extend(["--exclude-module", mod])

    if os.path.exists(ICON_PATH):
        cmd.extend(["--icon", ICON_PATH])

    for src_path, dest_path in data_entries:
        cmd.extend(["--add-data", f"{src_path}{sep}{dest_path}"])

    for mod in hidden_imports:
        cmd.extend(["--hidden-import", mod])

    cmd.append(os.path.join(ROOT_DIR, "desktop.py"))

    print("[Build] Packaging Nimbus Windows desktop app with PyInstaller...")
    subprocess.run(cmd, cwd=ROOT_DIR, check=True)

    exe_path = os.path.join(ROOT_DIR, "dist", "Nimbus", "Nimbus.exe")
    print(f"[Build] Done! Standalone desktop executable created at: {exe_path}")


if __name__ == "__main__":
    build_frontend()
    build_executable()
