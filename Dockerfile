# Nimbus Music Player (Full-Stack FastAPI + Vite PWA Server)
# Deploy this container on any HTTPS host (Render, Railway, Fly.io) to install
# Nimbus as a Mobile/Desktop PWA and serve as the remote API backend for Android APKs.
FROM python:3.11-slim

# Install Node.js 20
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy frontend package.json and install frontend dependencies
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install
WORKDIR /app

# Copy application files
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY src/ ./src/
COPY data/ ./data/
COPY start.py ./

# Build Vite frontend
WORKDIR /app/frontend
RUN npm run build
WORKDIR /app

ENV PORT=3000
EXPOSE 3000

CMD ["python", "start.py"]
