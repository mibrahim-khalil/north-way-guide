FROM node:18-bookworm

# Install Python
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node deps
COPY package*.json ./
RUN npm ci || npm install

# Create Python venv and install Python deps
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY ml_service_v2/requirements.txt ./ml_service_v2/requirements.txt
RUN pip install --no-cache-dir -r ./ml_service_v2/requirements.txt

# Copy backend code
COPY . .

EXPOSE 5000

# Start FastAPI in background, then start Node
CMD sh -c "cd /app/ml_service_v2 && uvicorn service:app --host 127.0.0.1 --port 8000 & cd /app && npm start"